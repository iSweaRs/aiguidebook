'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Folder, Lock, MessageSquare, Plus, BookOpen, Clock } from 'lucide-react';
import { getDashboardConversations, GroupedConversations } from '../dashboard/actions';

export default function Sidebar({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<'ACADEMIC' | 'PRIVATE'>('ACADEMIC');
  const [data, setData] = useState<GroupedConversations | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Fetch data via Server Action
    getDashboardConversations(userId).then(setData);
  }, [userId]);

  if (!data) return <div className="w-64 bg-gray-50 border-r p-4 animate-pulse" />;

  return (
    <aside className="w-72 bg-gray-50 border-r h-screen flex flex-col">
      {/* Header & New Chat Button */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 mb-4">AI Guidebook</h2>
        <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors font-medium">
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      {/* View Switch Mechanism */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('ACADEMIC')}
          className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${
            activeTab === 'ACADEMIC' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen size={16} /> Academic
        </button>
        <button
          onClick={() => setActiveTab('PRIVATE')}
          className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${
            activeTab === 'PRIVATE' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock size={16} /> Private
        </button>
      </div>

      {/* Conversation List (Chronological) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'ACADEMIC' ? (
          data.academic.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">No academic chats yet.</p>
          ) : (
            data.academic.map((group) => (
              <div key={group.course._id} className="space-y-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Folder size={14} /> {group.course.code}: {group.course.name}
                </h3>
                <ul className="space-y-1">
                  {group.conversations.map((chat) => (
                    <li key={chat._id}>
                      <Link
                        href={`/dashboard/chat/${chat._id}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          pathname === `/dashboard/chat/${chat._id}`
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <MessageSquare size={16} />
                        <span className="truncate flex-1">{chat.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )
        ) : (
          <ul className="space-y-1">
            {data.private.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">No private chats yet.</p>
            ) : (
              data.private.map((chat) => (
                <li key={chat._id}>
                  <Link
                    href={`/dashboard/chat/${chat._id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      pathname === `/dashboard/chat/${chat._id}`
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Lock size={16} />
                    <span className="truncate flex-1">{chat.title}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}