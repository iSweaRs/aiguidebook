// app/dashboard/chat/[id]/page.tsx
import ChatMessages from '../../../components/ChatMessages';
import { getConversationMessages } from '../../actions';
import ChatInput from '../../../components/ChatInput'; // Import the new component

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await getConversationMessages(id); //

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b bg-gray-50">
        <h1 className="font-semibold text-gray-700">Chat History</h1>
      </div>

      <ChatMessages messages={messages} />

      {/* Replaced the placeholder with the actual Input component */}
      <ChatInput conversationId={id} />
    </div>
  );
}