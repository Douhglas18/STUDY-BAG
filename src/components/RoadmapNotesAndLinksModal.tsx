import React, { useState } from 'react';
import { 
  X, BookOpen, Link2, Plus, Trash2, ExternalLink, Globe, 
  Upload, Sparkles, Save, CheckCircle2, FileText, ArrowUpRight 
} from 'lucide-react';
import { PersonalRoadmap, RoadmapReferenceLink, GroundedWebSource } from '../types';

interface RoadmapNotesAndLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmap: PersonalRoadmap;
  onUpdateNotesAndLinks: (sourceNotes: string, referenceLinks: RoadmapReferenceLink[]) => void;
  onRefineWithAI: (notes: string, links: RoadmapReferenceLink[]) => void;
}

export const RoadmapNotesAndLinksModal: React.FC<RoadmapNotesAndLinksModalProps> = ({
  isOpen,
  onClose,
  roadmap,
  onUpdateNotesAndLinks,
  onRefineWithAI
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'links' | 'grounded'>('notes');
  const [notes, setNotes] = useState(roadmap.sourceNotes || '');
  const [links, setLinks] = useState<RoadmapReferenceLink[]>(roadmap.referenceLinks || []);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddLink = () => {
    if (!newUrl.trim()) return;
    let url = newUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    const title = newTitle.trim() || new URL(url).hostname;

    const newLinkItem: RoadmapReferenceLink = {
      id: 'link-' + Date.now(),
      title,
      url,
      note: newNote.trim() || undefined
    };

    const updated = [...links, newLinkItem];
    setLinks(updated);
    setNewUrl('');
    setNewTitle('');
    setNewNote('');
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setNotes(prev => prev ? `${prev}\n\n--- [Uploaded: ${file.name}] ---\n${content}` : content);
      }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    onUpdateNotesAndLinks(notes, links);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleRegenerate = () => {
    onUpdateNotesAndLinks(notes, links);
    onClose();
    onRefineWithAI(notes, links);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-indigo-400" />
              <span>Study Notes & Reference Links</span>
            </span>
          </div>

          <h2 className="text-lg font-extrabold text-white">
            {roadmap.title}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Manage your study syllabus notes and curated reference links. The AI builds and updates the roadmap stages to reflect these exact resources.
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/60">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Study Notes</span>
              {notes.trim().length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'links'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Reference Links ({links.length})</span>
            </button>

            {roadmap.groundedSources && roadmap.groundedSources.length > 0 && (
              <button
                onClick={() => setActiveTab('grounded')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  activeTab === 'grounded'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Search ({roadmap.groundedSources.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          
          {/* TAB 1: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs">Study Notes & Syllabus Units</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Add or update your study plan, lecture notes, textbook chapters, or weak areas.
                  </p>
                </div>

                <label className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 cursor-pointer flex items-center gap-1.5 text-[11px] font-semibold transition-colors">
                  <Upload className="w-3 h-3 text-indigo-400" />
                  <span>Upload .txt / .md</span>
                  <input
                    type="file"
                    accept=".txt,.md,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={9}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="No custom notes yet. Type or paste your syllabus units, study topics, formulas, or lecture points..."
                className="w-full p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans text-xs leading-relaxed"
              />

              <div className="text-[10px] text-slate-500">
                {notes.length} characters • {notes.split('\n').filter(Boolean).length} lines
              </div>
            </div>
          )}

          {/* TAB 2: REFERENCE LINKS */}
          {activeTab === 'links' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="font-bold text-white text-xs">Reference Links & Recommended Resources</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Save direct links to textbooks, online documentation, video tutorials, or practice portals.
                </p>
              </div>

              {/* Add Link Input */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="url"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="URL (e.g. https://...)"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Title (e.g. Textbook Chapter 3)"
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Optional Note / Guidance"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    disabled={!newUrl.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shrink-0 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                </div>
              </div>

              {/* Links list */}
              {links.length > 0 ? (
                <div className="space-y-2">
                  {links.map((link, idx) => (
                    <div 
                      key={link.id || idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded bg-indigo-600/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate flex items-center gap-1.5">
                            <span>{link.title || link.url}</span>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-indigo-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {link.url}
                          </div>
                          {link.note && (
                            <div className="text-[10px] text-indigo-300/80 mt-0.5 italic">
                              {link.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400 text-xs">
                  No reference links added yet. Add links above to connect course materials directly to your study plan.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GROUNDED WEB SOURCES */}
          {activeTab === 'grounded' && roadmap.groundedSources && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Globe className="w-4 h-4" />
                <span>Web Sources Discovered by Google Search Grounding</span>
              </div>
              <p className="text-[11px] text-slate-400">
                These sources were queried in real time to establish realistic curriculum standards, topic weights, and authoritative learning paths.
              </p>

              <div className="space-y-2 pt-1">
                {roadmap.groundedSources.map((src: GroundedWebSource, idx: number) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white group-hover:text-emerald-300 truncate">
                        {src.title || src.uri}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {src.uri}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold flex items-center gap-1.5 transition-colors border border-indigo-500/30"
              title="Open AI Generator with updated notes"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Refine Roadmap with AI</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes & Links</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
