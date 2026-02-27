// app/dashboard/chat/[id]/page.tsx
import ChatMessages from '../../../components/ChatMessages';
import { getConversationMessages } from '../../actions';

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await getConversationMessages(id);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b bg-gray-50">
        <h1 className="font-semibold text-gray-700">Chat History</h1>
      </div>

      {/* This now handles the scrolling and the messages */}
      <ChatMessages messages={messages} />

      <div className="p-4 border-t">
        {/* Input box code... */}
      </div>
    </div>
  );
}