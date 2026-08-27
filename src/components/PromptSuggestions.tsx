import React, { useState } from 'react';
import { Sparkles, RefreshCw, Lightbulb, Compass, HeartHandshake, Target } from 'lucide-react';
import type { MoodType } from '../types';

interface PromptSuggestionsProps {
  currentMood: MoodType;
  onSelectPrompt: (promptText: string) => void;
}

const PRESET_PROMPTS: Record<string, string[]> = {
  general: [
    "What is something you learned about yourself this week that surprised you?",
    "Describe a challenge you faced recently. How did you respond, and what would you do differently next time?",
    "What are three things in this exact moment that bring you a sense of calm or gratitude?",
    "What is a decision you have been putting off, and what is holding you back from making it?",
    "If you could give your future self one piece of advice for tomorrow, what would it be?"
  ],
  calm: [
    "What does your ideal peaceful morning look like, and how can you cultivate a piece of it tomorrow?",
    "Describe a recent quiet moment that felt restorative to your mind.",
    "What physical sensations of comfort are you noticing around you right now?"
  ],
  inspired: [
    "What is an idea or project that is currently exciting your imagination?",
    "Who is someone whose creative energy or resilience inspires you, and why?",
    "If resources or time were unlimited, what meaningful thing would you build or explore?"
  ],
  reflective: [
    "How have your core priorities evolved over the past six months?",
    "What is a recurring thought pattern you've noticed lately, and is it serving you well?",
    "What does success look like for you in this current chapter of your life?"
  ],
  anxious: [
    "What is one worry on your mind, and what parts of it are truly within your control?",
    "Write out everything making you feel overwhelmed, then identify the single smallest step forward.",
    "What has helped you navigate similar moments of uncertainty in the past?"
  ],
  energized: [
    "How will you direct today's momentum towards your most meaningful goals?",
    "What is a bold step you feel ready to take today?",
    "What positive habits or routines have contributed to your high energy today?"
  ],
  grateful: [
    "Who is someone who supported you without asking for anything in return?",
    "What is an everyday ordinary luxury that you often overlook but deeply appreciate?",
    "Reflect on a past obstacle that unexpectedly opened a positive new door for you."
  ],
  neutral: [
    "What was the most interesting observation or fact you encountered today?",
    "Describe the landscape of your day from morning to evening in sensory details.",
    "What is one topic you are curious to learn more about this month?"
  ]
};

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  currentMood,
  onSelectPrompt,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  // Fetch fresh prompts from Gemini endpoint
  const handleFetchGeminiPrompts = async () => {
    try {
      setIsLoadingPrompts(true);
      const res = await fetch('/api/gemini/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: currentMood, topic: activeCategory }),
      });
      const data = await res.json();
      if (data.prompts && Array.isArray(data.prompts)) {
        setCustomPrompts(data.prompts);
      }
    } catch (err) {
      console.error('Failed to fetch Gemini prompts:', err);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const displayPrompts = customPrompts.length > 0
    ? customPrompts
    : (PRESET_PROMPTS[currentMood] || PRESET_PROMPTS.general);

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
            Inspiration & Reflection Starters
          </span>
        </div>

        <button
          id="fetch-gemini-prompts-btn"
          onClick={handleFetchGeminiPrompts}
          disabled={isLoadingPrompts}
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors shadow-2xs disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isLoadingPrompts ? 'animate-spin text-amber-600' : 'text-stone-500'}`} />
          <span>{isLoadingPrompts ? 'Generating...' : 'AI Prompts'}</span>
        </button>
      </div>

      {/* Prompts list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {displayPrompts.slice(0, 4).map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt)}
            className="group flex items-start gap-2.5 rounded-lg border border-stone-200/90 bg-white p-2.5 text-left text-xs text-stone-700 shadow-2xs hover:border-amber-400 hover:bg-amber-50/40 hover:text-stone-900 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500/70 group-hover:text-amber-600 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
