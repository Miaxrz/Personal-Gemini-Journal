import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Navbar 
} from './components/Navbar';
import { 
  AuthLanding 
} from './components/AuthLanding';
import { 
  EntryHistoryList 
} from './components/EntryHistoryList';
import { 
  ReflectionWorkspace 
} from './components/ReflectionWorkspace';
import { 
  InsightsPanel 
} from './components/InsightsPanel';
import { 
  signInWithGoogle, 
  signOutUser, 
  onAuthChange, 
  saveUserInteraction, 
  deleteUserInteraction, 
  toggleInteractionFavorite, 
  subscribeToUserInteractions 
} from './lib/firebase';
import type { 
  UserProfile, 
  JournalInteraction, 
  ChatMessage, 
  ReflectionMode, 
  MoodType 
} from './types';
import { PanelLeftClose, PanelLeftOpen, BrainCircuit, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Interactions / Journal list
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  
  // UI & Loading state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Layout Drawers
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  const [showInsightsDrawer, setShowInsightsDrawer] = useState(false);

  // Listen to Auth changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
        setInteractions([]);
        setActiveEntryId(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to User's Isolated Firestore Interactions
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    const unsubscribe = subscribeToUserInteractions(
      user.uid,
      (items) => {
        setInteractions(items);
        setIsSyncing(false);

        // If no active entry is selected and items exist, select the latest one
        setActiveEntryId((prev) => {
          if (prev && items.some(item => item.id === prev)) {
            return prev;
          }
          return items.length > 0 ? items[0].id : null;
        });
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setGlobalError('Unable to connect to your isolated Firestore database.');
        setIsSyncing(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Create a fresh new journal reflection session
  const createNewSession = useCallback((title: string = 'Morning Reflection', mood: MoodType = 'reflective'): JournalInteraction => {
    const newId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      id: newId,
      userId: user?.uid || '',
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mood,
      tags: ['reflection'],
      messages: [],
      wordCount: 0,
      isFavorite: false,
    };
  }, [user]);

  // Find currently active interaction
  const activeInteraction = interactions.find(i => i.id === activeEntryId) || null;

  // Handle New Entry Action
  const handleNewEntry = useCallback(() => {
    if (!user) return;
    const newSession = createNewSession(`Reflection ${new Date().toLocaleDateString()}`, 'reflective');
    
    // Save to Firestore
    saveUserInteraction(user.uid, newSession).catch((err) => {
      console.error('Error creating new session:', err);
      setSaveError('Failed to initialize new entry in database.');
    });

    setActiveEntryId(newSession.id);
  }, [user, createNewSession]);

  // Update fields on the current active interaction
  const handleUpdateInteraction = async (updatedFields: Partial<JournalInteraction>) => {
    if (!user || !activeInteraction) return;

    const merged: JournalInteraction = {
      ...activeInteraction,
      ...updatedFields,
      updatedAt: Date.now(),
    };

    // Optimistically update state
    setInteractions((prev) =>
      prev.map((item) => (item.id === merged.id ? merged : item))
    );

    try {
      setIsSaving(true);
      setSaveError(null);
      await saveUserInteraction(user.uid, merged);
    } catch (err: any) {
      console.error('Failed to save interaction to Firestore:', err);
      setSaveError(err?.message || 'Failed to sync update to database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Send reflection message to Gemini & save transcript to Firestore
  const handleSendMessage = async (text: string, mode: ReflectionMode) => {
    if (!user) return;

    // If no active interaction exists, initialize one now
    let current = activeInteraction;
    if (!current) {
      current = createNewSession(
        text.length > 30 ? `${text.substring(0, 30)}...` : text,
        'reflective'
      );
      setActiveEntryId(current.id);
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      mode,
    };

    const newMessages = [...current.messages, userMessage];
    const totalWords = newMessages.reduce((sum, m) => sum + (m.content ? m.content.split(/\s+/).length : 0), 0);

    const updatedWithUser: JournalInteraction = {
      ...current,
      messages: newMessages,
      wordCount: totalWords,
      title: current.messages.length === 0 ? (text.length > 35 ? `${text.substring(0, 35)}...` : text) : current.title,
      updatedAt: Date.now(),
    };

    // Optimistically save user message to Firestore
    setInteractions((prev) => {
      const exists = prev.some((i) => i.id === updatedWithUser.id);
      return exists ? prev.map((i) => (i.id === updatedWithUser.id ? updatedWithUser : i)) : [updatedWithUser, ...prev];
    });

    try {
      setIsSaving(true);
      await saveUserInteraction(user.uid, updatedWithUser);
    } catch (err: any) {
      console.error('Failed to persist user message:', err);
      setSaveError('Could not save user message to Firestore.');
    } finally {
      setIsSaving(false);
    }

    // Call Gemini API with conversational history
    try {
      setIsLoadingAI(true);
      setGlobalError(null);

      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: current.messages,
          mode,
          mood: current.mood,
          tags: current.tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_model`,
        role: 'model',
        content: data.reply || 'Thank you for sharing your thoughts.',
        timestamp: Date.now(),
        mode,
      };

      const finalMessages = [...newMessages, aiMessage];
      const finalWordCount = finalMessages.reduce((sum, m) => sum + (m.content ? m.content.split(/\s+/).length : 0), 0);

      const finalInteraction: JournalInteraction = {
        ...updatedWithUser,
        messages: finalMessages,
        wordCount: finalWordCount,
        updatedAt: Date.now(),
      };

      // Persist complete conversation to Firestore
      await saveUserInteraction(user.uid, finalInteraction);
      
      setInteractions((prev) =>
        prev.map((i) => (i.id === finalInteraction.id ? finalInteraction : i))
      );

    } catch (err: any) {
      console.error('Error getting Gemini reflection:', err);
      setGlobalError(err?.message || 'Failed to receive reflection from Gemini.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Generate complete executive summary & action items for current interaction
  const handleGenerateSummary = async () => {
    if (!user || !activeInteraction || activeInteraction.messages.length === 0) return;

    try {
      setIsGeneratingSummary(true);
      setGlobalError(null);

      const fullTranscript = activeInteraction.messages
        .map((m) => `${m.role === 'user' ? 'User Reflection' : 'Gemini Response'}: ${m.content}`)
        .join('\n\n');

      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeInteraction.title,
          fullText: fullTranscript,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate summary from Gemini.');
      }

      const resJson = await res.json();
      const summaryData = resJson.data || {};

      const updated: Partial<JournalInteraction> = {
        summary: summaryData.summary,
        actionItems: summaryData.actionItems,
        sentiment: summaryData.sentiment,
      };

      await handleUpdateInteraction(updated);

      // Trigger celebratory confetti for reflection milestone
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setGlobalError(err?.message || 'Could not synthesize entry summary.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Delete an interaction
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      await deleteUserInteraction(user.uid, entryId);
      setInteractions((prev) => prev.filter((i) => i.id !== entryId));
      if (activeEntryId === entryId) {
        const remaining = interactions.filter((i) => i.id !== entryId);
        setActiveEntryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      setSaveError('Failed to delete entry from database.');
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (entryId: string, isFav: boolean) => {
    if (!user) return;
    try {
      await toggleInteractionFavorite(user.uid, entryId, isFav);
      setInteractions((prev) =>
        prev.map((i) => (i.id === entryId ? { ...i, isFavorite: isFav } : i))
      );
    } catch (err: any) {
      console.error('Error updating favorite:', err);
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-700 border-t-transparent" />
          <p className="text-sm font-medium text-stone-600">Connecting to Firebase Auth...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 text-stone-900 font-sans">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        onSignOut={signOutUser}
        onNewEntry={handleNewEntry}
        entryCount={interactions.length}
        isSyncing={isSyncing}
      />

      {/* Global Error Banner if any */}
      {globalError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            className="text-rose-600 hover:text-rose-900 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main View Area */}
      {!user ? (
        <AuthLanding onSignIn={async () => { await signInWithGoogle(); }} />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Left History Sidebar (Collapsible) */}
          <div
            className={`${
              showHistorySidebar ? 'w-80 sm:w-96' : 'w-0'
            } shrink-0 transition-all duration-300 overflow-hidden relative z-20 border-r border-stone-200`}
          >
            <EntryHistoryList
              entries={interactions}
              activeEntryId={activeEntryId}
              onSelectEntry={(entry) => {
                setActiveEntryId(entry.id);
                // On mobile screens, auto-close sidebar on selection
                if (window.innerWidth < 768) {
                  setShowHistorySidebar(false);
                }
              }}
              onDeleteEntry={handleDeleteEntry}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>

          {/* Central Workspace */}
          <main className="flex-1 flex flex-col min-w-0 bg-white relative">
            
            {/* Sidebar toggle button bar */}
            <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
              <button
                id="toggle-history-sidebar-btn"
                onClick={() => setShowHistorySidebar((prev) => !prev)}
                className="p-1.5 rounded-lg border border-stone-200 bg-white/90 backdrop-blur-xs text-stone-600 hover:bg-stone-100 hover:text-stone-900 shadow-2xs transition-colors"
                title={showHistorySidebar ? 'Collapse History' : 'Expand History'}
              >
                {showHistorySidebar ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </button>
            </div>

            {activeInteraction ? (
              <ReflectionWorkspace
                interaction={activeInteraction}
                onUpdateInteraction={handleUpdateInteraction}
                onSendMessage={handleSendMessage}
                isLoadingAI={isLoadingAI}
                isSaving={isSaving}
                saveError={saveError}
                onRetrySave={() => handleUpdateInteraction({})}
                onOpenInsights={() => setShowInsightsDrawer((prev) => !prev)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50/50">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs mb-4">
                  <BrainCircuit className="h-7 w-7" />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  Welcome to ReflectAI
                </h3>
                <p className="text-xs text-stone-500 mt-2 max-w-sm leading-relaxed">
                  Start your first journal entry or reflection. All notes and Gemini responses are privately stored in your isolated Firestore account.
                </p>
                <button
                  id="empty-state-new-entry-btn"
                  onClick={handleNewEntry}
                  className="mt-5 rounded-xl bg-amber-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-800 transition-colors"
                >
                  Create First Reflection
                </button>
              </div>
            )}
          </main>

          {/* Right Insights Drawer */}
          {showInsightsDrawer && activeInteraction && (
            <div className="w-80 sm:w-96 shrink-0 transition-all duration-300 border-l border-stone-200 relative z-20">
              <InsightsPanel
                interaction={activeInteraction}
                onUpdateInteraction={handleUpdateInteraction}
                onGenerateSummary={handleGenerateSummary}
                isGeneratingSummary={isGeneratingSummary}
                onClose={() => setShowInsightsDrawer(false)}
              />
            </div>
          )}

        </div>
      )}

    </div>
  );
}
