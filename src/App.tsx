import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Diamond,
  Grid3X3,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  WifiOff,
  Zap,
} from 'lucide-react';
import {
  BoardEngineState,
  GameMode,
  GameScreenState,
  LaserColor,
  LevelData,
  RuntimeTile,
} from './types/game';
import {
  COLORS,
  TOTAL_LEVELS,
  generateBlitzPuzzle,
  getCampaignLevel,
} from './game/levels';
import {
  ensureAudio,
  setSoundEnabled,
  sfxGateOpen,
  sfxGemLit,
  sfxHint,
  sfxRotate,
  sfxSlide,
  sfxTimeOver,
  sfxUndo,
  sfxWin,
} from './game/audio';
import { findHintTile, traceLaserNetwork } from './game/raytrace';
import { GameBoard } from './components/GameBoard';
import { TitleScreen } from './components/TitleScreen';
import { LevelsModal } from './components/LevelsModal';
import { HelpModal } from './components/HelpModal';
import { BlitzOverModal, WinModal } from './components/WinModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';

const STARS_STORAGE_KEY = 'spark_stars_v2';
const LAST_LEVEL_KEY = 'spark_last_level_v2';
const BLITZ_BEST_KEY = 'spark_blitz_best_v2';

type UndoEntry =
  | { kind: 'rotate'; r: number; c: number }
  | { kind: 'slide'; fromR: number; fromC: number; toR: number; toC: number };

function loadSavedStars(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STARS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) || {};
  } catch {
    // Ignore storage errors
  }
  return {};
}

function loadNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const n = parseInt(raw, 10);
      if (!Number.isNaN(n) && n >= 0) return n;
    }
  } catch {
    // Ignore storage errors
  }
  return fallback;
}

