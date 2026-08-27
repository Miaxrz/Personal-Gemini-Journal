export type ReflectionMode = 'reflect' | 'brainstorm' | 'summarize' | 'action_plan';

export type MoodType = 'calm' | 'inspired' | 'reflective' | 'anxious' | 'energized' | 'grateful' | 'neutral';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: ReflectionMode;
}

export interface SentimentAnalysis {
  mood: MoodType;
  score: number; // 1 to 10
  keyTheme: string;
  reflectionTone: string;
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mood: MoodType;
  tags: string[];
  messages: ChatMessage[];
  summary?: string;
  actionItems?: string[];
  sentiment?: SentimentAnalysis;
  isFavorite?: boolean;
  wordCount: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AIResponsePayload {
  reply: string;
  summary?: string;
  actionItems?: string[];
  suggestedFollowUps?: string[];
  sentiment?: SentimentAnalysis;
  modelUsed: string;
}
