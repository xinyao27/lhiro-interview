import { db } from '@/db';
import { messages, conversations } from '@/db/schema';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.novita.ai/v3/openai',
  apiKey: 'sk_digKRF8mw8h4x2cwq74DPeMN1IBUcfyOYAMhHup4Pmw',
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages: chatMessages, conversationId } = await req.json();
    const userMessage = chatMessages[chatMessages.length - 1];

    let currentConversationId = conversationId;

    if (!currentConversationId) {
      const conversation = await db.insert(conversations).values({
        title: userMessage.content.slice(0, 50) + '...',
      }).returning();
      currentConversationId = conversation[0].id;
    }

    await db.insert(messages).values({
      conversationId: currentConversationId,
      role: 'user',
      content: userMessage.content,
    });

    const response = await openai.chat.completions.create({
      model: 'deepseek/deepseek-r1',
      messages: chatMessages,
      stream: true,
    });

    const stream = OpenAIStream(response, {
      onCompletion: async (completion: string) => {
        await db.insert(messages).values({
          conversationId: currentConversationId,
          role: 'assistant',
          content: completion,
        });
      },
    });

    return new StreamingTextResponse(stream, {
      headers: {
        'X-Conversation-Id': currentConversationId.toString(),
      },
    });
  } catch (error) {
    console.error('Error in agent route:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response('Request aborted', { status: 499 });
    }
    return new Response('Internal Server Error', { status: 500 });
  }
} 