'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Folder, Lock, MessageSquare, Plus, BookOpen, X, 
  ChevronRight, Loader2, Edit2, Check 
} from 'lucide-react';
import { 
  getDashboardConversations, 
  createConversation, 
  renameConversation,
  createCourse,
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

  // Fonction pour rafraîchir les données (Cours + Conversations)
  const refreshData = async () => {
    const newData = await getDashboardConversations(userId);
    setData(newData);
  };

  useEffect(() => {
    refreshData();
  }, [userId]);

  // Créer une nouvelle conversation
  const handleCreateChat = async (category: 'ACADEMIC' | 'PRIVATE', courseId?: string) => {
    setIsCreating(true);
    try {
      const newChat = await createConversation(userId, category, courseId);
      setShowTypeSelector(false);
      await refreshData();
      router.push(`/dashboard/chat/${newChat._id}`);
    } catch (error) {
      console.error("Erreur lors de la création de la conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Créer un nouveau cours
  const handleAddCourse = async () => {
    const code = prompt("Code du cours (ex: MATH101) :");
    const name = prompt("Nom du cours (ex: Algèbre Linéaire) :");
    
    if (code && name) {
      try {
        await createCourse(userId, name, code);
        // On rafraîchit immédiatement les données pour que le cours 
        // apparaisse dans la liste de sélection "Academic Courses"
        await refreshData();
        alert("Cours ajouté avec succès ! Vous pouvez maintenant le sélectionner.");
      } catch (error) {
        console.error("Erreur lors de l'ajout du cours:", error);
      }
    }
  };

  // Renommer une conversation
  const handleRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle);
      setEditingId(null);
      await refreshData();
    }
  };

  if (!data) return <div className="w-72 bg-gray-50 border-r h-screen animate-pulse" />;

  return (
    <aside className="w-72 bg-gray-50 border-r h-screen flex flex-col relative">
      {/* Header & Menu de création */}
      <div className="p-4 border-b bg-white">
        <h2 className="text-xl font-bold text-gray-800 mb-4">AI Guidebook</h2>
        
        {!showTypeSelector ? (
          <button 
            onClick={() => setShowTypeSelector(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors font-medium"
          >
            <Plus size={18} />
            <span>Nouvelle Discussion</span>
          </button>
        ) : (
          <div className="space-y-2 p-2 bg-gray-100 rounded-md border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Choisir le type</span>
              <button onClick={() => setShowTypeSelector(false)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            
            <button 
              disabled={isCreating}
              onClick={() => handleCreateChat('PRIVATE')}
              className="w-full flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-sm py-2 px-3 rounded border transition-all"
            >
              <Lock size={14} className="text-gray-400" />
              <span>Privé</span>
              {isCreating && <Loader2 size={14} className="animate-spin ml-auto" />}
            </button>

            <div className="pt-1 border-t border-gray-200 mt-1">
              <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Cours Académiques</span>
                <button 
                  onClick={handleAddCourse}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  + Ajouter Cours
                </button>
              </div>
              
              {/* C'est ici que les nouveaux cours apparaîtront dynamiquement */}
              {data.academic.map((group) => (
                <button
                  key={group.course._id}
                  disabled={isCreating}
                  onClick={() => handleCreateChat('ACADEMIC', group.course._id)}
                  className="w-full flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-xs py-2 px-3 rounded border mt-1 truncate transition-all"
                >
                  <BookOpen size={14} className="text-blue-500 shrink-0" />
                  <span className="truncate">{group.course.code}</span>
                  <ChevronRight size={12} className="ml-auto text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Onglets (Tabs) */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('ACADEMIC')}
          className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${
            activeTab === 'ACADEMIC' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen size={16} /> Académique
        </button>
        <button
          onClick={() => setActiveTab('PRIVATE')}
          className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 transition-colors ${
            activeTab === 'PRIVATE' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock size={16} /> Privé
        </button>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'ACADEMIC' ? (
          data.academic.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-4">Aucun cours disponible.</p>
          ) : (
            data.academic.map((group) => (
              <div key={group.course._id} className="space-y-1">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 px-2">
                  <Folder size={12} /> {group.course.code}
                </h3>
                <ul className="space-y-1">
                  {group.conversations.map((chat) => (
                    <li key={chat._id} className="group relative">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        pathname === `/dashboard/chat/${chat._id}` ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-200'
                      }`}>
                        {editingId === chat._id ? (
                          <div className="flex items-center gap-1 w-full">
                            <input 
                              autoFocus
                              className="flex-1 bg-white border rounded px-1 outline-none text-sm"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleRename(chat._id)}
                            />
                            <button onClick={() => handleRename(chat._id)}><Check size={14} className="text-green-600" /></button>
                          </div>
                        ) : (
                          <>
                            <MessageSquare size={16} className="shrink-0 opacity-50" />
                            <Link href={`/dashboard/chat/${chat._id}`} className="truncate flex-1">
                              {chat.title}
                            </Link>
                            <button 
                              onClick={() => { setEditingId(chat._id); setEditTitle(chat.title); }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity"
                            >
                              <Edit2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )
        ) : (
          <ul className="space-y-1">
            {data.private.map((chat) => (
              <li key={chat._id} className="group relative">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname === `/dashboard/chat/${chat._id}` ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-200'
                }`}>
                  {editingId === chat._id ? (
                    <div className="flex items-center gap-1 w-full">
                      <input 
                        autoFocus
                        className="flex-1 bg-white border rounded px-1 outline-none text-sm"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(chat._id)}
                      />
                      <button onClick={() => handleRename(chat._id)}><Check size={14} className="text-green-600" /></button>
                    </div>
                  ) : (
                    <>
                      <Lock size={16} className="shrink-0 opacity-50" />
                      <Link href={`/dashboard/chat/${chat._id}`} className="truncate flex-1">
                        {chat.title}
                      </Link>
                      <button 
                        onClick={() => { setEditingId(chat._id); setEditTitle(chat.title); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity"
                      >
                        <Edit2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}