// app/components/ChatInput.tsx
'use client';

import { useState, useRef } from 'react';
import { sendChatMessage, uploadDocument, sendBrainstormMessage } from '../dashboard/actions';
import { Plus, Lightbulb, LightbulbOff } from 'lucide-react';

interface ChatInputProps {
  conversationId: string;
  isBrainstorming?: boolean;
  onToggleBrainstorm?: () => void;
}

export default function ChatInput({ conversationId, isBrainstorming = false, onToggleBrainstorm }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    try {
      if (isBrainstorming) {
        // Trigger brainstorming flow (saves to chat AND brainstorm log)
        await sendBrainstormMessage(conversationId, content);
      } else {
        // Normal chat flow
        await sendChatMessage(conversationId, content, 'user');
      }
      setContent('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpload = () => {
    setShowWarning(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadDocument(conversationId, formData);
    } catch (error) {
      console.error("Failed to upload document:", error);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      {showWarning && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-yellow-50 border border-yellow-200 p-4 rounded-md shadow-lg z-10 mx-4">
          <p className="text-yellow-800 text-sm font-medium mb-3">
            Warning: Possibly sensitive information can be provided in documents. Are you sure you want to proceed?
          </p>
          <div className="flex gap-2">
            <button 
              onClick={handleConfirmUpload}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Confirm & Upload
            </button>
            <button 
              onClick={() => setShowWarning(false)}
              className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2 bg-white items-center relative">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.doc,.docx,.txt"
        />

        <button
          type="button"
          onClick={() => setShowWarning(true)}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
          title="Upload Document"
        >
          <Plus size={24} />
        </button>

        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isBrainstorming ? "Brainstorm your ideas..." : "Type your message..."}
          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          disabled={isLoading}
        />

        {/* New Brainstorm Mode Toggle Button */}
        <button
          type="button"
          onClick={onToggleBrainstorm}
          className={`p-2 rounded-md flex-shrink-0 transition-colors ${
            isBrainstorming 
              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title={isBrainstorming ? "Switch to Normal Mode" : "Switch to Brainstorming Mode"}
        >
          {isBrainstorming ? <Lightbulb size={20} /> : <LightbulbOff size={20} />}
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}