import React from 'react';
import { RotateCcw, ArrowRight, Trophy } from 'lucide-react';
import { TOTAL_LEVELS } from '../game/levels';

interface WinModalProps {
  isOpen: boolean;
  levelId: number;
  moves: number;
  par: number;
  stars: number;
  levelIndex: number;
  onReplay: () => void;
  onNext: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  levelId,
  moves,
  par,
  stars,
  levelIndex,
  onReplay,
  onNext,
}) => {
  if (!isOpen) return null;

  const nextLabel = levelIndex < TOTAL_LEVELS - 1 ? 'Next Level' : 'Try Blitz Rush';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-modal-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-400/35 p-6 text-center shadow-2xl">
        <div className="text-xs font-semibold text-emerald-400 mb-1">Circuit Complete</div>
        <h2 id="win-modal-title" className="font-display text-2xl font-extrabold text-white mb-2">
          Level {levelId} Cleared!
        </h2>
        <div className="text-4xl tracking-widest my-3 text-amber-400" aria-label={`${stars} out of 3 stars`}>
          {'★'.repeat(stars)}
          {'☆'.repeat(3 - stars)}
        </div>
        <p className="text-sm text-slate-300 font-mono tabular-nums mb-6">
          Solved in {moves} move{moves === 1 ? '' : 's'} (Par {par})
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onReplay}
            className="flex-1 min-h-[48px] rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Replay</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex-[1.5] min-h-[48px] rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface BlitzOverModalProps {
  isOpen: boolean;
  score: number;
  bestScore: number;
  circuitsCleared: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const BlitzOverModal: React.FC<BlitzOverModalProps> = ({
  isOpen,
  score,
  bestScore,
  circuitsCleared,
  onPlayAgain,
  onExit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blitz-over-title"
    >
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-400/40 p-6 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-6 h-6" />
        </div>
        <h2 id="blitz-over-title" className="font-display text-2xl font-extrabold text-white mb-1">
          Time&apos;s Up!
        </h2>
        <p className="text-xs text-slate-400 mb-4 font-mono tabular-nums">
          {circuitsCleared} circuit{circuitsCleared === 1 ? '' : 's'} completed
        </p>

        <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4 mb-5 font-mono tabular-nums">
          <div className="text-xs text-slate-400">Final Score</div>
          <div className="text-3xl font-extrabold text-amber-400 my-1">
            {score.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">
            Personal Best · <span className="text-slate-200">{bestScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onExit}
            className="flex-1 min-h-[48px] rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-700 cursor-pointer"
          >
            Menu
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-[1.5] min-h-[48px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
