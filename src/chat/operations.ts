import { type Chat, type Message, type User, type Document, type Section } from 'wasp/entities';
import { 
  type GetChats, 
  type GetChat, 
  type CreateChat, 
  type AddMessage, 
  type GenerateChatResponse 
} from 'wasp/server/operations';
import { HttpError, prisma, env } from 'wasp/server';
import { createEmbedding } from '../documents';
import openai from 'openai';
// @ts-ignore
import { toSql } from 'pgvector/utils';

// Initialize OpenAI client for ChatGPT
const openaiApi = new openai.OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Initialize Deepseek client (compatible with OpenAI API)
const deepseekApi = new openai.OpenAI({
  apiKey: env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY, // Fallback to OpenAI if Deepseek API key is not provided
  baseURL: env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
});

// Tipos para operaciones
type GetChatsInput = void;
type GetChatsOutput = Chat[];

type GetChatInput = {
  id: string;
};
type GetChatOutput = Chat & {
  messages: Message[];
};

type CreateChatInput = {
  title: string;
};
type CreateChatOutput = Chat;

type AddMessageInput = {
  chatId: string;
  content: string;
  role: string;
  modelType: string;
};
type AddMessageOutput = Message;

type GenerateChatResponseInput = {
  chatId: string;
  message: string;
  modelType: string; // "rag", "deepseek", etc.
};
type GenerateChatResponseOutput = {
  message: Message;
};

/**
 * Obtiene todos los chats del usuario actual
 */
export const getChats: GetChats<GetChatsInput, GetChatsOutput> = async (
  _args: GetChatsInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view chats');
  }

  const chats = await prisma.chat.findMany({
    where: {
      userId: Number(context.user.id),
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return chats;
};

/**
 * Obtiene un chat específico con todos sus mensajes
 */
export const getChat: GetChat<GetChatInput, GetChatOutput> = async (
  args: GetChatInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to view a chat');
  }

  const { id } = args;
  
  // Validar que el ID existe
  if (!id) {
    throw new HttpError(400, 'Chat ID is required');
  }

  const chat = await prisma.chat.findUnique({
    where: {
      id,
      userId: Number(context.user.id),
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!chat) {
    throw new HttpError(404, 'Chat not found');
  }

  return chat;
};

/**
 * Crea un nuevo chat para el usuario actual
 */
export const createChat: CreateChat<CreateChatInput, CreateChatOutput> = async (
  args: CreateChatInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to create a chat');
  }

  const { title } = args;

  const chat = await prisma.chat.create({
    data: {
      title,
      userId: Number(context.user.id),
    },
  });

  // Crear mensaje de sistema inicial
  await prisma.message.create({
    data: {
      content: 'How can I help you today?',
      role: 'system',
      modelType: 'deepseek',
      chatId: chat.id,
    },
  });

  return chat;
};

/**
 * Añade un nuevo mensaje a un chat
 */
export const addMessage: AddMessage<AddMessageInput, AddMessageOutput> = async (
  args: AddMessageInput,
  context: any
) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to add a message');
  }

  const { chatId, content, role, modelType } = args;

  // Verificar que el chat pertenece al usuario
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
      userId: Number(context.user.id),
    },
  });

  if (!chat) {
    throw new HttpError(404, 'Chat not found or does not belong to you');
  }

  // Crear embedding para el mensaje (solo si es contenido del usuario)
  let messageData: any = {
    content,
    role,
    modelType,
    chatId
  };

  if (role === 'user') {
    try {
      const embeddingArray = await createEmbedding(content);
      messageData.embedding = toSql(embeddingArray);
    } catch (error) {
      console.error('Error creating embedding for message:', error);
      // Continuar sin embedding si falla
    }
  }

  // Crear mensaje
  const message = await prisma.message.create({
    data: messageData
  });

  // Actualizar la fecha de actualización del chat
  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  return message;
};

/**
 * Genera una respuesta de chat según el modelo seleccionado (RAG o Deepseek)
 */
export const generateChatResponse: GenerateChatResponse<
  GenerateChatResponseInput,
  GenerateChatResponseOutput
> = async (args: GenerateChatResponseInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to generate chat responses');
  }

  const { chatId, message, modelType } = args;

  // Verificar que el chat pertenece al usuario
  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
      userId: Number(context.user.id),
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
        take: 20, // Limitar a los últimos 20 mensajes para el contexto
      },
    },
  });

  if (!chat) {
    throw new HttpError(404, 'Chat not found or does not belong to you');
  }

  // Guardar el mensaje del usuario
  const userMessage = await prisma.message.create({
    data: {
      content: message,
      role: 'user',
      modelType: 'user',
      chatId
    }
  });

  let responseContent = '';

  // Generar respuesta según el modelo seleccionado
  if (modelType === 'rag') {
    responseContent = await generateRAGResponse(message);
  } else if (modelType === 'deepseek') {
    responseContent = await generateDeepseekResponse(message, chat.messages);
  } else {
    // Usar Deepseek como modelo por defecto
    responseContent = await generateDeepseekResponse(message, chat.messages);
  }

  // Guardar la respuesta del asistente
  const responseMessage = await prisma.message.create({
    data: {
      content: responseContent,
      role: 'assistant',
      modelType,
      chatId
    }
  });

  return { message: responseMessage };
};

/**
 * Genera una respuesta usando RAG (Recuperación Aumentada por Generación)
 */
async function generateRAGResponse(query: string): Promise<string> {
  try {
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

    const prompt = `Provide an answer to the following: ${query}
    
    You can use the following documents delimited by triple quotes:
    ${result
      .map((r) => `"""${r.content}"""\nSource URL: ${r.url}`)
      .join("\n\n")}`;

    const completion = await deepseekApi.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a Q&A system. Respond concisely. Mention the source URL. Respond in Markdown. Respond only with content from the documents provided. If the answer is not clear from the documents, respond with 'I don't know'.",
        },
        { role: "user", content: prompt.slice(0, 4000) },
      ],
      model: "deepseek-chat", // Usando modelo de Deepseek en lugar de GPT
    });

    const content = completion.choices[0].message.content;
    return content || "Sorry, I don't know the answer to that.";
  } catch (error) {
    console.error('Error generating RAG response:', error);
    return "Sorry, I encountered an error trying to generate a response.";
  }
}

/**
 * Genera una respuesta usando el modelo Deepseek
 */
async function generateDeepseekResponse(
  message: string,
  chatHistory: Message[]
): Promise<string> {
  try {
    // Convertir historial de chat al formato esperado por la API
    const messages = chatHistory
      .filter((msg) => msg.role !== 'system') // Excluir mensajes del sistema
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant', 
        content: msg.content
      }));

    // Añadir el mensaje actual
    messages.push({
      role: 'user',
      content: message
    });

    // Llamar a la API de Deepseek
    const completion = await deepseekApi.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides clear and concise answers.",
        },
        ...messages,
      ],
      model: "deepseek-chat", // Modelo de Deepseek 
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    return content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating Deepseek response:', error);
    return "Sorry, I encountered an error trying to generate a response with Deepseek.";
  }
}
