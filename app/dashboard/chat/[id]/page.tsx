// app/dashboard/chat/[id]/page.tsx
import ChatMessages from '../../../components/ChatMessages';
import { getConversationMessages, getBrainstormIdeas } from '../../actions';
import ChatInput from '../../../components/ChatInput'; 
import ChatWrapper from '../../../components/ChatWrapper';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch both messages and brainstorm ideas concurrently
  const [messages, ideas] = await Promise.all([
    getConversationMessages(id),
    getBrainstormIdeas(id)
  ]);

  return (
    <div className="flex flex-col h-full bg-white">
      <ChatWrapper conversationId={id} messages={messages} ideas={ideas} />
    </div>
  );
}