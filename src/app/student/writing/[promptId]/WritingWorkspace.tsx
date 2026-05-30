'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

interface Rubric {
  name: string;
  criteria: string;
}

interface Prompt {
  id: string;
  title: string;
  description: string;
  rubrics_json: string;
}

interface Submission {
  id: string;
  draft_version: number;
  text: string;
  feedback_json: string;
  version_history_json: string;
  feedback_history_json: string;
  completed: number;
}

interface WritingWorkspaceProps {
  studentId: string;
  prompt: Prompt;
  initialSubmission: Submission | null;
}

interface FeedbackResult {
  scores: { name: string; score: number; max: number; comment?: string }[];
  overall: string;
  inline_feedback: { text_segment: string; hint: string }[];
}

export default function WritingWorkspace({ studentId, prompt, initialSubmission }: WritingWorkspaceProps) {
  const router = useRouter();
  const rubrics: Rubric[] = JSON.parse(prompt.rubrics_json || '[]');

  // Active workspace state
  const [text, setText] = useState(initialSubmission?.text || '');
  const [submission, setSubmission] = useState<Submission | null>(initialSubmission);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Active visual states
  const [activeTab, setActiveTab] = useState<'edit' | 'history'>('edit');
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<{ segment: string; hint: string } | null>(null);

  // Helper to parse feedback JSON
  const getFeedbackObj = (feedbackStr: string | undefined): FeedbackResult | null => {
    if (!feedbackStr) return null;
    try {
      return JSON.parse(feedbackStr);
    } catch (e) {
      console.error('Failed to parse feedback', e);
      return null;
    }
  };

  const currentFeedback = submission ? getFeedbackObj(submission.feedback_json) : null;

  // History parsing
  const getHistoryList = (): { text: string; feedback: FeedbackResult | null; version: number }[] => {
    if (!submission) return [];
    try {
      const historyTexts = JSON.parse(submission.version_history_json || '[]');
      const historyFeedbacks = JSON.parse(submission.feedback_history_json || '[]');
      
      const list = historyTexts.map((txt: string, idx: number) => ({
        text: txt,
        feedback: getFeedbackObj(historyFeedbacks[idx]),
        version: idx + 1
      }));

      // Append current draft at the end as the latest
      list.push({
        text: submission.text,
        feedback: getFeedbackObj(submission.feedback_json),
        version: submission.draft_version
      });

      return list;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const history = getHistoryList();

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (submission?.completed) return;
    setText(e.target.value);
  };

  // Submit current draft to AI coach
  const handleSubmitDraft = async () => {
    if (!text.trim() || loading || submission?.completed) return;

    setLoading(true);
    setError(null);
    setSelectedHighlight(null);

    const statuses = [
      'Sending draft to FelloFish AI Coach...',
      'Analyzing grammatical accuracy...',
      'Reviewing vocabulary complexity...',
      'Formulating constructive suggestions...',
      'Finalizing scores and feedback...'
    ];

    let statusIdx = 0;
    setLoadingStatus(statuses[0]);
    const statusInterval = setInterval(() => {
      statusIdx = (statusIdx + 1) % statuses.length;
      setLoadingStatus(statuses[statusIdx]);
    }, 2500);

    try {
      const res = await fetch('/api/student/writing/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          promptId: prompt.id,
          text: text.trim()
        })
      });

      clearInterval(statusInterval);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit writing');
      }

      const updatedSub = await res.json();
      setSubmission(updatedSub);
      setText(updatedSub.text);
      
      // Award minor confetti on submission
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (err: any) {
      clearInterval(statusInterval);
      setError(err.message || 'Something went wrong. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Finalize and mark submission as complete
  const handleFinalize = async () => {
    if (!submission || submission.completed) return;
    if (!confirm('Are you sure you want to finalize this writing assignment? This will lock it from further editing.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/student/writing/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to finalize submission');
      }

      const updated = await res.json();
      setSubmission(updated);

      // Celebrate full completion!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to finalize assignment');
    } finally {
      setLoading(false);
    }
  };

  // Token Highlighter Renderer
  const renderHighlightedDraft = (draftText: string, inlineFeedback: any[]) => {
    if (!inlineFeedback || inlineFeedback.length === 0) return draftText;
    
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Filter valid segments
    const segments = [...inlineFeedback].filter(
      (item) => item.text_segment && item.text_segment.trim().length > 0
    );

    if (segments.length === 0) return draftText;

    // Sort longer segments first to prevent nested regex replacement collision
    segments.sort((a, b) => b.text_segment.length - a.text_segment.length);

    // Build matching pattern
    const pattern = segments.map((s) => `(${escapeRegExp(s.text_segment)})`).join('|');
    const regex = new RegExp(pattern, 'gi');

    const parts = draftText.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Match lowercase segment
      const match = segments.find(
        (s) => s.text_segment.toLowerCase() === part.toLowerCase()
      );

      if (match) {
        return (
          <span
            key={index}
            onClick={() => setSelectedHighlight({ segment: part, hint: match.hint })}
            className={`cursor-pointer border-b-2 border-dashed border-indigo-400 font-bold px-0.5 transition-all duration-200 ${
              selectedHighlight?.segment === part
                ? 'bg-indigo-500/40 text-white border-indigo-300'
                : 'bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/25'
            }`}
          >
            {part}
          </span>
        );
      }

      return part;
    });
  };

  // Word count and Character count
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT COLUMN: Prompt details, rubrics, history tabs (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Prompt Card */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
          <div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-2.5 py-1 rounded-lg border border-indigo-500/10 uppercase tracking-widest">
              Prompt Goal
            </span>
            <h2 className="text-xl font-extrabold text-white mt-2 tracking-tight uppercase">{prompt.title}</h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1.5 leading-relaxed">
              {prompt.description}
            </p>
          </div>

          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Evaluation Rubrics (0-5 Stars)</span>
            <div className="grid grid-cols-1 gap-2.5">
              {rubrics.map((r, idx) => (
                <div key={idx} className="bg-slate-950/30 border border-slate-850 p-3 rounded-xl flex items-start gap-2.5">
                  <span className="text-indigo-400 text-xs mt-0.5">⭐</span>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">{r.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">{r.criteria}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* History timeline card */}
        {submission && (
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-sm font-black text-white tracking-tight uppercase border-b border-slate-800/80 pb-3">
              Draft History
            </h3>
            
            <div className="flex gap-2 flex-wrap">
              {history.map((h, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab('history');
                    setSelectedHistoryIndex(idx);
                    setSelectedHighlight(null);
                  }}
                  className={`text-xs font-bold py-2 px-4 rounded-xl border transition-all cursor-pointer ${
                    activeTab === 'history' && selectedHistoryIndex === idx
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Draft {h.version}
                </button>
              ))}
              <button
                onClick={() => {
                  setActiveTab('edit');
                  setSelectedHistoryIndex(null);
                  setSelectedHighlight(null);
                }}
                className={`text-xs font-bold py-2 px-4 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                📝 Work Space
              </button>
            </div>

            {activeTab === 'history' && selectedHistoryIndex !== null && history[selectedHistoryIndex] && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-indigo-400 font-black uppercase">Draft {history[selectedHistoryIndex].version} Content</span>
                    <span className="text-[9px] text-slate-500 font-bold">
                      {history[selectedHistoryIndex].text.split(/\s+/).filter(Boolean).length} Words
                    </span>
                  </div>
                  
                  {/* Render inline highlights or raw text */}
                  <div className="text-slate-200 font-serif text-sm leading-relaxed p-2 bg-slate-950/20 rounded border border-slate-900 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {history[selectedHistoryIndex].feedback?.inline_feedback ? (
                      renderHighlightedDraft(
                        history[selectedHistoryIndex].text,
                        history[selectedHistoryIndex].feedback!.inline_feedback
                      )
                    ) : (
                      history[selectedHistoryIndex].text
                    )}
                  </div>
                </div>

                {/* Score indicators for history */}
                {history[selectedHistoryIndex].feedback && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Draft Evaluation</h4>
                    
                    {/* Overall feedback */}
                    <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-2xl p-4 text-xs italic text-indigo-200 leading-relaxed">
                      "{history[selectedHistoryIndex].feedback?.overall}"
                    </div>

                    <div className="space-y-2">
                      {history[selectedHistoryIndex].feedback?.scores.map((score, sIdx) => (
                        <div key={sIdx} className="bg-slate-950/20 border border-slate-900 p-3 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white">{score.name}</span>
                            <span className="font-extrabold text-indigo-400">{score.score} / {score.max}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${(score.score / score.max) * 100}%` }}
                            />
                          </div>
                          {score.comment && (
                            <p className="text-[10px] text-slate-400 italic mt-0.5">{score.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {/* RIGHT COLUMN: Interactive Work Space or Active Highlights (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {activeTab === 'edit' ? (
          <div className="space-y-6 animate-scaleUp">
            {/* Editor Workspace */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 relative">
              <div className="border-b border-slate-800/80 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">Writing Draft Area</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Write your response in English below.</p>
                </div>
                
                {submission && (
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-widest">
                    Version {submission.draft_version}
                  </span>
                )}
              </div>

              {/* Text Area */}
              <div className="space-y-2 relative">
                <textarea
                  value={text}
                  onChange={handleTextareaChange}
                  disabled={loading || submission?.completed === 1}
                  placeholder="Once upon a time, my family and I went on an adventure..."
                  className="w-full h-80 bg-slate-950/60 border border-slate-850 rounded-2xl p-5 text-slate-200 font-serif text-base focus:border-indigo-500 focus:outline-none transition-colors resize-none placeholder-slate-600 disabled:opacity-75 disabled:cursor-not-allowed leading-relaxed"
                  style={{ touchAction: 'manipulation' }}
                />

                <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                  <span>{wordCount} Words</span>
                  <span>{charCount} Characters</span>
                </div>
              </div>

              {/* Error log */}
              {error && (
                <div className="bg-red-950/20 border border-red-500/30 text-red-200 p-4 rounded-2xl text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-between items-center border-t border-slate-800/80 pt-6">
                <div>
                  {submission && !submission.completed && (
                    <button
                      onClick={handleFinalize}
                      disabled={loading}
                      className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs py-2.5 px-5 rounded-xl border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Finalize & Lock Assignment
                    </button>
                  )}
                  {submission?.completed === 1 && (
                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                      ✓ Assignment Locked & Completed
                    </span>
                  )}
                </div>

                {!submission?.completed && (
                  <button
                    onClick={handleSubmitDraft}
                    disabled={loading || !text.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 font-bold text-xs py-3 px-6 rounded-xl border border-indigo-400/20 shadow-lg shadow-indigo-500/10 transition-all cursor-pointer flex items-center gap-2.5 min-h-[44px] disabled:shadow-none disabled:border-transparent disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <span>Submit for Feedback</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* AI Loading Modal Overlay */}
            {loading && (
              <div className="bg-slate-950/80 border border-indigo-500/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center space-y-4 animate-pulse">
                <span className="w-8 h-8 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">FelloFish AI Coach</span>
                <p className="text-slate-300 font-bold text-sm text-center">{loadingStatus}</p>
              </div>
            )}

            {/* Current Evaluation & Interactive Highlight Panel */}
            {submission && !loading && currentFeedback && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">Interactive AI Feedback</h3>
                  <span className="text-[10px] text-indigo-400 font-black">TAP HIGHLIGHTS FOR HINTS</span>
                </div>

                {/* Overall Feedback bubble */}
                <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-2xl p-4 text-sm text-indigo-200 leading-relaxed italic">
                  "{currentFeedback.overall}"
                </div>

                {/* Main text box showing highlights */}
                <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block border-b border-slate-900 pb-1.5 mb-2">Submitted Draft text</span>
                  <p className="text-slate-200 font-serif text-base leading-relaxed md:leading-loose whitespace-pre-wrap">
                    {renderHighlightedDraft(submission.text, currentFeedback.inline_feedback)}
                  </p>
                </div>

                {/* Active highlight explanation tooltip box */}
                {selectedHighlight ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-amber-400">💡 Hint for:</span>
                      <span className="text-xs font-serif font-black text-white italic">"{selectedHighlight.segment}"</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-bold">
                      {selectedHighlight.hint}
                    </p>
                  </div>
                ) : (
                  currentFeedback.inline_feedback?.length > 0 && (
                    <div className="text-[10px] text-slate-500 text-center font-bold">
                      💡 Tapping highlights above will show the Writing Coach hints here.
                    </div>
                  )
                )}

                {/* Rubric scores */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Criteria Scoring</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentFeedback.scores.map((score, sIdx) => (
                      <div key={sIdx} className="bg-slate-950/20 border border-slate-850 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-white">{score.name}</span>
                          <span className="text-xs font-black text-indigo-400">{score.score} / {score.max}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(score.score / score.max) * 100}%` }}
                          />
                        </div>
                        {score.comment && (
                          <p className="text-[10px] text-slate-400 italic leading-normal">{score.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl text-center space-y-4 animate-scaleUp">
            <span className="text-4xl">📚</span>
            <h3 className="text-lg font-bold text-white">Select a Draft from the Left Panel</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              You can review history tabs on the left to see previous draft submissions, the feedback scores you obtained, and how you progressed.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
