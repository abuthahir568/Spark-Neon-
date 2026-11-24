import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TOTAL_LEVELS } from '../game/levels';
import { GameMode } from '../types/game';

interface LevelsModalProps {
  isOpen: boolean;
  currentLevelIndex: number;
  mode: GameMode;
  starsEarned: Record<number, number>;
  onSelectLevel: (indexZeroBased: number) => void;
  onStartBlitz: () => void;
  onClose: () => void;
}

const PAGE_SIZE = 50;

export const LevelsModal: React.FC<LevelsModalProps> = ({
  isOpen,
  currentLevelIndex,
  mode,
  starsEarned,
  onSelectLevel,
  onStartBlitz,
  onClose,
}) => {
  const [page, setPage] = useState(() => Math.floor(currentLevelIndex / PAGE_SIZE));
  const [jumpValue, setJumpValue] = useState('');

  if (!isOpen) return null;

  const totalPages = Math.ceil(TOTAL_LEVELS / PAGE_SIZE);
  const safePage = Math.max(0, Math.min(totalPages - 1, page));
  const startIdx = safePage * PAGE_SIZE;
  const endIdx = Math.min(TOTAL_LEVELS, startIdx + PAGE_SIZE);

  const totalStars = Object.values(starsEarned).reduce((a, b) => a + b, 0);
  const clearedCount = Object.keys(starsEarned).length;

  const handleJump = () => {
    const val = parseInt(jumpValue, 10);
    if (!Number.isNaN(val) && val >= 1 && val <= TOTAL_LEVELS) {
      onSelectLevel(val - 1);
      setJumpValue('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="levels-modal-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-400/30 p-5 shadow-2xl max-h-[85dvh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 id="levels-modal-title" className="font-display text-lg font-bold text-white">
              Select Level
            </h2>
            <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
              {TOTAL_LEVELS.toLocaleString()} levels · {clearedCount} cleared · ★ {totalStars}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close level selector"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Previous 50 levels"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-300 disabled:opacity-35 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex-1 text-center text-xs font-semibold text-slate-200 font-mono tabular-nums">
            Levels {startIdx + 1} – {endIdx}
          </span>
          <button
            type="button"
            disabled={safePage === totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            aria-label="Next 50 levels"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-300 disabled:opacity-35 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <input
            type="number"
            min={1}
            max={TOTAL_LEVELS}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJump();
            }}
            placeholder="#"
            aria-label="Jump to level number"
            className="w-16 h-[44px] bg-slate-950 border border-slate-700 rounded-xl px-2 text-xs text-white text-center font-mono tabular-nums focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={handleJump}
            className="min-h-[44px] px-3 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30 cursor-pointer"
          >
            Go
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2 overflow-y-auto pr-1 py-1">
          {Array.from({ length: endIdx - startIdx }, (_, offset) => {
            const idx = startIdx + offset;
            const lvlId = idx + 1;
            const stars = starsEarned[lvlId] || 0;
            const isCurrent = mode === 'campaign' && currentLevelIndex === idx;
            return (
              <button
                key={lvlId}
                type="button"
                onClick={() => onSelectLevel(idx)}
                className={`min-h-[48px] rounded-xl py-2 px-1 text-center border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-cyan-500/25 border-cyan-400 text-white'
                    : stars > 0
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-slate-100 hover:border-cyan-400/60'
                      : 'bg-slate-800/60 border-slate-700/70 text-slate-200 hover:border-cyan-500/50'
                }`}
              >
                <div className="font-display font-bold text-xs tabular-nums">{lvlId}</div>
                <div
                  className={`text-[9px] leading-none mt-1 ${
                    stars > 0 ? 'text-amber-400' : 'text-slate-600'
                  }`}
                >
                  {'★'.repeat(stars)}
                  {'☆'.repeat(3 - stars)}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onStartBlitz}
          className="mt-4 min-h-[46px] w-full rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs tracking-wide cursor-pointer"
        >
          Play 90s Blitz Rush Mode
        </button>
      </div>
    </div>
  );
};