export default function App() {
  const isOnline = useOnlineStatus();

  const [screen, setScreen] = useState<GameScreenState>('TITLE_MENU');
  const [mode, setMode] = useState<GameMode>('campaign');
  const [levelIndex, setLevelIndex] = useState<number>(() =>
    Math.min(TOTAL_LEVELS - 1, loadNumber(LAST_LEVEL_KEY, 0))
  );
  const [currentLevel, setCurrentLevel] = useState<LevelData>(() =>
    getCampaignLevel(Math.min(TOTAL_LEVELS - 1, loadNumber(LAST_LEVEL_KEY, 0)))
  );

  // Campaign stats
  const [moves, setMoves] = useState(0);
  const [par, setPar] = useState(2);
  const [litCount, setLitCount] = useState(0);
  const [totalTargets, setTotalTargets] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [won, setWon] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [starsEarned, setStarsEarned] = useState<Record<number, number>>(loadSavedStars);

  // Blitz Rush stats
  const [blitzTime, setBlitzTime] = useState(90);
  const [blitzScore, setBlitzScore] = useState(0);
  const [blitzCombo, setBlitzCombo] = useState(1);
  const [blitzCleared, setBlitzCleared] = useState(0);
  const [blitzBest, setBlitzBest] = useState<number>(() => loadNumber(BLITZ_BEST_KEY, 0));

  // Modals & toast
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showBlitzOver, setShowBlitzOver] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const engineRef = useRef<BoardEngineState>({
    size: 5,
    grid: [],
    beams: [],
    litTargets: new Set<string>(),
    openGateColors: new Set<LaserColor>(),
    activeKeys: new Set<string>(),
    combinerColors: {},
    hintTile: null,
    cursor: null,
    dragSource: null,
    particles: [],
  });

  const interactiveRef = useRef<RuntimeTile[]>([]);
  const undoStackRef = useRef<UndoEntry[]>([]);
  const totalTargetsRef = useRef<number>(1);
  const wonRef = useRef<boolean>(false);
  const movesRef = useRef<number>(0);
  const parRef = useRef<number>(2);
  const blitzStateRef = useRef({ score: 0, combo: 1, cleared: 0, active: false });
  const toastTimerRef = useRef<number | null>(null);
  const winTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  }, []);

  const spawnParticles = useCallback((r: number, c: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 2.2;
      engineRef.current.particles.push({
        r: r + 0.5,
        c: c + 0.5,
        vr: Math.sin(angle) * speed * 0.04,
        vc: Math.cos(angle) * speed * 0.04,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.025,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }, []);

  const loadLevel = useCallback(
    (levelObj: LevelData, nextMode: GameMode, nextIndex?: number, silentToast = false) => {
      if (winTimerRef.current) window.clearTimeout(winTimerRef.current);

      const grid: (RuntimeTile | null)[][] = Array.from({ length: levelObj.size }, () =>
        Array(levelObj.size).fill(null)
      );
      const interactives: RuntimeTile[] = [];
      let targets = 0;
      let parCalc = 0;

      for (const t of levelObj.tiles) {
        const initRot = t.initRot ?? 0;
        const initDir = t.initDir ?? t.dir ?? 1;
        const initialAngle =
          t.type === 'D' ? (initDir - 1) * (Math.PI / 2) : initRot * (Math.PI / 2);

        const tile: RuntimeTile = {
          ...t,
          rot: initRot,
          dir: initDir,
          visualAngle: initialAngle,
          targetAngle: initialAngle,
          visualR: t.r,
          visualC: t.c,
        };

        if (tile.type === 'M' || tile.type === 'S' || tile.type === 'D') {
          interactives.push(tile);
          if (tile.movable && tile.solR !== undefined && tile.solC !== undefined) {
            if (tile.r !== tile.solR || tile.c !== tile.solC) parCalc++;
          }
          if ((tile.type === 'M' || tile.type === 'S') && tile.solRot !== undefined) {
            if (initRot % 2 !== tile.solRot % 2) parCalc++;
          }
          if (tile.type === 'D' && tile.solDir !== undefined) {
            parCalc += (tile.solDir - initDir + 4) % 4;
          }
        }
        if (tile.type === 'T') targets++;
        grid[tile.r][tile.c] = tile;
      }

      const computedPar = Math.max(1, parCalc);

      engineRef.current = {
        size: levelObj.size,
        grid,
        beams: [],
        litTargets: new Set<string>(),
        openGateColors: new Set<LaserColor>(),
        activeKeys: new Set<string>(),
        combinerColors: {},
        hintTile: null,
        cursor: null,
        dragSource: null,
        particles: [],
      };
      interactiveRef.current = interactives;
      undoStackRef.current = [];
      totalTargetsRef.current = targets;
      wonRef.current = false;
      movesRef.current = 0;
      parRef.current = computedPar;

      setMode(nextMode);
      if (nextIndex !== undefined) {
        setLevelIndex(nextIndex);
        try {
          localStorage.setItem(LAST_LEVEL_KEY, String(nextIndex));
        } catch {
          // Ignore storage error
        }
      }
      setCurrentLevel(levelObj);
      setMoves(0);
      setPar(computedPar);
      setTotalTargets(targets);
      setCanUndo(false);
      setWon(false);
      setShowWinModal(false);
      setShowBlitzOver(false);
      setShowLevelsModal(false);
      setShowHelpModal(false);
      setScreen('PLAYING');

      const res = traceLaserNetwork(levelObj.size, grid);
      engineRef.current.beams = res.beams;
      engineRef.current.litTargets = res.litTargets;
      engineRef.current.openGateColors = res.openGateColors;
      engineRef.current.activeKeys = res.activeKeys;
      engineRef.current.combinerColors = res.combinerColors;
      setLitCount(res.litTargets.size);

      if (!silentToast) {
        showToast(
          nextMode === 'blitz' ? levelObj.name : `Level ${levelObj.id} · ${levelObj.name}`
        );
      }
    },
    [showToast]
  );

  const recomputeBeams = useCallback(
    (triggerEffects: boolean, activeMode: GameMode, activeLvl: LevelData) => {
      const engine = engineRef.current;
      const prevLit = new Set(engine.litTargets);
      const prevGates = new Set(engine.openGateColors);

      const res = traceLaserNetwork(engine.size, engine.grid);
      engine.beams = res.beams;
      engine.litTargets = res.litTargets;
      engine.openGateColors = res.openGateColors;
      engine.activeKeys = res.activeKeys;
      engine.combinerColors = res.combinerColors;
      setLitCount(res.litTargets.size);

      if (triggerEffects) {
        let gateOpened = false;
        res.openGateColors.forEach((col) => {
          if (!prevGates.has(col)) gateOpened = true;
        });
        if (gateOpened) sfxGateOpen();

        let newlyLit = false;
        res.litTargets.forEach((key) => {
          if (!prevLit.has(key)) {
            newlyLit = true;
            const [tr, tc] = key.split(',').map(Number);
            const tile = engine.grid[tr]?.[tc];
            const color = tile?.color ? COLORS[tile.color].main : COLORS.cyan.main;
            spawnParticles(tr, tc, color, 16);
          }
        });
        if (newlyLit) sfxGemLit();
      }

      if (
        !wonRef.current &&
        totalTargetsRef.current > 0 &&
        res.litTargets.size === totalTargetsRef.current
      ) {
        wonRef.current = true;
        setWon(true);
        setCanUndo(false);
        sfxWin();

        res.litTargets.forEach((key) => {
          const [tr, tc] = key.split(',').map(Number);
          const tile = engine.grid[tr]?.[tc];
          const color = tile?.color ? COLORS[tile.color].main : COLORS.cyan.main;
          spawnParticles(tr, tc, color, 26);
        });

        if (activeMode === 'blitz') {
          const nextCleared = blitzStateRef.current.cleared + 1;
          const earned = 100 * blitzStateRef.current.combo;
          const nextScore = blitzStateRef.current.score + earned;
          const nextCombo = Math.min(8, blitzStateRef.current.combo + 1);
          blitzStateRef.current = {
            score: nextScore,
            combo: nextCombo,
            cleared: nextCleared,
            active: true,
          };
          setBlitzScore(nextScore);
          setBlitzCombo(nextCombo);
          setBlitzCleared(nextCleared);
          setBlitzTime((t) => Math.min(120, t + 7));
          showToast(`+${earned} pts · +7s!`);

          if (winTimerRef.current) window.clearTimeout(winTimerRef.current);
          winTimerRef.current = window.setTimeout(() => {
            if (!blitzStateRef.current.active) return;
            loadLevel(generateBlitzPuzzle(nextCleared + 1), 'blitz', undefined, true);
          }, 420);
          return;
        }

        const earnedStars =
          movesRef.current <= parRef.current
            ? 3
            : movesRef.current <= parRef.current + 3
              ? 2
              : 1;

        setStarsEarned((prev) => {
          const next = {
            ...prev,
            [activeLvl.id]: Math.max(prev[activeLvl.id] || 0, earnedStars),
          };
          try {
            localStorage.setItem(STARS_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // Ignore storage error
          }
          return next;
        });

        if (winTimerRef.current) window.clearTimeout(winTimerRef.current);
        winTimerRef.current = window.setTimeout(() => {
          if (!wonRef.current) return;
          setShowWinModal(true);
        }, 460);
      }
    },
    [loadLevel, showToast, spawnParticles]
  );

  const rotateCell = useCallback(
    (r: number, c: number, recordUndo = true, reverse = false) => {
      if (wonRef.current) return;
      const tile = engineRef.current.grid[r]?.[c];
      if (!tile || (tile.type !== 'M' && tile.type !== 'S' && tile.type !== 'D')) return;

      ensureAudio();
      if (tile.type === 'D') {
        tile.dir = (tile.dir + (reverse ? 3 : 1)) % 4;
        tile.targetAngle += reverse ? -Math.PI / 2 : Math.PI / 2;
      } else {
        tile.rot = (tile.rot + 1) % 2;
        tile.targetAngle += reverse ? -Math.PI / 2 : Math.PI / 2;
      }

      if (recordUndo) {
        undoStackRef.current.push({ kind: 'rotate', r, c });
        movesRef.current += 1;
        setMoves(movesRef.current);
        setCanUndo(true);
        sfxRotate();
      } else {
        sfxUndo();
      }

      const hint = engineRef.current.hintTile;
      if (hint && hint.r === r && hint.c === c && hint.targetR === undefined) {
        engineRef.current.hintTile = null;
      }

      spawnParticles(r, c, '#38bdf8', 7);
      recomputeBeams(true, mode, currentLevel);
    },
    [currentLevel, mode, recomputeBeams, spawnParticles]
  );

  const slideTile = useCallback(
    (fromR: number, fromC: number, toR: number, toC: number, recordUndo = true) => {
      if (wonRef.current) return;
      const engine = engineRef.current;
      const size = engine.size;
      if (toR < 0 || toR >= size || toC < 0 || toC >= size) return;
      if (fromR === toR && fromC === toC) return;

      const tile = engine.grid[fromR]?.[fromC];
      if (!tile || !tile.movable) return;
      if (engine.grid[toR]?.[toC] !== null) return;

      ensureAudio();
      engine.grid[fromR][fromC] = null;
      engine.grid[toR][toC] = tile;
      tile.r = toR;
      tile.c = toC;

      if (recordUndo) {
        undoStackRef.current.push({ kind: 'slide', fromR, fromC, toR, toC });
        movesRef.current += 1;
        setMoves(movesRef.current);
        setCanUndo(true);
        sfxSlide();
      } else {
        sfxUndo();
      }

      const hint = engine.hintTile;
      if (hint && hint.targetR === toR && hint.targetC === toC) {
        engine.hintTile = null;
      }

      spawnParticles(toR, toC, '#34d399', 9);
      recomputeBeams(true, mode, currentLevel);
    },
    [currentLevel, mode, recomputeBeams, spawnParticles]
  );

  const handleUndo = useCallback(() => {
    if (wonRef.current || undoStackRef.current.length === 0) return;
    const entry = undoStackRef.current.pop()!;
    movesRef.current = Math.max(0, movesRef.current - 1);
    setMoves(movesRef.current);
    setCanUndo(undoStackRef.current.length > 0);
    if (entry.kind === 'rotate') {
      rotateCell(entry.r, entry.c, false, true);
    } else {
      slideTile(entry.toR, entry.toC, entry.fromR, entry.fromC, false);
    }
  }, [rotateCell, slideTile]);

  const handleReset = useCallback(() => {
    ensureAudio();
    if (mode === 'blitz') {
      blitzStateRef.current.combo = 1;
      setBlitzCombo(1);
    }
    loadLevel(currentLevel, mode, mode === 'campaign' ? levelIndex : undefined);
  }, [currentLevel, levelIndex, loadLevel, mode]);

  const handleHint = useCallback(() => {
    if (wonRef.current) return;
    ensureAudio();
    if (mode === 'blitz') {
      blitzStateRef.current.combo = 1;
      setBlitzCombo(1);
    }
    const hint = findHintTile(
      interactiveRef.current,
      engineRef.current.grid,
      engineRef.current.size
    );
    if (hint) {
      engineRef.current.hintTile = hint;
      sfxHint();
      showToast(
        hint.targetR !== undefined
          ? 'Drag highlighted optic to the green target'
          : 'Rotate the highlighted optic'
      );
    } else {
      showToast('All optics aligned');
    }
  }, [mode, showToast]);

  const startBlitzRush = useCallback(() => {
    ensureAudio();
    blitzStateRef.current = { score: 0, combo: 1, cleared: 0, active: true };
    setBlitzScore(0);
    setBlitzCombo(1);
    setBlitzCleared(0);
    setBlitzTime(90);
    loadLevel(generateBlitzPuzzle(1), 'blitz');
  }, [loadLevel]);

  const handleWinNext = useCallback(() => {
    if (levelIndex < TOTAL_LEVELS - 1) {
      const nextIdx = levelIndex + 1;
      loadLevel(getCampaignLevel(nextIdx), 'campaign', nextIdx);
    } else {
      startBlitzRush();
    }
  }, [levelIndex, loadLevel, startBlitzRush]);

  const handleToggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) ensureAudio();
  }, [soundOn]);

  // Blitz Rush 1-second timer
  useEffect(() => {
    if (screen !== 'PLAYING' || mode !== 'blitz' || showBlitzOver) return;
    const id = window.setInterval(() => {
      setBlitzTime((prev) => {
        if (prev <= 1) {
          blitzStateRef.current.active = false;
          wonRef.current = true;
          sfxTimeOver();
          setBlitzBest((best) => {
            const nextBest = Math.max(best, blitzStateRef.current.score);
            try {
              localStorage.setItem(BLITZ_BEST_KEY, String(nextBest));
            } catch {
              // Ignore storage errors
            }
            return nextBest;
          });
          setShowBlitzOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, screen, showBlitzOver]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screen === 'TITLE_MENU') {
        if ((e.key === 'Enter' || e.key === ' ') && !showLevelsModal) {
          e.preventDefault();
          ensureAudio();
          blitzStateRef.current.active = false;
          loadLevel(getCampaignLevel(levelIndex), 'campaign', levelIndex);
        } else if (e.key === 'Escape' && showLevelsModal) {
          setShowLevelsModal(false);
        }
        return;
      }

      if (showLevelsModal || showHelpModal || showWinModal || showBlitzOver) {
        if (e.key === 'Escape') {
          setShowLevelsModal(false);
          setShowHelpModal(false);
        }
        return;
      }

      const size = engineRef.current.size;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!engineRef.current.cursor) {
          engineRef.current.cursor = { r: 0, c: 0 };
        } else {
          const cur = engineRef.current.cursor;
          if (e.key === 'ArrowUp') cur.r = (cur.r + size - 1) % size;
          if (e.key === 'ArrowDown') cur.r = (cur.r + 1) % size;
          if (e.key === 'ArrowLeft') cur.c = (cur.c + size - 1) % size;
          if (e.key === 'ArrowRight') cur.c = (cur.c + 1) % size;
        }
      } else if (['w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
        const cur = engineRef.current.cursor;
        if (cur) {
          const dr = e.key === 'w' || e.key === 'W' ? -1 : e.key === 's' || e.key === 'S' ? 1 : 0;
          const dc = e.key === 'a' || e.key === 'A' ? -1 : e.key === 'd' || e.key === 'D' ? 1 : 0;
          const nr = cur.r + dr;
          const nc = cur.c + dc;
          const tile = engineRef.current.grid[cur.r]?.[cur.c];
          if (tile?.movable && nr >= 0 && nr < size && nc >= 0 && nc < size && !engineRef.current.grid[nr][nc]) {
            e.preventDefault();
            slideTile(cur.r, cur.c, nr, nc, true);
            engineRef.current.cursor = { r: nr, c: nc };
          }
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (engineRef.current.cursor) {
          e.preventDefault();
          rotateCell(engineRef.current.cursor.r, engineRef.current.cursor.c, true);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        handleReset();
      } else if (e.key === 'h' || e.key === 'H') {
        handleHint();
      } else if (e.key === 'u' || e.key === 'U' || e.key === 'z' || e.key === 'Z') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleHint,
    handleReset,
    handleUndo,
    levelIndex,
    loadLevel,
    rotateCell,
    screen,
    showBlitzOver,
    showHelpModal,
    showLevelsModal,
    showWinModal,
    slideTile,
  ]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (winTimerRef.current) window.clearTimeout(winTimerRef.current);
    };
  }, []);

  const totalStars = Object.values(starsEarned).reduce((a, b) => a + b, 0);
  const clearedCount = Object.keys(starsEarned).length;
  const liveStars = moves <= par ? 3 : moves <= par + 3 ? 2 : 1;

  return (
    <div className="min-h-dvh w-full optical-bg text-slate-100 flex flex-col">
      {!isOnline && (
        <div className="bg-amber-500/15 border-b border-amber-400/30 px-4 py-1.5 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>Offline Mode · Playing from local cache</span>
        </div>
      )}

      {screen === 'TITLE_MENU' ? (
        <>
          <TitleScreen
            continueLevel={levelIndex + 1}
            totalStars={totalStars}
            clearedCount={clearedCount}
            blitzBestScore={blitzBest}
            onStartGame={() => {
              ensureAudio();
              blitzStateRef.current.active = false;
              loadLevel(getCampaignLevel(levelIndex), 'campaign', levelIndex);
            }}
            onOpenLevels={() => setShowLevelsModal(true)}
            onStartBlitz={startBlitzRush}
          />
          <LevelsModal
            isOpen={showLevelsModal}
            currentLevelIndex={levelIndex}
            mode={mode}
            starsEarned={starsEarned}
            onSelectLevel={(idx) => {
              blitzStateRef.current.active = false;
              loadLevel(getCampaignLevel(idx), 'campaign', idx);
            }}
            onStartBlitz={startBlitzRush}
            onClose={() => setShowLevelsModal(false)}
          />
        </>
      ) : (
        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-between px-3 py-2.5 sm:px-6 sm:py-5 pt-safe pb-safe select-none">
          {/* Top Perimeter Bar */}
          <header className="w-full max-w-[480px] lg:max-w-none mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    blitzStateRef.current.active = false;
                    setScreen('TITLE_MENU');
                  }}
                  aria-label="Back to title screen"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900/80 border border-slate-700/70 flex items-center justify-center text-slate-300 hover:text-white hover:border-cyan-400/40 shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h1 className="font-display text-sm sm:text-base font-extrabold tracking-wider text-white truncate">
                    SPARK
                  </h1>
                  <p className="text-xs text-slate-400 truncate font-mono tabular-nums">
                    {mode === 'blitz'
                      ? `Blitz Rush · Combo x${blitzCombo}`
                      : `Level ${currentLevel.id} / ${TOTAL_LEVELS} · ${currentLevel.name}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <PWAInstallButton variant="compact" />
                <button
                  type="button"
                  onClick={() => setShowLevelsModal(true)}
                  aria-label="Select level"
                  className="min-h-[44px] px-3 rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-cyan-400/50 text-xs font-semibold text-cyan-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Grid3X3 className="w-4 h-4 text-cyan-300" />
                  <span className="hidden sm:inline">Levels</span>
                  <span className="text-amber-400 font-mono tabular-nums">★ {totalStars}</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-cyan-400/50 flex items-center justify-center text-slate-200 cursor-pointer"
                >
                  {soundOn ? (
                    <Volume2 className="w-4 h-4 text-cyan-300" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  aria-label="How to play"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-cyan-400/50 flex items-center justify-center text-slate-200 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Perimeter Status Strip */}
            <div className="lg:hidden rounded-2xl bg-slate-900/80 border border-slate-700/60 px-3.5 py-2 flex items-center justify-between text-xs">
              {mode === 'blitz' ? (
                <>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <div className={`flex items-center gap-1 font-bold text-sm ${blitzTime <= 15 ? 'text-rose-400' : 'text-amber-300'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{blitzTime}s</span>
                    </div>
                    <div className="h-4 w-px bg-slate-700/70" />
                    <div>
                      <span className="text-slate-400 mr-1.5">Score</span>
                      <span className="font-bold text-white text-sm">{blitzScore}</span>
                    </div>
                  </div>
                  <div className="font-mono tabular-nums text-xs font-bold text-cyan-300">
                    x{blitzCombo} Combo
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="font-mono tabular-nums">
                      <span className="text-slate-400 mr-1.5">Moves</span>
                      <span className="font-bold text-white text-sm">{moves}</span>
                      <span className="text-slate-500 ml-1">/ {par}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-700/70" />
                    <div className="flex items-center gap-1 font-mono tabular-nums">
                      <Diamond className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-emerald-400 text-sm">
                        {litCount} / {totalTargets}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-base" aria-label={`Projected ${liveStars} stars`}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className={i < liveStars ? 'text-amber-400' : 'text-slate-600'}>
                        {i < liveStars ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Main Play Area */}
          <main className="flex-1 w-full flex flex-col lg:flex-row items-center justify-center gap-6 my-2">
            <div className="w-full lg:flex-1 flex flex-col items-center justify-center">
              <GameBoard
                engineRef={engineRef}
                onTapCell={(r, c) => rotateCell(r, c, true)}
                onSlideTile={(fromR, fromC, toR, toC) => slideTile(fromR, fromC, toR, toC, true)}
                toastMessage={toastMessage}
              />
              <p className="mt-2 text-xs text-slate-400 text-center max-w-[440px] px-2">
                {currentLevel.tip}
              </p>
            </div>

            {/* Desktop Telemetry & Control Column */}
            <aside className="hidden lg:flex w-72 flex-col gap-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 p-5">
              {mode === 'blitz' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400">Time Left</span>
                    <span className={`font-mono tabular-nums text-lg font-bold flex items-center gap-1.5 ${blitzTime <= 15 ? 'text-rose-400' : 'text-amber-300'}`}>
                      <Clock className="w-4 h-4" />
                      {blitzTime}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400">Score</span>
                    <span className="font-mono tabular-nums text-lg font-bold text-white">
                      {blitzScore.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs text-slate-400">Combo · Cleared</span>
                    <span className="font-mono tabular-nums text-sm font-bold text-cyan-300">
                      x{blitzCombo} · {blitzCleared}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400">Moves</span>
                    <span className="font-mono tabular-nums text-lg font-bold text-white">
                      {moves} <span className="text-xs font-normal text-slate-400">/ {par} par</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs text-slate-400">Gems Lit</span>
                    <span className="font-mono tabular-nums text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                      <Diamond className="w-4 h-4" />
                      {litCount} / {totalTargets}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs text-slate-400">Star Rating</span>
                    <span className="text-lg tracking-wider" aria-label={`Projected ${liveStars} stars`}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={i < liveStars ? 'text-amber-400' : 'text-slate-600'}>
                          {i < liveStars ? '★' : '☆'}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={!canUndo || won}
                  onClick={handleUndo}
                  className="min-h-[46px] rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-400/50 text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <Undo2 className="w-4 h-4 text-sky-300" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[46px] rounded-xl bg-slate-800 border border-slate-700 hover:border-rose-400/50 text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-rose-300" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleHint}
                  className="min-h-[46px] rounded-xl bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-slate-100 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4 text-amber-300" />
                  <span>Hint</span>
                </button>
                <button
                  type="button"
                  onClick={startBlitzRush}
                  className="min-h-[46px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Blitz</span>
                </button>
              </div>
            </aside>
          </main>

          {/* Mobile Thumb-Zone Controls */}
          <footer className="lg:hidden w-full max-w-[480px] mx-auto">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                disabled={!canUndo || won}
                onClick={handleUndo}
                className="min-h-[48px] rounded-xl bg-slate-900/90 border border-slate-700/70 active:scale-95 transition-transform duration-150 flex flex-col items-center justify-center gap-0.5 text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                <Undo2 className="w-4 h-4 text-sky-300" />
                <span className="text-[11px] font-semibold">Undo</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[48px] rounded-xl bg-slate-900/90 border border-slate-700/70 active:scale-95 transition-transform duration-150 flex flex-col items-center justify-center gap-0.5 text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-300" />
                <span className="text-[11px] font-semibold">Reset</span>
              </button>
              <button
                type="button"
                onClick={handleHint}
                className="min-h-[48px] rounded-xl bg-slate-900/90 border border-slate-700/70 active:scale-95 transition-transform duration-150 flex flex-col items-center justify-center gap-0.5 text-slate-200 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-amber-300" />
                <span className="text-[11px] font-semibold">Hint</span>
              </button>
              <button
                type="button"
                onClick={startBlitzRush}
                className="min-h-[48px] rounded-xl bg-amber-400 border border-amber-300 active:scale-95 transition-transform duration-150 flex flex-col items-center justify-center gap-0.5 text-slate-950 font-bold cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span className="text-[11px] font-bold">Blitz</span>
              </button>
            </div>
          </footer>

          <LevelsModal
            isOpen={showLevelsModal}
            currentLevelIndex={levelIndex}
            mode={mode}
            starsEarned={starsEarned}
            onSelectLevel={(idx) => {
              blitzStateRef.current.active = false;
              loadLevel(getCampaignLevel(idx), 'campaign', idx);
            }}
            onStartBlitz={startBlitzRush}
            onClose={() => setShowLevelsModal(false)}
          />

          <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />

          <WinModal
            isOpen={showWinModal}
            levelId={currentLevel.id}
            moves={moves}
            par={par}
            stars={liveStars}
            levelIndex={levelIndex}
            onReplay={handleReset}
            onNext={handleWinNext}
          />

          <BlitzOverModal
            isOpen={showBlitzOver}
            score={blitzScore}
            bestScore={blitzBest}
            circuitsCleared={blitzCleared}
            onPlayAgain={startBlitzRush}
            onExit={() => {
              blitzStateRef.current.active = false;
              setShowBlitzOver(false);
              setScreen('TITLE_MENU');
            }}
          />
        </div>
      )}
    </div>
  );
}
