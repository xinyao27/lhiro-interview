import { db } from '@/db';
import { messages, conversations } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // Get all conversations
    const allConversations = await db.query.conversations.findMany({
      orderBy: [desc(conversations.createdAt)],
      with: {
        messages: {
          orderBy: [conversations.createdAt],
        },
      },
    });

    return new Response(JSON.stringify(allConversations), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { conversationId } = await req.json();
    
    // Get messages for a specific conversation
    const conversationMessages = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [messages.createdAt],
    });

    return new Response(JSON.stringify(conversationMessages), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    // Delete all conversations
    // First delete all messages
    await db.delete(messages);
    // Then delete all conversations
    await db.delete(conversations);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error clearing conversations:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 