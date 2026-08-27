import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  ListOrdered, 
  Compass, 
  TrendingUp, 
  X,
  FileText
} from 'lucide-react';
import type { JournalInteraction, SentimentAnalysis } from '../types';

interface InsightsPanelProps {
  interaction: JournalInteraction;
  onUpdateInteraction: (updated: Partial<JournalInteraction>) => void;
  onGenerateSummary: () => Promise<void>;
  isGeneratingSummary: boolean;
  onClose?: () => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  interaction,
  onUpdateInteraction,
  onGenerateSummary,
  isGeneratingSummary,
  onClose,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Toggle action item completion
  const handleToggleActionItem = (index: number) => {
    if (!interaction.actionItems) return;
    const currentItem = interaction.actionItems[index];
    const isCompleted = currentItem.startsWith('[x] ');
    const updatedItem = isCompleted
      ? currentItem.replace('[x] ', '')
      : `[x] ${currentItem}`;
    
    const newItems = [...interaction.actionItems];
    newItems[index] = updatedItem;
    onUpdateInteraction({ actionItems: newItems });
  };

  // Export functions
  const generateMarkdownExport = () => {
    let md = `# ${interaction.title || 'Untitled Reflection'}\n\n`;
    md += `**Date:** ${new Date(interaction.createdAt).toLocaleDateString()} | **Mood:** ${interaction.mood}\n`;
    if (interaction.tags?.length) {
      md += `**Tags:** ${interaction.tags.join(', ')}\n`;
    }
    md += `\n---\n\n`;

    if (interaction.summary) {
      md += `## 🌟 Executive Summary\n${interaction.summary}\n\n`;
    }

    if (interaction.actionItems?.length) {
      md += `## 🎯 Action Items\n`;
      interaction.actionItems.forEach(item => {
        const checked = item.startsWith('[x] ');
        const clean = item.replace('[x] ', '');
        md += `- [${checked ? 'x' : ' '}] ${clean}\n`;
      });
      md += `\n`;
    }

    md += `## 💬 Reflection Transcript\n\n`;
    interaction.messages.forEach(m => {
      const sender = m.role === 'user' ? '👤 **You**' : '✨ **Gemini**';
      md += `### ${sender} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n`;
    });

    return md;
  };

  const handleCopyMarkdown = async () => {
    const md = generateMarkdownExport();
    await navigator.clipboard.writeText(md);
    setCopiedFormat('markdown');
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownloadFile = (type: 'md' | 'txt') => {
    const text = generateMarkdownExport();
    const blob = new Blob([text], { type: type === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(interaction.title || 'reflection').toLowerCase().replace(/[^a-z0-9]/g, '-')}.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sentiment = interaction.sentiment;

  return (
    <div className="flex flex-col h-full bg-white border-l border-stone-200 overflow-y-auto">
      
      {/* Header */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-amber-700" />
          <h3 className="text-sm font-semibold text-stone-900">AI Insights & Synthesis</h3>
        </div>

        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              title="Close Insights Panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Re-generate / Generate Summary Button */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Summary & Analysis
          </span>

          <button
            id="generate-summary-btn"
            onClick={onGenerateSummary}
            disabled={isGeneratingSummary || interaction.messages.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isGeneratingSummary ? 'animate-spin text-amber-700' : 'text-amber-700'}`} />
            <span>{isGeneratingSummary ? 'Analyzing with Gemini...' : (interaction.summary ? 'Refresh Analysis' : 'Generate Summary')}</span>
          </button>
        </div>

        {/* Executive Summary Block */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Executive Synthesis</span>
          </div>

          {interaction.summary ? (
            <p className="text-xs text-stone-700 leading-relaxed font-sans">
              {interaction.summary}
            </p>
          ) : (
            <p className="text-xs text-stone-500 italic">
              Click &quot;Generate Summary&quot; to synthesize key takeaways and emotional themes from this conversation.
            </p>
          )}
        </div>

        {/* Sentiment & Tone Metrics */}
        {sentiment && (
          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                Introspection Index
              </span>
              <span className="font-bold text-stone-900">{sentiment.score}/10</span>
            </div>

            {/* Score Bar */}
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(sentiment.score * 10, 10), 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="rounded-lg bg-stone-50 p-2 border border-stone-100">
                <div className="text-[10px] text-stone-400 font-medium uppercase">Primary Theme</div>
                <div className="text-stone-800 font-semibold truncate capitalize">{sentiment.keyTheme}</div>
              </div>
              <div className="rounded-lg bg-stone-50 p-2 border border-stone-100">
                <div className="text-[10px] text-stone-400 font-medium uppercase">Reflection Tone</div>
                <div className="text-stone-800 font-semibold truncate capitalize">{sentiment.reflectionTone}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Items Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <ListOrdered className="h-3.5 w-3.5 text-stone-500" />
              Actionable Takeaways ({interaction.actionItems?.length || 0})
            </span>
          </div>

          {interaction.actionItems && interaction.actionItems.length > 0 ? (
            <div className="space-y-1.5">
              {interaction.actionItems.map((item, idx) => {
                const isCompleted = item.startsWith('[x] ');
                const label = item.replace('[x] ', '');
                return (
                  <button
                    key={idx}
                    onClick={() => handleToggleActionItem(idx)}
                    className="w-full flex items-start gap-2.5 rounded-lg border border-stone-200/80 bg-white p-2 text-left text-xs transition-colors hover:bg-stone-50"
                  >
                    {isCompleted ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-4 w-4 text-stone-400 shrink-0 mt-0.5" />
                    )}
                    <span className={`leading-relaxed ${isCompleted ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-stone-200 p-3 text-center text-xs text-stone-400">
              No action items extracted yet.
            </div>
          )}
        </div>

        {/* Export & Actions */}
        <div className="pt-3 border-t border-stone-200 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
            Export & Backup
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            >
              {copiedFormat === 'markdown' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-stone-500" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownloadFile('md')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-stone-500" />
              <span>Download .MD</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
