'use client';

import { useState, useEffect } from 'react';
import { MessageSquarePlus, Star, X, History } from 'lucide-react';
import { submitUserFeedback, getUserFeedback } from '../dashboard/actions';

interface FeedbackModalProps {
  userId: string;
}

export default function FeedbackModal({ userId }: FeedbackModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  
  // Form State
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // History State
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch history when switching to the history tab
  useEffect(() => {
    if (activeTab === 'history' && isOpen) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          const data = await getUserFeedback(userId);
          setFeedbacks(data);
        } catch (error) {
          console.error("Failed to load feedback history", error);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab, isOpen, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitUserFeedback(userId, content, rating);
      setContent('');
      setRating(0);
      setActiveTab('history'); // Automatically switch to history to show it was saved
    } catch (error) {
      console.error("Failed to submit feedback", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border border-indigo-200 shadow-sm"
      >
        <MessageSquarePlus size={16} />
        Submit Feedback
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Application Feedback</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'form' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                Submit New
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <History size={16} /> My Past Feedback
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* Form Tab */}
              {activeTab === 'form' && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How satisfied are you with the tool?
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={`${
                              star <= (hoveredRating || rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tell us more about your experience
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What do you like? What could be improved?"
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-32 text-gray-800"
                      disabled={isSubmitting}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || rating === 0 || !content.trim()}
                    className="mt-2 w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="flex flex-col gap-4">
                  {isLoadingHistory ? (
                    <p className="text-sm text-gray-500 text-center py-8">Loading your past feedback...</p>
                  ) : feedbacks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8 italic">You haven't submitted any feedback yet.</p>
                  ) : (
                    feedbacks.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}