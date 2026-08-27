import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Tag as TagIcon, 
  Smile, 
  BookOpen, 
  ListOrdered, 
  Lightbulb, 
  SlidersHorizontal,
  ChevronRight,
  Database
} from 'lucide-react';
import { PromptSuggestions } from './PromptSuggestions';
import type { JournalInteraction, ChatMessage, ReflectionMode, MoodType } from '../types';

interface ReflectionWorkspaceProps {
  interaction: JournalInteraction;
  onUpdateInteraction: (updated: Partial<JournalInteraction>) => void;
  onSendMessage: (text: string, mode: ReflectionMode) => Promise<void>;
  isLoadingAI: boolean;
  isSaving: boolean;
  saveError: string | null;
  onRetrySave: () => void;
  onOpenInsights: () => void;
}

const MODES: { id: ReflectionMode; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'reflect', label: 'Deep Reflection', desc: 'Philosophical inquiry, empathy & validation', icon: Sparkles },
  { id: 'brainstorm', label: 'Brainstorming', desc: 'Creative ideas, alternate paths & exploration', icon: Lightbulb },
  { id: 'summarize', label: 'Synthesis', desc: 'Key takeaways, emotional tone & summaries', icon: BookOpen },
  { id: 'action_plan', label: 'Action Steps', desc: 'Prioritized milestones & concrete habits', icon: ListOrdered },
];

