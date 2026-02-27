'use client';

import { useEffect, useRef, useState } from 'react';
import { Flag } from 'lucide-react';
import { reportMessageBias, removeMessageBiasReport } from '../dashboard/actions';

export default function ChatMessages({ messages }: { messages: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Initialize the state using the 'isFlagged' property from the database
  const [reportedMessages, setReportedMessages] = useState<Set<string>>(() => {
    const initiallyFlagged = messages.filter(m => m.isFlagged).map(m => m._id);
    return new Set(initiallyFlagged);
  });
  
  // Update reported messages if the messages prop changes (e.g. new messages arrive)
  useEffect(() => {
    setReportedMessages(prev => {
      const newSet = new Set(prev);
      messages.forEach(m => {
        if (m.isFlagged) newSet.add(m._id);
      });
      return newSet;
    });
  }, [messages]);

  const [activeModal, setActiveModal] = useState<{
    type: 'report' | 'unreport';
    messageId: string;
  } | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleConfirm = async () => {
    if (!activeModal) return;

    try {
      if (activeModal.type === 'report') {
        await reportMessageBias(activeModal.messageId);
        setReportedMessages((prev) => new Set(prev).add(activeModal.messageId));
      } else {
        await removeMessageBiasReport(activeModal.messageId);
        setReportedMessages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(activeModal.messageId);
          return newSet;
        });
      }
    } catch (error) {
      console.error(`Failed to ${activeModal.type} message:`, error);
    } finally {
      setActiveModal(null); // Close the modal
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      {/* Dynamic Confirmation Modal */}
      {activeModal && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeModal.type === 'report' ? 'Report Response' : 'Remove Report'}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {activeModal.type === 'report'
                ? 'Are you sure you want to report this response?'
                : 'Are you sure you want to remove the report for this response?'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors shadow-sm ${
                  activeModal.type === 'report' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-800 hover:bg-gray-900'
                }`}
              >
                {activeModal.type === 'report' ? 'Confirm Report' : 'Remove Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}
          >
            <div className="flex items-end gap-2 max-w-[70%]">
              <div
                className={`rounded-lg p-3 text-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.content}
                <div className="text-[10px] mt-2 opacity-70 text-right" suppressHydrationWarning>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>

              {/* Toggleable Flag Button */}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => setActiveModal({
                    type: reportedMessages.has(msg._id) ? 'unreport' : 'report',
                    messageId: msg._id
                  })}
                  className={`p-1.5 rounded-full transition-all flex-shrink-0 ${
                    reportedMessages.has(msg._id)
                      ? 'text-red-500 bg-red-50 hover:bg-red-100'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                  }`}
                  title={reportedMessages.has(msg._id) ? "Remove Report" : "Report Bias"}
                >
                  <Flag size={16} fill={reportedMessages.has(msg._id) ? "currentColor" : "none"} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}