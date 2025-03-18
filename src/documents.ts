import { type Document, type Section } from "wasp/entities";
import { DocumentWithScore } from "./types";
import {
  type EmbedDocument,
  type SearchDocuments,
  type AskDocuments,
  type DeleteDocument,
  type GetScrapeCandidates,
  type GetDocuments,
} from "wasp/server/operations";

import { prisma, HttpError, env } from "wasp/server";
// @ts-ignore
import { toSql } from "pgvector/utils";
import openai from "openai";
import { getContent, getLinksToScrape } from "./scrape.js";

const api = new openai.OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Aproximadamente 8000 tokens son unos 6000 caracteres
const MAX_CHUNK_SIZE = 6000;

type EmbedDocumentInput = {
  url: string;
  selector?: string;
};
type EmbedDocumentOutput = {
  success: boolean;
};

function splitIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  
  // Dividir por párrafos para mantener el contexto
  const paragraphs = text.split(/\n\n+/);
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // Si un párrafo es más largo que maxChunkSize, lo dividimos
      if (paragraph.length > maxChunkSize) {
        const words = paragraph.split(" ");
        currentChunk = "";
        for (const word of words) {
          if (currentChunk.length + word.length + 1 <= maxChunkSize) {
            currentChunk += (currentChunk ? " " : "") + word;
          } else {
            chunks.push(currentChunk);
            currentChunk = word;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

export const embedDocument: EmbedDocument<
  EmbedDocumentInput,
  EmbedDocumentOutput
> = async (args, { user }) => {
  if (!user) {
    throw new HttpError(401, "You must be logged in to embed documents");
  }
  const { url, selector } = args;

  console.log(`[Scraping] Starting to scrape URL: ${url}${selector ? `, with selector: ${selector}` : ''}`);

  // Scrape url to get the title and content
  const { title, markdownContent } = await getContent(url, selector);
  
  console.log(`[Scraping] Results:
    Title: ${title}
    Content length: ${markdownContent?.length || 0} chars
    Content preview: ${markdownContent?.substring(0, 200)}...`);

  if (!markdownContent || markdownContent.length === 0) {
    console.error('[Scraping] Error: No content was retrieved');
    throw new HttpError(400, "No content could be retrieved from the URL");
  }

  // Dividir el contenido en chunks si es muy largo
  const chunks = splitIntoChunks(markdownContent, MAX_CHUNK_SIZE);
  console.log(`[Scraping] Content split into ${chunks.length} chunks`);

  // Primero creamos el documento principal
  const document = await prisma.document.create({
    data: {
      title,
      url,
    }
  });

  // Luego creamos cada sección usando prisma.$executeRaw
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[Scraping] Processing chunk ${i + 1}/${chunks.length}, length: ${chunk.length} chars`);
    
    const embedding = toSql(await createEmbedding(chunk));

    await prisma.$executeRaw`
      INSERT INTO "Section" ("id", "content", "embedding", "orderIndex", "documentId")
      VALUES (gen_random_uuid(), ${chunk}, ${embedding}::vector, ${i}, ${document.id});
    `;
    console.log(`[Scraping] Successfully saved section ${i + 1} to database`);
  }

  return { success: true };
};

type GetDocumentsInput = void;
type GetDocumentsOutput = Document[];

export const getDocuments: GetDocuments<
  GetDocumentsInput,
  GetDocumentsOutput
> = async (_args, context) => {
  const documents = await context.entities.Document.findMany({
    include: {
      sections: {
        orderBy: {
          orderIndex: 'asc'
        }
      }
    }
  });
  return documents;
};

type SearchDocumentsInput = {
  query: string;
};
type SearchDocumentsOutput = DocumentWithScore[];

export const searchDocuments: SearchDocuments<
  SearchDocumentsInput,
  SearchDocumentsOutput
> = async (args, { user }) => {
  if (!user) {
    throw new HttpError(401, "You must be logged in to search documents");
  }
  const { query } = args;

  const embedding = toSql(await createEmbedding(query));

  // Buscar en las secciones y agrupar por documento
  const result = (await prisma.$queryRaw`
    WITH RankedSections AS (
      SELECT 
        s."documentId",
        MIN(s.embedding <-> ${embedding}::vector) as best_score
      FROM "Section" s
      GROUP BY s."documentId"
      ORDER BY best_score
      LIMIT 10
    )
    SELECT 
      d.id,
      d.title,
      d.url,
      d."createdAt",
      d."updatedAt",
      rs.best_score as score,
      json_agg(json_build_object(
        'id', s.id,
        'content', s.content,
        'orderIndex', s."orderIndex",
        'documentId', s."documentId"
      ) ORDER BY s."orderIndex") as sections
    FROM RankedSections rs
    JOIN "Document" d ON d.id = rs."documentId"
    JOIN "Section" s ON s."documentId" = d.id
    GROUP BY d.id, d.title, d.url, d."createdAt", d."updatedAt", rs.best_score
    ORDER BY rs.best_score;
  `) as {
    id: string;
    title: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
    score: number;
    sections: {
      id: string;
      content: string;
      orderIndex: number;
      documentId: string;
    }[];
  }[];

  return result.map((doc): DocumentWithScore => ({
    document: {
      id: doc.id,
      title: doc.title,
      url: doc.url,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      sections: doc.sections
    },
    score: doc.score,
  }));
};

type DeleteDocumentInput = {
  id: string;
};
type DeleteDocumentOutput = void;

export const deleteDocument: DeleteDocument<
  DeleteDocumentInput,
  DeleteDocumentOutput
> = async (args, context) => {
  const { id } = args;
  await context.entities.Document.delete({
    where: { id },
  });
};

type GetScrapeCandidatesInput = {
  url: string;
};
export const getScrapeCandidates = (async (args, context) => {
  const { url } = args;
  return getLinksToScrape(url);
}) satisfies GetScrapeCandidates<GetScrapeCandidatesInput>;

type AskDocumentsInput = {
  query: string;
};
type AskDocumentsOutput = {
  answer: string;
};

export const askDocuments: AskDocuments<
  AskDocumentsInput,
  AskDocumentsOutput
> = async (args) => {
  const { query } = args;
  const queryEmbedding = await createEmbedding(query);

  const result = (await prisma.$queryRaw`
    SELECT s."content", s."embedding" <-> ${toSql(
      queryEmbedding
    )}::vector AS "score", d."url"
    FROM "Section" s
    JOIN "Document" d ON s."documentId" = d."id"
    ORDER BY s."embedding" <-> ${toSql(queryEmbedding)}::vector
    LIMIT 2;
  `) as {
    content: string;
    score: number;
    url: string;
  }[];

  const prompt = `Provide an aswer to the following: ${query}
  
  You can use the following documents delimited by triple quotes:
  ${result
    .map((r) => `"""${r.content}"""\nSource URL: ${r.url}`)
    .join("\n\n")}`;

  const completion = await api.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a Q&A system. Respond concisiely. Do not make it conversational. Mention the source URL. Respond in Markdown. Respond only with content from the documents provided. If the answer is not clear from the documents, respond with 'I don't know'.",
      },
      { role: "user", content: prompt.slice(0, 4000) },
    ],
    model: "gpt-3.5-turbo",
  });

  const content = completion.choices[0].message.content;

  if (!content) {
    return { answer: "Sorry, I don't know the answer to that." };
  }

  return { answer: content };
};

export async function createEmbedding(text: string): Promise<number[]> {
  const apiResult = await api.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  const embedding = apiResult.data[0].embedding;
  return embedding;
}
