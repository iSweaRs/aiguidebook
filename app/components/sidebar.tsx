'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Folder, Lock, MessageSquare, Plus, BookOpen, X, 
  ChevronRight, Loader2, Edit2, Check, Trash2 
} from 'lucide-react';
import { 
  getDashboardConversations, 
  createConversation, 
  renameConversation,
  createCourse,
  deleteConversation,
  deleteCourse,
  GroupedConversations 
} from '../dashboard/actions';

export default function Sidebar({ userId }: { userId: string }) {
  const [data, setData] = useState<GroupedConversations | null>(null);
  const [activeTab, setActiveTab] = useState<'ACADEMIC' | 'PRIVATE'>('ACADEMIC');
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  const pathname = usePathname();
  const router = useRouter();

  const refreshData = async () => {
    const newData = await getDashboardConversations(userId);
    setData(newData);
  };

  useEffect(() => { refreshData(); }, [userId]);

  const handleCreateChat = async (category: 'ACADEMIC' | 'PRIVATE', courseId?: string) => {
    setIsCreating(true);
    try {
      const newChat = await createConversation(userId, category, courseId);
      setShowTypeSelector(false);
      await refreshData();
      router.push(`/dashboard/chat/${newChat._id}`);
    } finally { setIsCreating(false); }
  };

  const handleAddCourse = async () => {
    const code = prompt("Course Code (e.g., CS101):");
    const name = prompt("Course Name (e.g., Computer Science):");
    if (code && name) {
      await createCourse(userId, name, code);
      await refreshData();
    }
  };

  const handleRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle);
      setEditingId(null);
      await refreshData();
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      await deleteConversation(id);
      if (pathname.includes(id)) router.push('/dashboard');
      await refreshData();
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("Warning: Deleting this course will delete ALL associated chats. Continue?")) {
      await deleteCourse(id);
      await refreshData();
    }
  };

  if (!data) return <div className="w-72 bg-gray-50 border-r h-screen animate-pulse" />;

  return (
    <aside className="w-72 bg-gray-50 border-r h-screen flex flex-col relative">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h2 className="text-xl font-bold text-gray-800 mb-4">AI Guidebook</h2>
        
        {!showTypeSelector ? (
          <button onClick={() => setShowTypeSelector(true)} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors font-medium">
            <Plus size={18} /> <span>New Chat</span>
          </button>
        ) : (
          <div className="space-y-2 p-2 bg-gray-100 rounded-md border">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Select Type</span>
              <button onClick={() => setShowTypeSelector(false)}><X size={14} /></button>
            </div>
            <button onClick={() => handleCreateChat('PRIVATE')} className="w-full flex items-center gap-2 bg-white p-2 rounded border text-sm hover:bg-gray-50">
              <Lock size={14} /> Private Chat
            </button>
            <div className="pt-1 border-t mt-1">
              <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Academic Courses</span>
                <button onClick={handleAddCourse} className="text-[10px] text-blue-600 font-bold hover:underline">+ Add Course</button>
              </div>
              {data.academic.map((group) => (
                <div key={group.course._id} className="flex gap-1 mt-1">
                  <button onClick={() => handleCreateChat('ACADEMIC', group.course._id)} className="flex-1 flex items-center gap-2 bg-white p-2 rounded border text-xs hover:bg-gray-50 truncate">
                    <BookOpen size={14} className="text-blue-500 shrink-0" />
                    <span className="truncate">{group.course.code}</span>
                  </button>
                  <button onClick={() => handleDeleteCourse(group.course._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button onClick={() => setActiveTab('ACADEMIC')} className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 ${activeTab === 'ACADEMIC' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          <BookOpen size={16} /> Academic
        </button>
        <button onClick={() => setActiveTab('PRIVATE')} className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 ${activeTab === 'PRIVATE' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
          <Lock size={16} /> Private
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'ACADEMIC' ? (
          data.academic.map((group) => (
            <div key={group.course._id} className="space-y-1">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2 px-2">
                <Folder size={12} /> {group.course.code}
              </h3>
              <ul className="space-y-1">
                {group.conversations.map((chat) => (
                  <li key={chat._id} className="group flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-200">
                    {editingId === chat._id ? (
                      <div className="flex items-center gap-1 w-full">
                        <input autoFocus className="flex-1 bg-white border rounded px-1 outline-none" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename(chat._id)} />
                        <button onClick={() => handleRename(chat._id)}><Check size={14} className="text-green-600" /></button>
                      </div>
                    ) : (
                      <>
                        <Link href={`/dashboard/chat/${chat._id}`} className={`flex-1 truncate ${pathname.includes(chat._id) ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                          {chat.title}
                        </Link>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingId(chat._id); setEditTitle(chat.title); }} className="text-gray-400 hover:text-blue-600"><Edit2 size={12} /></button>
                          <button onClick={() => handleDeleteChat(chat._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <ul className="space-y-1">
            {data.private.map((chat) => (
              <li key={chat._id} className="group flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-200">
                {editingId === chat._id ? (
                  <div className="flex items-center gap-1 w-full">
                    <input autoFocus className="flex-1 bg-white border rounded px-1 outline-none" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename(chat._id)} />
                    <button onClick={() => handleRename(chat._id)}><Check size={14} className="text-green-600" /></button>
                  </div>
                ) : (
                  <>
                    <Link href={`/dashboard/chat/${chat._id}`} className={`flex-1 truncate ${pathname.includes(chat._id) ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>
                      {chat.title}
                    </Link>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(chat._id); setEditTitle(chat.title); }} className="text-gray-400 hover:text-blue-600"><Edit2 size={12} /></button>
                      <button onClick={() => handleDeleteChat(chat._id)} className="text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}