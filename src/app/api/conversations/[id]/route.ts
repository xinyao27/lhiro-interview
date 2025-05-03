import { db } from '@/db';
import { messages, conversations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = parseInt(params.id);
    
    if (isNaN(conversationId)) {
      return new Response('Invalid conversation ID', { status: 400 });
    }

    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    await db.delete(conversations).where(eq(conversations.id, conversationId));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 