# Implementación de Streaming con DeepSeek en Wasp

Este documento detalla los pasos para implementar el streaming de respuestas de DeepSeek (tanto el modelo chat como reasoner) en una aplicación Wasp, basado en el análisis del código existente.

## Índice

1. [Arquitectura del sistema](#arquitectura-del-sistema)
2. [Implementación en el servidor](#implementación-en-el-servidor)
3. [Implementación en el cliente](#implementación-en-el-cliente)
4. [Integración en la UI](#integración-en-la-ui)
5. [Pruebas y depuración](#pruebas-y-depuración)

## Arquitectura del sistema

El sistema de streaming utiliza:

- **WebSockets** para comunicación en tiempo real entre servidor y cliente
- **OpenAI API** (adaptada para DeepSeek) con la opción `stream: true`
- **Eventos personalizados** para manejar los fragmentos de respuesta
- **Estado local** en el cliente para mostrar la respuesta mientras se genera

### Flujo general

1. Cliente envía un mensaje al servidor
2. Servidor inicia streaming con DeepSeek API
3. Servidor envía fragmentos de respuesta al cliente vía WebSocket
4. Cliente actualiza la UI en tiempo real con los fragmentos recibidos
5. Al finalizar, el servidor notifica al cliente que el stream ha terminado

## Implementación en el servidor

### 1. Crear la acción para streaming en `main.wasp`

```
action streamDeepSeekResponse {
  fn: import { streamDeepSeekResponse } from "@src/deepseek-chat/operations",
  entities: [DeepSeekChat, DeepSeekMessage]
}
```

### 2. Implementar la función de streaming en operations.ts

```typescript
export const streamDeepSeekResponse: StreamDeepSeekResponse<StreamArgs> = async ({
  chatId,
  messages,
  isR1Mode,
  messageIndex,
  ...rest
}: StreamArgs, context: any) => {
  // Validación de autenticación
  if (!context.user) {
    throw new HttpError(401);
  }

  // Variables para tracking
  let createdMessage;
  let fullContent = '';
  let fullReasoning = '';

  try {
    // 1. Preparar mensaje del sistema según el modo
    const systemMessage = {
      role: 'system' as MessageRole,
      content: isR1Mode 
        ? 'You are a helpful AI assistant that provides detailed reasoning for your responses.'
        : 'You are a helpful AI assistant.'
    };

    // 2. Combinar historial con nuevos mensajes
    let chatMessages = [systemMessage, ...messages];
    
    // 3. Crear un mensaje vacío del asistente antes de iniciar el stream
    createdMessage = await context.entities.DeepSeekMessage.create({
      data: {
        content: '',
        reasoning_content: '',
        role: 'assistant',
        chat: {
          connect: { id: chatId }
        },
        messageIndex: responseIndex, // Calcular según tu lógica de indexación
        parentIndex: parentMessageIndex, // Referencia al mensaje del usuario
        isLatest: true
        // Otros campos según tu esquema
      }
    });
    
    // 4. Iniciar streaming con OpenAI API (adaptada para DeepSeek)
    const response = await openai.chat.completions.create({
      model: isR1Mode ? 'deepseek-reasoner' : 'deepseek-chat',
      messages: chatMessages,
      stream: true,
      temperature: 0.7
    });

    // 5. Procesar chunks y enviarlos al cliente
    for await (const chunk of response) {
      const delta = chunk.choices[0].delta;
      
      if ('content' in delta && delta.content) {
        // Emitir chunk a través de WebSocket
        ioInstance.emit('streamResponse', {
          chatId,
          content: delta.content,
          reasoning_content: null, // Adaptar para R1 si es necesario
          done: false
        });
        
        // Acumular contenido
        fullContent += delta.content;
      }
    }

    // 6. Actualizar el mensaje con el contenido completo
    await context.entities.DeepSeekMessage.update({
      where: { id: createdMessage.id },
      data: {
        content: fullContent,
        reasoning_content: fullReasoning,
      }
    });

    // 7. Notificar finalización del stream
    ioInstance.emit('streamResponse', {
      chatId,
      content: '',
      reasoning_content: null,
      done: true
    });
    
    return {
      chatId,
      streamedContent: fullContent,
      messageIndex: responseIndex
    };
    
  } catch (error) {
    console.error('Stream error:', error);
    
    // Limpiar mensaje si hubo error
    if (createdMessage) {
      await context.entities.DeepSeekMessage.delete({
        where: { id: createdMessage.id }
      });
    }
    
    throw error;
  }
};
```

### 3. Adaptar para modo R1 (razonamiento)

Si necesitas implementar el modo razonador (R1), debes detectar y procesar el contenido de razonamiento:

```typescript
// En el bucle de procesamiento de chunks
if ('function_call' in delta && delta.function_call?.name === 'reasoning') {
  const reasoning = JSON.parse(delta.function_call.arguments || '{}').reasoning;
  if (reasoning) {
    ioInstance.emit('streamResponse', {
      chatId,
      content: null,
      reasoning_content: reasoning,
      done: false
    });
    fullReasoning += reasoning;
  }
}
```

## Implementación en el cliente

### 1. Crear hook para manejar el chat

Crea un archivo `useChat.ts` en tu carpeta de hooks:

```typescript
import { useState, useEffect, FormEvent } from 'react';
import { useQuery } from 'wasp/client/operations';
import { useSocket, useSocketListener } from 'wasp/client/webSocket';
import { 
  streamDeepSeekResponse,
  createDeepSeekChat,
  getDeepSeekMessages
  // Otras operaciones necesarias
} from 'wasp/client/operations';

// Definir interfaces necesarias
interface StreamResponse {
  content?: string;
  reasoning_content?: string;
  done: boolean;
  chatId: string;
}

export function useChat(
  chatId: string | null, 
  isR1Mode: boolean = false,
  // Otros parámetros necesarios
) {
  // Estados
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  
  // Socket setup
  const socket = useSocket();
  
  // Query para cargar mensajes
  const { data, isLoading: messagesLoading, refetch } = useQuery(
    getDeepSeekMessages,
    { chatId: chatId || '' },
    { enabled: !!chatId }
  );
  
  // Manejador de respuestas en streaming
  const handleStreamResponse = (response: StreamResponse) => {
    if (response.chatId !== chatId) return;
    
    if (response.done) {
      console.log('Stream completado, actualizando UI');
      // Recargar mensajes después del streaming
      refetch().then(() => {
        setStreamingContent('');
        setStreamingReasoning('');
        setIsLoading(false);
      });
    } else {
      // Modo R1: procesar contenido de razonamiento
      if (isR1Mode && response.reasoning_content) {
        setStreamingReasoning(prev => prev + (response.reasoning_content || ''));
      }
      // Procesar contenido normal
      if (response.content) {
        setStreamingContent(prev => prev + response.content);
      }
    }
  };
  
  // Registrar listener para eventos de streaming
  useSocketListener('streamResponse', handleStreamResponse);
  
  // Función para enviar mensaje
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chatId || isLoading) return;
    
    try {
      setIsLoading(true);
      const currentInput = userInput;
      setUserInput('');
      
      // Crear mensaje del usuario
      const userMessageResponse = await createUserMessage({
        chatId,
        content: currentInput,
        // Otros campos necesarios
      });
      
      // Iniciar streaming de respuesta
      await streamDeepSeekResponse({
        chatId,
        messages: [
          // Formato de mensajes para la API
          {
            content: currentInput,
            role: 'user',
            // Otros campos necesarios
          }
        ],
        isR1Mode
      });
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setIsLoading(false);
    }
  };
  
  // Devolver estados y funciones
  return {
    messages: data?.messages || [],
    streamingContent,
    streamingReasoning,
    userInput,
    isLoading,
    setUserInput,
    handleSubmit,
    // Otras funciones necesarias
  };
}
```

## Integración en la UI

### 1. Crear componentes para mostrar mensajes

```tsx
// MessageDisplay.tsx
import React from 'react';

interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
  streamingContent?: string;
  streamingReasoning?: string;
}

export const MessageDisplay: React.FC<MessageProps> = ({
  content,
  role,
  isStreaming = false,
  streamingContent = '',
  streamingReasoning = ''
}) => {
  return (
    <div className={`message ${role}`}>
      {role === 'assistant' && isStreaming ? (
        <>
          {streamingContent && <div className="content">{streamingContent}</div>}
          {streamingReasoning && (
            <div className="reasoning">
              <h4>Razonamiento:</h4>
              {streamingReasoning}
            </div>
          )}
        </>
      ) : (
        <div className="content">{content}</div>
      )}
    </div>
  );
};
```

### 2. Integrar el hook en tu página de chat

```tsx
// ChatPage.tsx
import React from 'react';
import { useChat } from '../hooks/useChat';
import { MessageDisplay } from '../components/MessageDisplay';

export function ChatPage() {
  const chatId = '123'; // Obtener de parámetros o estado
  const isR1Mode = true; // Configurar según necesidad
  
  const {
    messages,
    streamingContent,
    streamingReasoning,
    userInput,
    isLoading,
    setUserInput,
    handleSubmit
  } = useChat(chatId, isR1Mode);
  
  return (
    <div className="chat-page">
      <div className="messages-container">
        {messages.map(message => (
          <MessageDisplay
            key={message.id}
            content={message.content}
            role={message.role}
          />
        ))}
        
        {/* Mensaje en streaming */}
        {streamingContent && (
          <MessageDisplay
            content=""
            role="assistant"
            isStreaming={true}
            streamingContent={streamingContent}
            streamingReasoning={streamingReasoning}
          />
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !userInput.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
```

## Pruebas y depuración

### 1. Verificación de WebSocket

```typescript
// En cualquier componente o hook
useEffect(() => {
  const socket = useSocket();
  console.log('Estado del socket:', socket.connected ? 'Conectado' : 'Desconectado');

  const handleConnect = () => console.log('Socket conectado');
  const handleDisconnect = () => console.log('Socket desconectado');
  
  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  
  return () => {
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
  };
}, []);
```

### 2. Monitoreo de eventos en el servidor

```typescript
// En operations.ts
for await (const chunk of response) {
  console.log('Chunk recibido:', chunk);
  // Resto del código...
}
```

### 3. Depuración de problemas comunes

- **El stream no comienza**: Verifica que la acción esté definida en `main.wasp` y que el WebSocket esté configurado correctamente.
- **No se reciben chunks**: Asegúrate de que `ioInstance` esté definido correctamente y que estés usando el mismo evento en cliente y servidor.
- **Errores en la API**: Verifica las credenciales y parámetros enviados a la API de DeepSeek.
- **Problemas de rendimiento**: Considera limitar el tamaño del historial de mensajes enviado a la API.

## Consideraciones finales

- **Seguridad**: Asegúrate de validar la autenticación del usuario en cada operación.
- **Manejo de errores**: Implementa un sistema robusto de manejo de errores para mejorar la experiencia del usuario.
- **Optimización**: Considera implementar debouncing o throttling para los eventos de streaming si hay problemas de rendimiento.
- **Almacenamiento**: Recuerda actualizar la base de datos con el contenido completo al finalizar el stream.

Sigue estos pasos y tendrás implementado el streaming de respuestas de DeepSeek en tu aplicación Wasp de manera efectiva y optimizada.
