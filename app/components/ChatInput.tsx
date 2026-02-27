// app/components/ChatInput.tsx
'use client';

import { useState } from 'react';
import { sendChatMessage } from '../dashboard/actions';

export default function ChatInput({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // We pass 'user' as the role for messages sent from this box
      await sendChatMessage(conversationId, content, 'user');
      setContent('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2 bg-white">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? '...' : 'Send'}
      </button>
    </form>
  );
}