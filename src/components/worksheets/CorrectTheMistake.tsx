'use client';

interface CorrectTheMistakeProps {
  question: {
    id: string;
    question: string;
    text: string; // e.g. "She do not like milk."
    mistake: string; // e.g. "do"
    correction: string; // e.g. "does"
  };
  value: { selectedWord: string; correctionText: string };
  onChange: (val: { selectedWord: string; correctionText: string }) => void;
}

export default function CorrectTheMistake({ question, value, onChange }: CorrectTheMistakeProps) {
  const text = question.text;
  
  // Split words preserving punctuation where possible, or just split by spaces
  const words = text.split(/\s+/);
  
  const currentSelection = value || { selectedWord: '', correctionText: '' };

  const handleWordClick = (word: string) => {
    // Strip punctuation to check base word matching
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    
    onChange({
      selectedWord: cleanWord,
      correctionText: currentSelection.selectedWord === cleanWord ? currentSelection.correctionText : '',
    });
  };

  const handleCorrectionChange = (txt: string) => {
    onChange({
      ...currentSelection,
      correctionText: txt,
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white leading-snug">{question.question}</h3>

      {/* Word Tokenizer Grid */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 md:p-8 mt-4 flex flex-wrap gap-2.5 items-center leading-loose">
        {words.map((word, idx) => {
          const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
          const isSelected = currentSelection.selectedWord === cleanWord;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleWordClick(word)}
              className={`py-2 px-3.5 rounded-xl text-base md:text-lg font-semibold border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.15)] scale-105'
                  : 'bg-slate-950/40 border-slate-850 text-slate-200 hover:border-slate-700 hover:text-white'
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* Correction Input Panel */}
      {currentSelection.selectedWord && (
        <div className="p-5 bg-slate-950/40 border border-slate-800/60 rounded-2xl animate-fadeIn space-y-3">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Correct this word: <span className="text-red-400 font-extrabold text-sm font-mono bg-red-950/30 px-2 py-0.5 rounded border border-red-500/10 ml-1">{currentSelection.selectedWord}</span>
          </label>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={currentSelection.correctionText}
              onChange={(e) => handleCorrectionChange(e.target.value)}
              placeholder="Type your correction here..."
              className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl py-3 px-4 outline-none transition-all text-sm"
              style={{ minHeight: '44px' }}
            />
          </div>
          <p className="text-[10px] text-slate-500">
            Tapping a different word in the sentence will change which word you are correcting.
          </p>
        </div>
      )}
    </div>
  );
}