const MOODS: { id: MoodType; label: string; emoji: string; color: string }[] = [
  { id: 'reflective', label: 'Reflective', emoji: '🤔', color: 'text-indigo-600' },
  { id: 'calm', label: 'Calm', emoji: '🌿', color: 'text-teal-600' },
  { id: 'inspired', label: 'Inspired', emoji: '✨', color: 'text-amber-600' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏', color: 'text-emerald-600' },
  { id: 'energized', label: 'Energized', emoji: '⚡', color: 'text-orange-600' },
  { id: 'anxious', label: 'Anxious', emoji: '🌊', color: 'text-rose-600' },
  { id: 'neutral', label: 'Neutral', emoji: '☁️', color: 'text-stone-600' },
];

export const ReflectionWorkspace: React.FC<ReflectionWorkspaceProps> = ({
  interaction,
  onUpdateInteraction,
  onSendMessage,
  isLoadingAI,
  isSaving,
  saveError,
  onRetrySave,
  onOpenInsights,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeMode, setActiveMode] = useState<ReflectionMode>('reflect');
  const [newTagInput, setNewTagInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of transcript when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interaction.messages, isLoadingAI]);

  // Speech synthesis read-aloud
  const handleSpeak = (messageId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyMessage = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoadingAI) return;

    const text = inputText.trim();
    setInputText('');
    await onSendMessage(text, activeMode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().toLowerCase();
    if (!interaction.tags.includes(tag)) {
      onUpdateInteraction({ tags: [...interaction.tags, tag] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateInteraction({
      tags: interaction.tags.filter(t => t !== tagToRemove),
    });
  };

  const currentMoodObj = MOODS.find(m => m.id === interaction.mood) || MOODS[0];

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Workspace Header: Title, Mood, Tags, Status */}
      <div className="border-b border-stone-200 bg-stone-50/40 p-4 sm:px-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Editable Title */}
          <input
            id="reflection-title-input"
            type="text"
            value={interaction.title}
            onChange={(e) => onUpdateInteraction({ title: e.target.value })}
            placeholder="Name this reflection or journal session..."
            className="flex-1 min-w-[200px] text-lg sm:text-xl font-serif font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-600 focus:outline-none py-0.5"
          />

          {/* Right Toolbar */}
          <div className="flex items-center gap-2">
            
            {/* Mood selector pill */}
            <div className="relative">
              <button
                id="mood-picker-btn"
                onClick={() => setShowMoodPicker(prev => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 shadow-2xs hover:bg-stone-50"
              >
                <span>{currentMoodObj.emoji}</span>
                <span className="capitalize">{currentMoodObj.label}</span>
              </button>

              {showMoodPicker && (
                <div className="absolute right-0 mt-1 w-44 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl z-20">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => {
                        onUpdateInteraction({ mood: mood.id });
                        setShowMoodPicker(false);
                      }}
                      className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                        interaction.mood === mood.id ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>{mood.emoji}</span>
                      <span>{mood.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Insights Drawer Trigger */}
            <button
              id="open-insights-btn"
              onClick={onOpenInsights}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors"
            >
              <BrainCircuit className="h-3.5 w-3.5 text-amber-700" />
              <span>AI Insights</span>
            </button>
          </div>
        </div>

        {/* Tags row & Persistence indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {interaction.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-stone-200/80 px-2 py-0.5 text-stone-700 text-[11px]"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-stone-900 font-bold ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}

            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                placeholder="+ tag"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="w-16 rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[11px] text-stone-700 placeholder:text-stone-400 focus:outline-none focus:w-24 transition-all"
              />
            </div>
          </div>

          {/* Live Firestore Persistence Status */}
          <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
            <Database className={`h-3 w-3 ${isSaving ? 'text-amber-500 animate-spin' : 'text-emerald-600'}`} />
            <span>
              {isSaving ? 'Saving to Firestore...' : 'Saved to isolated Firestore'}
            </span>
          </div>
        </div>
      </div>

      {/* Save Error Alert Banner */}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>Database persistence warning: {saveError}</span>
          </div>
          <button
            onClick={onRetrySave}
            className="underline font-semibold hover:text-red-900 ml-3"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="px-4 sm:px-6 py-2 border-b border-stone-200 bg-stone-100/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <SlidersHorizontal className="h-3 w-3" />
          AI Mode:
        </span>
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-stone-900 text-white font-medium shadow-2xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
              title={mode.desc}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Multi-Turn Reflection Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {interaction.messages.length === 0 ? (
          <div className="max-w-xl mx-auto my-8 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Begin Your Reflection
              </h3>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
                Write freely about what is on your mind, a decision you are navigating, or today&apos;s events. Gemini will respond with insightful feedback and reflections.
              </p>
            </div>

            {/* Prompt Starter Suggestions */}
            <div className="mt-4 text-left">
              <PromptSuggestions
                currentMood={interaction.mood}
                onSelectPrompt={(p) => setInputText(p)}
              />
            </div>
          </div>
        ) : (
          interaction.messages.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-stone-50 shadow-2xs mt-1">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  </div>
                )}

                {/* Message Bubble Card */}
                <div
                  className={`relative max-w-2xl rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                    isUser
                      ? 'bg-amber-700 text-white rounded-br-xs'
                      : 'bg-stone-50 border border-stone-200 text-stone-900 rounded-bl-xs'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-current/10 text-[11px] opacity-80">
                    <span className="font-semibold">
                      {isUser ? 'Your Journal Reflection' : 'Gemini 3.6 Flash'}
                    </span>
                    <span className="text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Body Content with Markdown for AI */}
                  <div className="text-xs sm:text-sm leading-relaxed space-y-2">
                    {isUser ? (
                      <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                    ) : (
                      <div className="prose prose-stone prose-xs max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}
                  </div>

                  {/* Actions (Copy / Text to speech) */}
                  <div className="mt-3 flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className={`p-1 rounded text-xs transition-colors ${
                        isUser ? 'hover:bg-amber-800 text-white/80' : 'hover:bg-stone-200 text-stone-500'
                      }`}
                      title="Copy text"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {!isUser && (
                      <button
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        className={`p-1 rounded text-xs transition-colors hover:bg-stone-200 ${
                          speakingMessageId === msg.id ? 'text-amber-600 font-bold' : 'text-stone-500'
                        }`}
                        title={speakingMessageId === msg.id ? 'Stop audio' : 'Read aloud'}
                      >
                        {speakingMessageId === msg.id ? (
                          <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-2xs mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* AI Generating Indicator */}
        {isLoadingAI && (
          <div className="flex gap-3 sm:gap-4 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-stone-50 shadow-2xs mt-1">
              <Sparkles className="h-4 w-4 text-amber-300 animate-spin" />
            </div>
            <div className="rounded-2xl rounded-bl-xs bg-stone-50 border border-stone-200 p-4 shadow-xs flex items-center gap-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-stone-600 font-medium">
                Gemini is reflecting on your entry...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Journal Reflection Input Bar */}
      <div className="border-t border-stone-200 bg-white p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-2">
          
          <div className="relative rounded-xl border border-stone-300 bg-white shadow-sm focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-600/20 transition-all">
            <textarea
              id="journal-input-textarea"
              ref={textareaRef}
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Write your journal entry or continue the reflection (Mode: ${activeMode})...`}
              className="w-full resize-none bg-transparent p-3.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none font-sans leading-relaxed"
            />

            {/* Bottom Bar inside Input */}
            <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50/50 px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] text-stone-400">
                <span>{inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words</span>
                <span>•</span>
                <span className="hidden sm:inline">Press Cmd + Enter to submit</span>
              </div>

              <button
                id="submit-reflection-btn"
                type="submit"
                disabled={!inputText.trim() || isLoadingAI}
                className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 transition-all focus:ring-2 focus:ring-stone-400 disabled:opacity-50"
              >
                {isLoadingAI ? (
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-amber-300" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{isLoadingAI ? 'Processing...' : 'Reflect with Gemini'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>

    </div>
  );
};
