import React, { useEffect, useRef } from 'react';
import { Play, Grid3X3, Zap } from 'lucide-react';
import { renderTitleBackdrop } from '../game/renderer';
import { TOTAL_LEVELS } from '../game/levels';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  continueLevel: number;
  totalStars: number;
  clearedCount: number;
  blitzBestScore: number;
  onStartGame: () => void;
  onOpenLevels: () => void;
  onStartBlitz: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  continueLevel,
  totalStars,
  clearedCount,
  blitzBestScore,
  onStartGame,
  onOpenLevels,
  onStartBlitz,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    const frame = (ts: number) => {
      renderTitleBackdrop(ctx, window.innerWidth, window.innerHeight, ts * 0.001);
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden optical-bg flex flex-col items-center justify-between px-4 py-6 pt-safe pb-safe select-none">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full"
      />

      {/* Top minimal progress bar */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between text-xs text-slate-300">
        <div className="font-mono tabular-nums">
          <span>
            {clearedCount} / {TOTAL_LEVELS} cleared
          </span>
          <span className="mx-2 text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="text-amber-400 font-semibold">★ {totalStars}</span>
        </div>
        <PWAInstallButton variant="compact" />
      </div>

      {/* Center Lockup & Primary Actions */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center my-auto pt-36 sm:pt-44">
        <svg
          viewBox="0 0 360 64"
          className="w-64 sm:w-72 h-auto mb-2 drop-shadow-[0_0_24px_rgba(255,255,255,0.22)]"
          role="img"
          aria-label="Spark"
        >
          <defs>
            <linearGradient id="sparkTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <text
            x="180"
            y="46"
            textAnchor="middle"
            fill="url(#sparkTitleGrad)"
            fontFamily="Outfit, sans-serif"
            fontWeight="800"
            fontSize="46"
            letterSpacing="10"
          >
            SPARK
          </text>
        </svg>

        <p className="text-sm text-slate-300 max-w-xs mb-7 leading-relaxed">
          Slide rail optics, aim 4-way diodes, unlock energy gates, and fuse beams into white superlasers.
        </p>

        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            type="button"
            onClick={onStartGame}
            className="min-h-[52px] w-full rounded-xl bg-cyan-400 hover:bg-cyan-300 active:scale-[0.98] transition-transform duration-150 text-slate-950 font-display font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(34,211,238,0.35)] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>{continueLevel > 1 ? `Continue Level ${continueLevel}` : 'Play Campaign'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenLevels}
              className="min-h-[46px] rounded-xl bg-slate-900/90 border border-slate-700 hover:border-cyan-400/50 active:scale-[0.98] transition-transform duration-150 text-slate-100 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Grid3X3 className="w-4 h-4 text-cyan-300" />
              <span>Levels</span>
            </button>
            <button
              type="button"
              onClick={onStartBlitz}
              className="min-h-[46px] rounded-xl bg-slate-900/90 border border-amber-400/45 hover:border-amber-300 active:scale-[0.98] transition-transform duration-150 text-slate-100 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Blitz Rush</span>
            </button>
          </div>

          {blitzBestScore > 0 && (
            <p className="text-xs text-amber-300/90 font-mono tabular-nums mt-0.5">
              Blitz Best · {blitzBestScore.toLocaleString()} pts
            </p>
          )}
        </div>
      </div>

      <p className="relative z-10 text-xs text-slate-400 text-center">
        Tap to rotate · Drag rail optics to slide · WASD slide · R Reset · H Hint
      </p>
    </div>
  );
};
