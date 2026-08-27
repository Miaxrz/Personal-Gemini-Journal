import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  BrainCircuit, 
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface AuthLandingProps {
  onSignIn: () => Promise<void>;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onSignIn }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await onSignIn();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(err?.message || 'Authentication encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-stone-50 via-stone-100/60 to-stone-200/50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl w-full">
        
        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-12 shadow-xl shadow-stone-200/60"
        >
          {/* Header & Badges */}
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-medium text-amber-900 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-amber-700" />
              Powered by Gemini 3.6 Flash & Cloud Firestore
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
              A private space to reflect, brainstorm, and discover insights.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Write daily journals and multi-turn reflections. Converse with Gemini for thoughtful feedback, structured summaries, and actionable next steps—all secured by isolated Firestore database rules.
            </p>
          </div>

          {/* Error Banner if any */}
          {errorMessage && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="google-signin-btn"
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-stone-900 px-8 py-3.5 text-base font-semibold text-white shadow-md hover:bg-stone-800 transition-all focus:ring-4 focus:ring-stone-300 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Authenticating...' : 'Sign In with Google'}</span>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </button>
          </div>

          {/* Privacy & Security Architecture Guarantee */}
          <div className="mt-10 pt-8 border-t border-stone-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Owner-Isolated Storage</h3>
                  <p className="mt-1 text-xs text-stone-500 leading-normal">
                    Strict Firestore security rules enforce that only your UID can read or write your journals.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Multi-Turn Gemini 3.6</h3>
                  <p className="mt-1 text-xs text-stone-500 leading-normal">
                    Engage in multi-turn dialogues for deep reflection, idea brainstorming, and instant summaries.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Federated Auth</h3>
                  <p className="mt-1 text-xs text-stone-500 leading-normal">
                    Secure Google Firebase Auth handles identity without storing plain credentials.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </motion.div>

        {/* Bottom Feature Highlights */}
        <div className="mt-8 text-center text-xs text-stone-500 flex items-center justify-center gap-6">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Automatic Firestore Persistence
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Multi-Turn Chat History
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            AI Takeaways & Sentiment Analysis
          </span>
        </div>

      </div>
    </div>
  );
};
