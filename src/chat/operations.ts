import { type Chat, type Message, type User, type Document, type Section } from 'wasp/entities';
import { 
  type GetChats, 
  type GetChat, 
  type CreateChat, 
  type AddMessage, 
  type GenerateChatResponse,
  type DeleteChat
} from 'wasp/server/operations';
import { HttpError, prisma, env } from 'wasp/server';
import { createEmbedding } from '../documents';
// @ts-ignore
import { toSql } from 'pgvector/utils';

import openai from 'openai';

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
  useRag?: boolean;
};
type AddMessageOutput = Message;

type GenerateChatResponseInput = {
  chatId: string;
  message: string;
  modelType: string; // "deepseek-v3", "deepseek-r1", etc.
  useRag: boolean; // Indica si se utilizará RAG
  systemPrompt?: string; // Prompt personalizado para el sistema
};
type GenerateChatResponseOutput = {
  message: Message;
};

type DeleteChatInput = {
  chatId: string;
};
type DeleteChatOutput = Chat;

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
      modelType: 'deepseek-chat',
      useRag: false,
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

  const { chatId, content, role, modelType, useRag = false } = args;

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
    useRag,
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
 * Genera una respuesta de chat según el modelo seleccionado y si se usa RAG
 */
export const generateChatResponse: GenerateChatResponse<
  GenerateChatResponseInput,
  GenerateChatResponseOutput
> = async (args: GenerateChatResponseInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to generate chat responses');
  }

  const { chatId, message, modelType, useRag } = args;
  // Manejo explícito de systemPrompt para evitar errores de tipo
  const systemPrompt = args.systemPrompt || '';

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
      modelType, // Guardar el tipo de modelo seleccionado por el usuario
      useRag,
      chatId
    }
  });

  let responseContent = '';
  let reasoningContent: string | null = null;

  // Generar respuesta según si se usa RAG o no
  if (useRag) {
    responseContent = await generateRAGResponse(message, systemPrompt);
  } else {
    // Usar modelo DeepSeek seleccionado
    const response = await generateDeepseekResponse(message, chat.messages, systemPrompt, modelType);
    responseContent = response.content;
    reasoningContent = response.reasoningContent || null;
  }

  // Guardar la respuesta del asistente
  const responseMessage = await prisma.message.create({
    data: {
      content: responseContent,
      reasoningContent: reasoningContent,
      role: 'assistant',
      modelType,
      useRag,
      chatId
    }
  });

  return { message: responseMessage };
};

/**
 * Elimina un chat y sus mensajes asociados
 */
type DeleteChatArgs = {
  chatId: string;
};

export const deleteChat = async (args: DeleteChatArgs, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to delete a chat.');
  }

  const chat = await context.entities.Chat.findUnique({
    where: { id: args.chatId }
  });

  if (!chat) {
    throw new HttpError(404, 'Chat not found.');
  }

  // Verificar que el chat pertenece al usuario
  if (chat.userId !== context.user.id) {
    throw new HttpError(403, 'You do not have permission to delete this chat.');
  }

  // Eliminar todos los mensajes del chat
  await context.entities.Message.deleteMany({
    where: { chatId: args.chatId }
  });

  // Eliminar el chat
  await context.entities.Chat.delete({
    where: { id: args.chatId }
  });

  return { success: true };
};

/**
 * Genera una respuesta usando RAG (Recuperación Aumentada por Generación)
 */
async function generateRAGResponse(query: string, customSystemPrompt?: string): Promise<string> {
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

    const defaultSystemPrompt = "You are a Q&A system. Respond concisely. Mention the source URL. Respond in Markdown. Respond only with content from the documents provided. If the answer is not clear from the documents, respond with 'I don't know'.";

    // Usar Deepseek para la respuesta RAG
    const completion = await deepseekApi.chat.completions.create({
      messages: [
        {
          role: "system",
          content: customSystemPrompt ?? defaultSystemPrompt,
        },
        { role: "user", content: prompt.slice(0, 4000) },
      ],
      model: "deepseek-chat",
      temperature: 0.3, // Temperatura más baja para respuestas más precisas en RAG
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
  chatHistory: Message[],
  customSystemPrompt?: string,
  modelType: string = 'deepseek-chat'  // Añadir parámetro modelType con valor por defecto
): Promise<{ content: string; reasoningContent?: string }> {
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

    const defaultSystemPrompt = "You are a helpful assistant that provides clear and concise answers.";
    
    // Ya no necesitamos mapear, usamos el modelType directamente
    // ya que en la UI usamos los mismos valores que la API
    const model = modelType;

    console.log(`Using model: ${model}`);

    // Llamar a la API de Deepseek
    const completion = await deepseekApi.chat.completions.create({
      messages: [
        {
          role: "system",
          content: customSystemPrompt ?? defaultSystemPrompt,
        },
        ...messages,
      ],
      model: model,
      temperature: 0.7,
    });

    // Extraer el contenido normal
    const content = completion.choices[0].message.content || '';
    
    // Extraer el contenido de razonamiento (solo disponible para deepseek-reasoner)
    // @ts-ignore - La propiedad reasoning_content no está en la definición de tipos estándar
    const reasoningContent = completion.choices[0].message.reasoning_content || null;

    return { 
      content: content || "Lo siento, no pude generar una respuesta.",
      reasoningContent
    };
  } catch (error) {
    console.error('Error generating Deepseek response:', error);
    return { 
      content: "Lo siento, he encontrado un error al intentar generar una respuesta."
    };
  }
}
