import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Star, 
  Trash2, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  Tag, 
  FolderOpen,
  Filter
} from 'lucide-react';
import type { JournalInteraction, MoodType } from '../types';

interface EntryHistoryListProps {
  entries: JournalInteraction[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalInteraction) => void;
  onDeleteEntry: (entryId: string) => void;
  onToggleFavorite: (entryId: string, isFavorite: boolean) => void;
}

const MOOD_COLORS: Record<MoodType, { bg: string; text: string; dot: string; label: string }> = {
  calm: { bg: 'bg-teal-50', text: 'text-teal-800', dot: 'bg-teal-500', label: 'Calm' },
  inspired: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', label: 'Inspired' },
  reflective: { bg: 'bg-indigo-50', text: 'text-indigo-800', dot: 'bg-indigo-500', label: 'Reflective' },
  anxious: { bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500', label: 'Anxious' },
  energized: { bg: 'bg-orange-50', text: 'text-orange-800', dot: 'bg-orange-500', label: 'Energized' },
  grateful: { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Grateful' },
  neutral: { bg: 'bg-stone-100', text: 'text-stone-700', dot: 'bg-stone-400', label: 'Neutral' },
};

export const EntryHistoryList: React.FC<EntryHistoryListProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onDeleteEntry,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        entry.title.toLowerCase().includes(query) ||
        (entry.summary && entry.summary.toLowerCase().includes(query)) ||
        entry.messages.some(m => m.content.toLowerCase().includes(query)) ||
        entry.tags.some(t => t.toLowerCase().includes(query));

      // Mood match
      const matchesMood = selectedMoodFilter === 'all' || entry.mood === selectedMoodFilter;

      // Favorite match
      const matchesFavorite = !showOnlyFavorites || !!entry.isFavorite;

      return matchesSearch && matchesMood && matchesFavorite;
    });
  }, [entries, searchQuery, selectedMoodFilter, showOnlyFavorites]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-full bg-stone-50/50 border-r border-stone-200">
      
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-stone-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-stone-500" />
            Reflection Journal ({entries.length})
          </h2>
          
          <button
            id="toggle-fav-filter-btn"
            onClick={() => setShowOnlyFavorites(prev => !prev)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              showOnlyFavorites
                ? 'border-amber-400 bg-amber-50 text-amber-900 font-medium'
                : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
            title="Show only starred entries"
          >
            <Star className={`h-3.5 w-3.5 ${showOnlyFavorites ? 'fill-amber-500 text-amber-500' : 'text-stone-400'}`} />
            <span>Favorites</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            id="journal-search-input"
            type="text"
            placeholder="Search reflections, tags, or AI replies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50/60 pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600"
          />
        </div>

        {/* Mood filter pill chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedMoodFilter('all')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              selectedMoodFilter === 'all'
                ? 'bg-stone-900 text-white font-medium'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All
          </button>
          {(['calm', 'inspired', 'reflective', 'grateful', 'energized', 'anxious'] as MoodType[]).map((mood) => {
            const isSelected = selectedMoodFilter === mood;
            const style = MOOD_COLORS[mood];
            return (
              <button
                key={mood}
                onClick={() => setSelectedMoodFilter(isSelected ? 'all' : mood)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap capitalize transition-colors ${
                  isSelected
                    ? `${style.bg} ${style.text} font-semibold ring-1 ring-stone-400`
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entry List Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FolderOpen className="h-10 w-10 text-stone-300 mb-2" />
            <p className="text-sm font-medium text-stone-700">No reflections found</p>
            <p className="text-xs text-stone-500 mt-1 max-w-[220px]">
              {searchQuery || selectedMoodFilter !== 'all' || showOnlyFavorites
                ? 'Try clearing search filters or create a new journal entry.'
                : 'Start your first reflective journal entry to converse with Gemini.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isActive = entry.id === activeEntryId;
            const moodStyle = MOOD_COLORS[entry.mood] || MOOD_COLORS.neutral;
            const turnsCount = entry.messages.length;

            return (
              <div
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
                  isActive
                    ? 'border-amber-600 bg-amber-50/40 shadow-xs'
                    : 'border-stone-200/90 bg-white hover:border-stone-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${moodStyle.bg} ${moodStyle.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${moodStyle.dot}`} />
                        {moodStyle.label}
                      </span>
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        {formatDate(entry.updatedAt || entry.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-stone-900 text-sm truncate leading-snug">
                      {entry.title || 'Untitled Reflection'}
                    </h3>

                    {/* Summary or latest text snippet */}
                    <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                      {entry.summary || (entry.messages[0]?.content) || 'No content written yet...'}
                    </p>

                    {/* Tags & stats footer */}
                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-stone-400" />
                        {turnsCount} {turnsCount === 1 ? 'turn' : 'turns'}
                      </span>

                      <span>•</span>

                      <span>{entry.wordCount || 0} words</span>

                      {entry.tags && entry.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1 truncate">
                            <Tag className="h-2.5 w-2.5 text-stone-400 shrink-0" />
                            <span className="truncate max-w-[90px]">{entry.tags.join(', ')}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions on right */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(entry.id, !entry.isFavorite);
                      }}
                      className="p-1 rounded-md text-stone-400 hover:text-amber-500 transition-colors"
                      title={entry.isFavorite ? 'Remove from favorites' : 'Star this reflection'}
                    >
                      <Star className={`h-3.5 w-3.5 ${entry.isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEntryToDelete(entry.id);
                      }}
                      className="p-1 rounded-md text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-stone-200">
            <h4 className="text-base font-semibold text-stone-900">Delete this reflection?</h4>
            <p className="mt-2 text-xs text-stone-500 leading-relaxed">
              This action permanently removes this entry and its Gemini reflection history from your isolated Firestore storage.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setEntryToDelete(null)}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-entry-btn"
                onClick={() => {
                  if (entryToDelete) {
                    onDeleteEntry(entryToDelete);
                    setEntryToDelete(null);
                  }
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
