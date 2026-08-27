import React from 'react';
import { 
  Sparkles, 
  LogOut, 
  PlusCircle, 
  ShieldCheck, 
  Database, 
  User as UserIcon 
} from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  entryCount: number;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  entryCount,
  isSyncing,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-stone-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-stone-50 shadow-sm">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-stone-900">
                Reflect<span className="text-amber-700">AI</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Isolated
              </span>
            </div>
            <p className="hidden text-xs text-stone-500 sm:block">
              Authenticated Gemini Journal & Firestore Storage
            </p>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Firestore Real-Time Status */}
              <div 
                id="firestore-status-badge" 
                className="hidden md:flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 shadow-2xs"
                title="Data strictly bound to your UID in Cloud Firestore"
              >
                <Database className={`h-3.5 w-3.5 ${isSyncing ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
                <span>{isSyncing ? 'Syncing...' : `${entryCount} ${entryCount === 1 ? 'Entry' : 'Entries'} Saved`}</span>
              </div>

              {/* New Reflection Button */}
              <button
                id="navbar-new-entry-btn"
                onClick={onNewEntry}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-800 transition-colors focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Reflection</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Profile'}
                    referrerPolicy="no-referrer"
                    className="h-8 w-8 rounded-full border border-stone-300 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-stone-700">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}

                <div className="hidden lg:block text-left text-xs">
                  <div className="font-semibold text-stone-800 truncate max-w-[130px]">
                    {user.displayName || 'Authenticated User'}
                  </div>
                  <div className="text-stone-500 truncate max-w-[130px]">
                    {user.email || user.uid.substring(0, 10)}
                  </div>
                </div>

                <button
                  id="signout-button"
                  onClick={onSignOut}
                  className="rounded-lg p-2 text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-colors"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
