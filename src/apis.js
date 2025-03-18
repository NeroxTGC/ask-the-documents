import { prisma, HttpError } from "wasp/server";
import { toSql } from "pgvector/utils";
import openai from "openai";
import { env } from "wasp/server";
import cors from 'cors';

// Import the createEmbedding function from documents.ts
import { createEmbedding } from "./documents.ts";

const api = new openai.OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// API middleware for CORS
export const apiMiddleware = (middlewareConfig) => {
  // Configure CORS to allow requests from Chrome extension
  middlewareConfig.set('cors', cors({ 
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  return middlewareConfig;
};

// API endpoint for the Chrome extension
export const askDocumentsApi = async (req, res, context) => {
  try {
    console.log('[API] askDocumentsApi called');
    console.log('[API] Authentication status:', context.user ? 'Authenticated' : 'Not authenticated');
    
    // Check for authentication - if auth: true is set in main.wasp, we need to ensure user is authenticated
    if (!context.user) {
      console.log('[API] Authentication required but user not authenticated');
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (req.headers.authorization) {
      console.log('[API] Authorization header present');
    } else {
      console.log('[API] No authorization header found');
    }
    
    const { query } = req.body;
    console.log('[API] Query received:', query);
    
    if (!query) {
      console.log('[API] Error: Query is required');
      return res.status(400).json({ error: "Query is required" });
    }
    
    console.log('[API] Creating embedding for query');
    const queryEmbedding = await createEmbedding(query);
    console.log('[API] Embedding created');

    console.log('[API] Querying database for relevant sections');
    const result = (await prisma.$queryRaw`
      SELECT s."content", s."embedding" <-> ${toSql(
        queryEmbedding
      )}::vector AS "score", d."url"
      FROM "Section" s
      JOIN "Document" d ON s."documentId" = d."id"
      ORDER BY s."embedding" <-> ${toSql(queryEmbedding)}::vector
      LIMIT 2;
    `) ?? [];
    console.log('[API] Database query complete, found', result.length, 'results');

    // If no results found
    if (!result.length) {
      console.log('[API] No relevant documents found');
      return res.json({ answer: "No relevant documents found for your query." });
    }

    const prompt = `Provide an aswer to the following: ${query}
    
    You can use the following documents delimited by triple quotes:
    ${result
      .map((r) => `"""${r.content}"""\nSource URL: ${r.url}`)
      .join("\n\n")}`;

    console.log('[API] Sending prompt to OpenAI');
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
    console.log('[API] Received response from OpenAI');

    const content = completion.choices[0].message.content;

    if (!content) {
      console.log('[API] No content in OpenAI response');
      return res.json({ answer: "Sorry, I don't know the answer to that." });
    }

    console.log('[API] Returning answer to client');
    return res.json({ answer: content });
  } catch (error) {
    console.error("[API] Error in askDocumentsApi:", error);
    return res.status(500).json({ 
      error: "An error occurred while processing your request",
      message: error.message 
    });
  }
};
