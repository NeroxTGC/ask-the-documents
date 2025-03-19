# Ask the Documents - Chat Implementation with RAG and Deepseek

## Current Implementation: documents.ts

The current application uses a Retrieval-Augmented Generation (RAG) system combined with the OpenAI API to allow users to search and ask questions about documents. Let's analyze how this is implemented:

### Core Components of documents.ts

#### 1. Document Embedding
The `embedDocument` function takes a URL and optionally a CSS selector, scrapes the content, and processes it:

- It splits the content into chunks of appropriate size (around 6000 characters)
- Creates vector embeddings using OpenAI's text-embedding-ada-002 model
- Stores document metadata in the `Document` table and content with embeddings in `Section` table

#### 2. Document Retrieval
Two primary methods for retrieving documents:

- `getDocuments`: Gets all documents with their sections
- `searchDocuments`: Uses vector similarity search to find the most relevant documents based on a query

#### 3. Question Answering with RAG
The `askDocuments` function implements RAG:

- Takes a user query and converts it to vector embedding
- Searches for most relevant document sections using vector similarity
- Constructs a prompt containing the query and relevant document content
- Uses OpenAI's GPT-3.5-turbo to generate an answer based on the provided context
- Returns a formatted answer that cites sources

#### 4. Utility Functions
- `createEmbedding`: Converts text to vector embeddings via OpenAI API
- `splitIntoChunks`: Intelligently splits text into manageable chunks
- `getScrapeCandidates`: Finds links that can be scraped from a URL
- `deleteDocument`: Removes a document and its sections from the database

## Database Schema Update

We've updated the Prisma schema to include the chat functionality:

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String?
  chats Chat[]  // User can have multiple chat sessions
}

model Chat {
  id          String    @id @default(uuid())
  title       String    // Title of the chat conversation
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      Int       // Chat belongs to a user
  messages    Message[] // Chat contains multiple messages
}

model Message {
  id          String    @id @default(uuid())
  content     String    // The actual message content
  role        String    // "user", "assistant", "system"
  modelType   String    // "rag", "deepseek"
  embedding   Unsupported("vector(1536)")? // Optional embedding for RAG functionality
  createdAt   DateTime  @default(now())
  chat        Chat      @relation(fields: [chatId], references: [id], onDelete: Cascade)
  chatId      String    // Message belongs to a chat
  
  @@index([chatId]) // Index to improve query performance
}
```

Key points about the schema:
- Each `User` can have multiple `Chat` sessions
- Each `Chat` contains multiple `Message` objects
- The `Message` model includes:
  - `role` to distinguish between user, assistant, and system messages
  - `modelType` to track which AI model was used (RAG, Deepseek)
  - Optional `embedding` field to support vector similarity searches
  - `createdAt` timestamp to maintain message order

## Wasp Configuration Updates

We'll need to update the `main.wasp` file to include new operations and routes for the chat functionality:
