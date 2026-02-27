'use client';

import { useState } from 'react';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

interface Idea {
  id: string;
  prompt: string;
  idea: string;
}

interface ChatWrapperProps {
  conversationId: string;
  messages: any[];
  ideas: Idea[]; // Added the new ideas prop
}

export default function ChatWrapper({ conversationId, messages, ideas }: ChatWrapperProps) {
  const [isBrainstorming, setIsBrainstorming] = useState(false);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 bg-white">
        <div className="p-4 border-b bg-gray-50">
          <h1 className="font-semibold text-gray-700">Chat History</h1>
        </div>

        <ChatMessages messages={messages} />

        <ChatInput 
          conversationId={conversationId} 
          isBrainstorming={isBrainstorming}
          onToggleBrainstorm={() => setIsBrainstorming(!isBrainstorming)}
        />
      </div>

      {isBrainstorming && (
        <div className="w-80 flex-shrink-0 bg-amber-50 flex flex-col h-full border-l border-amber-200 transition-all">
          <div className="p-4 border-b border-amber-200 bg-amber-100 flex items-center justify-between">
            <h2 className="font-semibold text-amber-900">Brainstorming Log</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-xs text-amber-700 mb-4">
              Recording your prompt/idea combinations while in Brainstorming Mode.
            </p>
            {/* Map over the real DB ideas instead of mock data */}
            {ideas.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center mt-10">No ideas generated yet.</p>
            ) : (
              ideas.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border border-amber-100">
                  <div className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Prompt</div>
                  <div className="text-sm text-gray-700 italic mb-3">"{item.prompt}"</div>
                  <div className="text-xs text-amber-600 mb-1 font-semibold uppercase tracking-wider">Idea Generated</div>
                  <div className="text-sm text-gray-800">{item.idea}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}