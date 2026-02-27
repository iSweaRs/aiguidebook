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
  
  // Separate states for our two different warnings
  const [showDocWarning, setShowDocWarning] = useState(false);
  const [showPiiWarning, setShowPiiWarning] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PII Detection Logic ---
  const containsPII = (text: string) => {
    // Matches standard email formats (e.g., user@example.com)
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    // Matches various phone formats (e.g., 123-456-7890, (123) 456-7890, +1 234 567 8900)
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    
    return emailRegex.test(text) || phoneRegex.test(text);
  };

  // --- Message Sending Logic ---
  const executeSend = async () => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setShowPiiWarning(false); // Ensure modal closes if we are confirming

    try {
      if (isBrainstorming) {
        await sendBrainstormMessage(conversationId, content);
      } else {
        await sendChatMessage(conversationId, content, 'user');
      }
      setContent('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    // Check for PII BEFORE attempting to send
    if (containsPII(content)) {
      setShowPiiWarning(true);
      return; // Stop execution here and wait for user confirmation
    }

    // If no PII is found, send the message immediately
    await executeSend();
  };

  // --- Document Upload Logic ---
  const handleConfirmUpload = () => {
    setShowDocWarning(false);
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
      
      {/* PII Warning Modal (Centered Overlay) */}
      {showPiiWarning && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Warning</h3>
            <p className="text-gray-600 text-sm mb-6">
              There are potential private informations in your message (like a phone number or email address). Are you sure to continue?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPiiWarning(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSend}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
              >
                Yes, Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Warning (Tooltip style) */}
      {showDocWarning && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-yellow-50 border border-yellow-200 p-4 rounded-md shadow-lg z-10 mx-4">
          <p className="text-yellow-800 text-sm font-medium mb-3">
            Warning: Possibly sensitive information can be provided in documents. Are you sure you want to proceed?
          </p>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleConfirmUpload}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Confirm & Upload
            </button>
            <button 
              type="button"
              onClick={() => setShowDocWarning(false)}
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
          onClick={() => setShowDocWarning(true)}
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