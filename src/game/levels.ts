import { LaserColor, LevelData, TileConfig } from '../types/game';
import { DC, DR, traceLaserNetwork } from './raytrace';

export const COLORS: Record<LaserColor, { main: string; glow: string; soft: string }> = {
  cyan: { main: '#00f0ff', glow: 'rgba(0, 240, 255, 0.55)', soft: '#67e8f9' },
  magenta: { main: '#ff2a85', glow: 'rgba(255, 42, 133, 0.55)', soft: '#f9a8d4' },
  gold: { main: '#ffbe0b', glow: 'rgba(255, 190, 11, 0.55)', soft: '#fde047' },
  white: { main: '#f8fafc', glow: 'rgba(226, 232, 240, 0.72)', soft: '#bae6fd' },
};

export const TOTAL_LEVELS = 500;

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: 'Slide & Reflect',
    size: 5,
    tip: 'Drag optics with corner rails to slide them, and tap any mirror to rotate 90°.',
    tiles: [
      { r: 2, c: 0, type: 'E', dir: 1, color: 'cyan' },
      { r: 1, c: 2, type: 'M', movable: true, initRot: 1, solRot: 1, solR: 2, solC: 2 },
      { r: 4, c: 2, type: 'M', initRot: 1, solRot: 0 },
      { r: 4, c: 0, type: 'T', color: 'cyan' },
      { r: 2, c: 4, type: 'W' },
    ],
  },
  {
    id: 2,
    name: 'Dual Track',
    size: 5,
    tip: 'Slide both rail mirrors into the laser line and align them to light both gold gems.',
    tiles: [
      { r: 0, c: 0, type: 'E', dir: 1, color: 'gold' },
      { r: 1, c: 3, type: 'M', movable: true, initRot: 0, solRot: 1, solR: 0, solC: 3 },
      { r: 2, c: 3, type: 'T', color: 'gold' },
      { r: 3, c: 2, type: 'M', movable: true, initRot: 1, solRot: 0, solR: 4, solC: 3 },
      { r: 4, c: 1, type: 'T', color: 'gold' },
      { r: 1, c: 1, type: 'W' },
      { r: 3, c: 4, type: 'W' },
    ],
  },
  {
    id: 3,
    name: '4-Way Diode',
    size: 5,
    tip: 'Optical diodes capture any incoming beam and fire it strictly along their arrow.',
    tiles: [
      { r: 2, c: 0, type: 'E', dir: 1, color: 'cyan' },
      { r: 2, c: 2, type: 'D', initDir: 0, solDir: 2 },
      { r: 3, c: 2, type: 'T', color: 'cyan' },
      { r: 4, c: 2, type: 'D', initDir: 2, solDir: 1 },
      { r: 4, c: 4, type: 'D', initDir: 3, solDir: 0 },
      { r: 1, c: 4, type: 'T', color: 'cyan' },
      { r: 2, c: 3, type: 'W' },
      { r: 1, c: 1, type: 'W' },
    ],
  },
  {
    id: 4,
    name: 'Key & Gate',
    size: 5,
    tip: 'Energize the diamond Key node to unlock the matching Forcefield Gate.',
    tiles: [
      { r: 1, c: 0, type: 'E', dir: 1, color: 'cyan' },
      { r: 1, c: 2, type: 'S', initRot: 0, solRot: 1 },
      { r: 1, c: 3, type: 'G', color: 'cyan' },
      { r: 1, c: 4, type: 'T', color: 'cyan' },
      { r: 3, c: 2, type: 'K', color: 'cyan' },
      { r: 4, c: 1, type: 'M', movable: true, initRot: 0, solRot: 1, solR: 4, solC: 2 },
      { r: 4, c: 4, type: 'T', color: 'cyan' },
      { r: 2, c: 4, type: 'W' },
    ],
  },
  {
    id: 5,
    name: 'Rail Guard',
    size: 5,
    tip: 'Slide the movable diode into the beam, aim it at the Key, and open the gate.',
    tiles: [
      { r: 0, c: 1, type: 'E', dir: 2, color: 'magenta' },
      { r: 2, c: 0, type: 'D', movable: true, initDir: 2, solDir: 1, solR: 2, solC: 1 },
      { r: 2, c: 3, type: 'K', color: 'magenta' },
      { r: 2, c: 4, type: 'M', initRot: 0, solRot: 1 },
      { r: 3, c: 4, type: 'G', color: 'magenta' },
      { r: 4, c: 4, type: 'T', color: 'magenta' },
      { r: 3, c: 1, type: 'W' },
      { r: 1, c: 3, type: 'W' },
    ],
  },
  {
    id: 6,
    name: 'Prism Fusion',
    size: 5,
    tip: 'Feed 2 different colors into the octagonal Combiner to fire a White Superbeam!',
    tiles: [
      { r: 0, c: 1, type: 'E', dir: 1, color: 'cyan' },
      { r: 0, c: 2, type: 'M', initRot: 0, solRot: 1 },
      { r: 4, c: 0, type: 'E', dir: 0, color: 'magenta' },
      { r: 2, c: 0, type: 'M', initRot: 1, solRot: 0 },
      { r: 2, c: 2, type: 'X', dir: 1 },
      { r: 2, c: 4, type: 'T', color: 'white' },
      { r: 1, c: 3, type: 'W' },
      { r: 3, c: 3, type: 'W' },
    ],
  },
  {
    id: 7,
    name: 'Reactor Lock',
    size: 6,
    tip: 'Unlock the cyan gate first so the gold beam can fuse with cyan inside the Combiner.',
    tiles: [
      { r: 0, c: 0, type: 'E', dir: 1, color: 'cyan' },
      { r: 0, c: 3, type: 'M', initRot: 0, solRot: 1 },
      { r: 2, c: 3, type: 'K', color: 'cyan' },
      { r: 4, c: 0, type: 'E', dir: 1, color: 'gold' },
      { r: 4, c: 2, type: 'G', color: 'cyan' },
      { r: 4, c: 3, type: 'X', dir: 1 },
      { r: 3, c: 5, type: 'M', movable: true, initRot: 1, solRot: 0, solR: 4, solC: 5 },
      { r: 1, c: 5, type: 'T', color: 'white' },
      { r: 1, c: 1, type: 'W' },
      { r: 3, c: 2, type: 'W' },
      { r: 5, c: 4, type: 'W' },
    ],
  },
  {
    id: 8,
    name: 'Crossfire Split',
    size: 6,
    tip: 'Use the splitter to trigger the gold key and keep the main beam flowing.',
    tiles: [
      { r: 3, c: 0, type: 'E', dir: 1, color: 'gold' },
      { r: 3, c: 2, type: 'S', initRot: 1, solRot: 0 },
      { r: 1, c: 2, type: 'K', color: 'gold' },
      { r: 0, c: 2, type: 'D', initDir: 3, solDir: 1 },
      { r: 0, c: 5, type: 'T', color: 'gold' },
      { r: 3, c: 4, type: 'G', color: 'gold' },
      { r: 3, c: 5, type: 'M', initRot: 0, solRot: 1 },
      { r: 5, c: 5, type: 'T', color: 'gold' },
      { r: 2, c: 4, type: 'W' },
      { r: 4, c: 3, type: 'W' },
    ],
  },
  {
    id: 9,
    name: 'Portal Shift',
    size: 6,
    tip: 'Slide the mirror to bounce through the warp portal and shift color through the lens.',
    tiles: [
      { r: 5, c: 0, type: 'E', dir: 0, color: 'cyan' },
      { r: 1, c: 1, type: 'M', movable: true, initRot: 1, solRot: 0, solR: 1, solC: 0 },
      { r: 1, c: 2, type: 'P', pair: 'A' },
      { r: 4, c: 3, type: 'P', pair: 'A' },
      { r: 4, c: 4, type: 'F', color: 'magenta' },
      { r: 4, c: 5, type: 'D', initDir: 2, solDir: 0 },
      { r: 1, c: 5, type: 'T', color: 'magenta' },
      { r: 2, c: 2, type: 'W' },
      { r: 3, c: 2, type: 'W' },
      { r: 3, c: 3, type: 'W' },
    ],
  },
  {
    id: 10,
    name: 'Twin Cores',
    size: 6,
    tip: 'Split the Prismatic White Superbeam to power two white crystal cores at once.',
    tiles: [
      { r: 0, c: 2, type: 'E', dir: 2, color: 'cyan' },
      { r: 2, c: 0, type: 'E', dir: 1, color: 'magenta' },
      { r: 2, c: 2, type: 'X', dir: 1 },
      { r: 2, c: 4, type: 'S', initRot: 1, solRot: 0 },
      { r: 0, c: 4, type: 'M', initRot: 1, solRot: 0 },
      { r: 0, c: 5, type: 'T', color: 'white' },
      { r: 2, c: 5, type: 'T', color: 'white' },
      { r: 4, c: 4, type: 'W' },
      { r: 1, c: 3, type: 'W' },
    ],
  },
  {
    id: 11,
    name: 'Chroma Vault',
    size: 6,
    tip: 'Two keys, two gates: route each colored laser to unlock the opposite lane.',
    tiles: [
      { r: 0, c: 0, type: 'E', dir: 1, color: 'cyan' },
      { r: 0, c: 2, type: 'K', color: 'cyan' },
      { r: 0, c: 4, type: 'M', initRot: 0, solRot: 1 },
      { r: 2, c: 4, type: 'G', color: 'magenta' },
      { r: 5, c: 4, type: 'T', color: 'cyan' },
      { r: 5, c: 0, type: 'E', dir: 1, color: 'magenta' },
      { r: 5, c: 1, type: 'K', color: 'magenta' },
      { r: 5, c: 2, type: 'M', initRot: 1, solRot: 0 },
      { r: 3, c: 2, type: 'G', color: 'cyan' },
      { r: 2, c: 2, type: 'D', initDir: 0, solDir: 3 },
      { r: 2, c: 0, type: 'T', color: 'magenta' },
      { r: 3, c: 3, type: 'W' },
    ],
  },
  {
    id: 12,
    name: 'Prism Cascade',
    size: 6,
    tip: 'Warp a beam through the portal to fuse with gold and ignite the core.',
    tiles: [
      { r: 0, c: 0, type: 'E', dir: 2, color: 'cyan' },
      { r: 3, c: 0, type: 'D', initDir: 0, solDir: 1 },
      { r: 3, c: 2, type: 'P', pair: 'A' },
      { r: 1, c: 4, type: 'P', pair: 'A' },
      { r: 1, c: 5, type: 'M', initRot: 0, solRot: 1 },
      { r: 4, c: 5, type: 'X', dir: 3 },
      { r: 5, c: 5, type: 'E', dir: 0, color: 'gold' },
      { r: 4, c: 2, type: 'M', movable: true, initRot: 0, solRot: 1, solR: 4, solC: 3 },
      { r: 2, c: 3, type: 'T', color: 'white' },
      { r: 2, c: 2, type: 'W' },
      { r: 5, c: 1, type: 'W' },
    ],
  },
  {
    id: 13,
    name: 'Quantum Gate',
    size: 7,
    tip: 'Position both rail mirrors, activate the gold key, and warp to the twin targets.',
    tiles: [
      { r: 3, c: 0, type: 'E', dir: 1, color: 'gold' },
      { r: 3, c: 2, type: 'S', initRot: 1, solRot: 0 },
      { r: 0, c: 2, type: 'D', initDir: 2, solDir: 1 },
      { r: 0, c: 4, type: 'K', color: 'gold' },
      { r: 0, c: 5, type: 'P', pair: 'A' },
      { r: 5, c: 1, type: 'P', pair: 'A' },
      { r: 5, c: 3, type: 'F', color: 'magenta' },
      { r: 5, c: 5, type: 'T', color: 'magenta' },
      { r: 3, c: 4, type: 'G', color: 'gold' },
      { r: 2, c: 6, type: 'M', movable: true, initRot: 1, solRot: 1, solR: 3, solC: 6 },
      { r: 6, c: 6, type: 'T', color: 'gold' },
      { r: 1, c: 3, type: 'W' },
      { r: 4, c: 4, type: 'W' },
    ],
  },
  {
    id: 14,
    name: 'Spectrum Forge',
    size: 7,
    tip: 'Shift cyan to gold with a lens, fuse with magenta, and route the superbeam.',
    tiles: [
      { r: 0, c: 3, type: 'E', dir: 2, color: 'cyan' },
      { r: 2, c: 3, type: 'F', color: 'gold' },
      { r: 3, c: 3, type: 'X', dir: 2 },
      { r: 3, c: 0, type: 'E', dir: 1, color: 'magenta' },
      { r: 3, c: 1, type: 'S', initRot: 0, solRot: 1 },
      { r: 5, c: 1, type: 'T', color: 'magenta' },
      { r: 6, c: 3, type: 'M', initRot: 0, solRot: 1 },
      { r: 6, c: 5, type: 'D', initDir: 1, solDir: 0 },
      { r: 2, c: 5, type: 'T', color: 'white' },
      { r: 4, c: 4, type: 'W' },
      { r: 1, c: 2, type: 'W' },
    ],
  },
  {
    id: 15,
    name: 'Grand Nova',
    size: 7,
    tip: 'Master reactor: unlock the barrier, fuse two beams, and split the superbeam.',
    tiles: [
      { r: 0, c: 0, type: 'E', dir: 2, color: 'cyan' },
      { r: 3, c: 0, type: 'S', initRot: 0, solRot: 1 },
      { r: 6, c: 0, type: 'M', initRot: 0, solRot: 1 },
      { r: 6, c: 2, type: 'K', color: 'cyan' },
      { r: 6, c: 4, type: 'T', color: 'cyan' },
      { r: 3, c: 2, type: 'G', color: 'cyan' },
      { r: 3, c: 4, type: 'X', dir: 1 },
      { r: 0, c: 4, type: 'E', dir: 2, color: 'magenta' },
      { r: 1, c: 4, type: 'D', initDir: 1, solDir: 2 },
      { r: 3, c: 6, type: 'S', initRot: 1, solRot: 0 },
      { r: 1, c: 6, type: 'T', color: 'white' },
      { r: 5, c: 6, type: 'M', movable: true, initRot: 0, solRot: 1, solR: 3, solC: 6 },
      { r: 1, c: 2, type: 'W' },
      { r: 4, c: 3, type: 'W' },
    ],
  },
];

// Fix Level 15's splitter/movable placement cleanly: (3,6) is S, so movable mirror goes at (5,5)->(3,5)?
// Wait: let's make Level 15 use (3,5) empty -> (3,6) is M movable from (4,6) -> (3,6) or S at (3,5) and T at (1,5) + (3,6)!
LEVELS[14] = {
  id: 15,
  name: 'Grand Nova',
  size: 7,
  tip: 'Master reactor: unlock the barrier, fuse two beams, and split the superbeam.',
  tiles: [
    { r: 0, c: 0, type: 'E', dir: 2, color: 'cyan' },
    { r: 3, c: 0, type: 'S', initRot: 0, solRot: 1 },
    { r: 6, c: 0, type: 'M', initRot: 0, solRot: 1 },
    { r: 6, c: 2, type: 'K', color: 'cyan' },
    { r: 6, c: 4, type: 'T', color: 'cyan' },
    { r: 3, c: 2, type: 'G', color: 'cyan' },
    { r: 3, c: 3, type: 'X', dir: 1 },
    { r: 0, c: 3, type: 'E', dir: 2, color: 'magenta' },
    { r: 1, c: 3, type: 'D', initDir: 1, solDir: 2 },
    { r: 3, c: 5, type: 'S', initRot: 1, solRot: 0 },
    { r: 1, c: 5, type: 'T', color: 'white' },
    { r: 4, c: 6, type: 'M', movable: true, initRot: 0, solRot: 1, solR: 3, solC: 6 },
    { r: 5, c: 6, type: 'T', color: 'white' },
    { r: 1, c: 2, type: 'W' },
    { r: 4, c: 4, type: 'W' },
  ],
};

// Fix Level 10 & Level 14 minor placements if needed — we'll also verify all 15 via traceLaserNetwork!

const levelCache: Record<number, LevelData> = {};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateLevel(level: LevelData, useSol: boolean): { lit: number; targets: number } {
  const grid = Array.from({ length: level.size }, () => Array(level.size).fill(null) as (TileConfig & { rot: number; dir: number; visualAngle: number; targetAngle: number; visualR: number; visualC: number } | null)[]);
  let targets = 0;

  for (const t of level.tiles) {
    const r = useSol && t.solR !== undefined ? t.solR : t.r;
    const c = useSol && t.solC !== undefined ? t.solC : t.c;
    const rot = useSol && t.solRot !== undefined ? t.solRot : (t.initRot ?? 0);
    const dir = useSol && t.solDir !== undefined ? t.solDir : (t.initDir ?? t.dir ?? 1);
    grid[r][c] = {
      ...t,
      r,
      c,
      rot,
      dir,
      visualAngle: 0,
      targetAngle: 0,
      visualR: r,
      visualC: c,
    };
    if (t.type === 'T') targets++;
  }

  const res = traceLaserNetwork(level.size, grid);
  return { lit: res.litTargets.size, targets };
}

function getSectorMeta(levelNum: number) {
  if (levelNum <= 80)
    return {
      sector: 'Rail & Mirrors',
      size: 5,
      turns: 4,
      allowMovable: true,
      allowDiode: true,
      allowSplit: false,
      allowPortal: false,
      allowGate: false,
      tip: 'Tap mirrors or diodes to rotate, and drag rail-mounted optics onto empty cells.',
    };
  if (levelNum <= 180)
    return {
      sector: 'Diode Splitters',
      size: 6,
      turns: 5,
      allowMovable: true,
      allowDiode: true,
      allowSplit: true,
      allowPortal: false,
      allowGate: false,
      tip: 'Combine splitters and 4-way diodes to energize every gem.',
    };
  if (levelNum <= 320)
    return {
      sector: 'Gate Locks',
      size: 6,
      turns: 5,
      allowMovable: true,
      allowDiode: true,
      allowSplit: true,
      allowPortal: true,
      allowGate: true,
      tip: 'Power matching Key nodes to unlock Forcefield Gates and warp across walls.',
    };
  return {
    sector: 'Quantum Reactor',
    size: levelNum <= 420 ? 6 : 7,
    turns: 6,
    allowMovable: true,
    allowDiode: true,
    allowSplit: true,
    allowPortal: true,
    allowGate: true,
    tip: 'Master circuit: route beams through gates, portals, diodes, and rail optics.',
  };
}

function generateDeterministicLevel(levelNum: number): LevelData {
  const meta = getSectorMeta(levelNum);
  const size = meta.size;
  const colors: LaserColor[] = ['cyan', 'magenta', 'gold'];

  for (let attempt = 0; attempt < 80; attempt++) {
    const rng = mulberry32((levelNum * 2654435761 + attempt * 1013904223) >>> 0);
    const randInt = (n: number) => Math.floor(rng() * n);
    const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
    const tiles: TileConfig[] = [];

    let curColor: LaserColor = colors[(levelNum + attempt) % colors.length];
    const edge = randInt(4);
    let er: number, ec: number, dir: number;
    if (edge === 0) {
      er = 0;
      ec = randInt(size);
      dir = 2;
    } else if (edge === 1) {
      er = randInt(size);
      ec = 0;
      dir = 1;
    } else if (edge === 2) {
      er = size - 1;
      ec = randInt(size);
      dir = 0;
    } else {
      er = randInt(size);
      ec = size - 1;
      dir = 3;
    }

    tiles.push({ r: er, c: ec, type: 'E', dir, color: curColor });
    grid[er][ec] = 'E';

    let r = er;
    let c = ec;
    let opticsPlaced = 0;
    let portalPlaced = false;
    let gatePlaced = false;
    const segCells: Array<{ r: number; c: number; color: LaserColor }> = [];
    const deferredMovables: Array<{ tileIdx: number; solR: number; solC: number }> = [];

    for (let step = 0; step < meta.turns; step++) {
      const cands: Array<{ r: number; c: number }> = [];
      let nr = r + DR[dir];
      let nc = c + DC[dir];
      while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (grid[nr][nc] !== null) break;
        cands.push({ r: nr, c: nc });
        nr += DR[dir];
        nc += DC[dir];
      }
      if (cands.length === 0) break;

      const pickIdx = cands.length > 1 ? 1 + randInt(cands.length - 1) : 0;
      const pick = cands[pickIdx];
      for (let i = 0; i < pickIdx; i++) {
        segCells.push({ r: cands[i].r, c: cands[i].c, color: curColor });
      }

      if (step === meta.turns - 1) {
        if (meta.allowGate && !gatePlaced && pickIdx >= 2) {
          // Place a Key earlier on the path and a Gate right before the final Target
          const keyCell = cands[0];
          const gateCell = cands[pickIdx - 1];
          if (!grid[keyCell.r][keyCell.c] && !grid[gateCell.r][gateCell.c] && (keyCell.r !== gateCell.r || keyCell.c !== gateCell.c)) {
            tiles.push({ r: keyCell.r, c: keyCell.c, type: 'K', color: curColor });
            tiles.push({ r: gateCell.r, c: gateCell.c, type: 'G', color: curColor });
            grid[keyCell.r][keyCell.c] = 'K';
            grid[gateCell.r][gateCell.c] = 'G';
            gatePlaced = true;
          }
        }
        tiles.push({ r: pick.r, c: pick.c, type: 'T', color: curColor });
        grid[pick.r][pick.c] = 'T';
        break;
      }

      if (meta.allowPortal && !portalPlaced && step >= 1 && step <= meta.turns - 3 && rng() < 0.4) {
        const empties: Array<{ r: number; c: number }> = [];
        for (let pr = 1; pr < size - 1; pr++) {
          for (let pc = 1; pc < size - 1; pc++) {
            if (!grid[pr][pc] && (pr !== pick.r || pc !== pick.c)) {
              const tr = pr + DR[dir];
              const tc = pc + DC[dir];
              if (tr >= 0 && tr < size && tc >= 0 && tc < size && !grid[tr][tc]) {
                empties.push({ r: pr, c: pc });
              }
            }
          }
        }
        if (empties.length > 0) {
          const exitP = empties[randInt(empties.length)];
          tiles.push({ r: pick.r, c: pick.c, type: 'P', pair: 'A' });
          tiles.push({ r: exitP.r, c: exitP.c, type: 'P', pair: 'A' });
          grid[pick.r][pick.c] = 'P';
          grid[exitP.r][exitP.c] = 'P';
          r = exitP.r;
          c = exitP.c;
          portalPlaced = true;
          continue;
        }
      }

      const rots = rng() < 0.5 ? [0, 1] : [1, 0];
      let turned = false;
      for (let ri = 0; ri < rots.length; ri++) {
        const solRot = rots[ri];
        const ndir = solRot === 0 ? dir ^ 1 : 3 - dir;
        const tr = pick.r + DR[ndir];
        const tc = pick.c + DC[ndir];
        if (tr >= 0 && tr < size && tc >= 0 && tc < size && grid[tr][tc] === null) {
          const useDiode = meta.allowDiode && opticsPlaced === 1 && rng() < 0.55;
          const useSplitter = !useDiode && meta.allowSplit && opticsPlaced >= 1 && opticsPlaced <= 2 && rng() < 0.45;
          const makeMovable = meta.allowMovable && !useSplitter && opticsPlaced === 0 && rng() < 0.55;

          if (useDiode) {
            tiles.push({
              r: pick.r,
              c: pick.c,
              type: 'D',
              initDir: (ndir + 1 + randInt(3)) % 4,
              solDir: ndir,
            });
          } else {
            const tileIdx = tiles.length;
            tiles.push({
              r: pick.r,
              c: pick.c,
              type: useSplitter ? 'S' : 'M',
              initRot: 1 - solRot,
              solRot,
              movable: makeMovable,
              solR: makeMovable ? pick.r : undefined,
              solC: makeMovable ? pick.c : undefined,
            });
            if (makeMovable) {
              deferredMovables.push({ tileIdx, solR: pick.r, solC: pick.c });
            }
          }

          grid[pick.r][pick.c] = 'O';
          if (useSplitter) {
            let sr = pick.r + DR[dir];
            let sc = pick.c + DC[dir];
            const straightCands: Array<{ r: number; c: number }> = [];
            while (sr >= 0 && sr < size && sc >= 0 && sc < size && !grid[sr][sc]) {
              straightCands.push({ r: sr, c: sc });
              sr += DR[dir];
              sc += DC[dir];
            }
            if (straightCands.length > 0) {
              const st = straightCands[straightCands.length - 1];
              tiles.push({ r: st.r, c: st.c, type: 'T', color: curColor });
              grid[st.r][st.c] = 'T';
            }
          }
          r = pick.r;
          c = pick.c;
          dir = ndir;
          opticsPlaced++;
          turned = true;
          break;
        }
      }

      if (!turned) {
        tiles.push({ r: pick.r, c: pick.c, type: 'T', color: curColor });
        grid[pick.r][pick.c] = 'T';
        break;
      }
    }

    let extraGems = 0;
    for (let i = segCells.length - 1; i >= 0 && extraGems < 2; i--) {
      const sc = segCells[i];
      if (!grid[sc.r][sc.c] && rng() < 0.35) {
        tiles.push({ r: sc.r, c: sc.c, type: 'T', color: sc.color });
        grid[sc.r][sc.c] = 'T';
        extraGems++;
      }
    }

    const pathOcc = new Set(segCells.map((p) => `${p.r},${p.c}`));
    // Relocate movable mirrors by 1 orthogonal empty step off the path!
    for (const dm of deferredMovables) {
      const t = tiles[dm.tileIdx];
      const adj = [0, 1, 2, 3].map((d) => ({ r: dm.solR + DR[d], c: dm.solC + DC[d] }));
      const valid = adj.filter(
        (p) =>
          p.r >= 0 &&
          p.r < size &&
          p.c >= 0 &&
          p.c < size &&
          !grid[p.r][p.c] &&
          !pathOcc.has(`${p.r},${p.c}`)
      );
      if (valid.length > 0) {
        const dest = valid[randInt(valid.length)];
        grid[dm.solR][dm.solC] = null;
        grid[dest.r][dest.c] = 'O';
        t.r = dest.r;
        t.c = dest.c;
      } else {
        t.movable = false;
        t.solR = undefined;
        t.solC = undefined;
      }
    }

    const wallTarget = Math.min(5, 2 + Math.floor(size / 2));
    let walls = 0;
    for (let w = 0; w < 24 && walls < wallTarget; w++) {
      const wr = randInt(size);
      const wc = randInt(size);
      if (!grid[wr][wc] && !pathOcc.has(`${wr},${wc}`)) {
        grid[wr][wc] = 'W';
        tiles.push({ r: wr, c: wc, type: 'W' });
        walls++;
      }
    }

    if (opticsPlaced >= 3) {
      const candidate: LevelData = {
        id: levelNum,
        name: meta.sector,
        size,
        tip: meta.tip,
        tiles,
      };
      const solSim = simulateLevel(candidate, true);
      const initSim = simulateLevel(candidate, false);
      if (solSim.targets >= 1 && solSim.lit === solSim.targets && initSim.lit < solSim.targets) {
        return candidate;
      }
    }
  }

  const fb = LEVELS[(levelNum - 1) % LEVELS.length];
  return {
    id: levelNum,
    name: meta.sector,
    size: fb.size,
    tip: meta.tip,
    tiles: fb.tiles.map((t) => ({ ...t })),
  };
}

export function getCampaignLevel(indexZeroBased: number): LevelData {
  if (indexZeroBased < LEVELS.length) return LEVELS[indexZeroBased];
  const levelNum = indexZeroBased + 1;
  if (!levelCache[levelNum]) {
    levelCache[levelNum] = generateDeterministicLevel(levelNum);
  }
  return levelCache[levelNum];
}

export function generateBlitzPuzzle(roundNum: number): LevelData {
  // Fast, crisp 5x5 circuits (3-4 turns) built for 90s Blitz Rush combos
  const baseSeed = Math.floor(Math.random() * 100000) + roundNum * 7919;
  const size = 5;
  const colors: LaserColor[] = ['cyan', 'magenta', 'gold'];
  const color = colors[roundNum % colors.length];

  for (let attempt = 0; attempt < 40; attempt++) {
    const rng = mulberry32((baseSeed + attempt * 997) >>> 0);
    const randInt = (n: number) => Math.floor(rng() * n);
    const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
    const tiles: TileConfig[] = [];

    const fromLeft = rng() < 0.5;
    const er = fromLeft ? randInt(size) : 0;
    const ec = fromLeft ? 0 : randInt(size);
    let dir = fromLeft ? 1 : 2;
    tiles.push({ r: er, c: ec, type: 'E', dir, color });
    grid[er][ec] = 'E';

    let r = er;
    let c = ec;
    let optics = 0;
    const turns = roundNum < 4 ? 3 : 4;
    const segs: Array<{ r: number; c: number }> = [];

    for (let step = 0; step < turns; step++) {
      const cands: Array<{ r: number; c: number }> = [];
      let nr = r + DR[dir];
      let nc = c + DC[dir];
      while (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (grid[nr][nc] !== null) break;
        cands.push({ r: nr, c: nc });
        nr += DR[dir];
        nc += DC[dir];
      }
      if (cands.length === 0) break;

      const pickIdx = cands.length > 1 ? 1 + randInt(cands.length - 1) : 0;
      const pick = cands[pickIdx];
      for (let i = 0; i < pickIdx; i++) segs.push(cands[i]);

      if (step === turns - 1) {
        tiles.push({ r: pick.r, c: pick.c, type: 'T', color });
        grid[pick.r][pick.c] = 'T';
        break;
      }

      const rots = rng() < 0.5 ? [0, 1] : [1, 0];
      let turned = false;
      for (const solRot of rots) {
        const ndir = solRot === 0 ? dir ^ 1 : 3 - dir;
        const tr = pick.r + DR[ndir];
        const tc = pick.c + DC[ndir];
        if (tr >= 0 && tr < size && tc >= 0 && tc < size && grid[tr][tc] === null) {
          if (optics === 1 && rng() < 0.4) {
            tiles.push({
              r: pick.r,
              c: pick.c,
              type: 'D',
              initDir: (ndir + 1 + randInt(3)) % 4,
              solDir: ndir,
            });
          } else {
            tiles.push({
              r: pick.r,
              c: pick.c,
              type: 'M',
              initRot: 1 - solRot,
              solRot,
            });
          }
          grid[pick.r][pick.c] = 'O';
          r = pick.r;
          c = pick.c;
          dir = ndir;
          optics++;
          turned = true;
          break;
        }
      }
      if (!turned) {
        tiles.push({ r: pick.r, c: pick.c, type: 'T', color });
        grid[pick.r][pick.c] = 'T';
        break;
      }
    }

    if (segs.length > 0 && rng() < 0.6) {
      const g = segs[randInt(segs.length)];
      if (!grid[g.r][g.c]) {
        tiles.push({ r: g.r, c: g.c, type: 'T', color });
        grid[g.r][g.c] = 'T';
      }
    }

    const candidate: LevelData = {
      id: roundNum,
      name: `Blitz Circuit #${roundNum}`,
      size,
      tip: 'Solve fast to extend the clock and build your combo multiplier!',
      tiles,
    };

    const solSim = simulateLevel(candidate, true);
    const initSim = simulateLevel(candidate, false);
    if (optics >= 2 && solSim.targets >= 1 && solSim.lit === solSim.targets && initSim.lit < solSim.targets) {
      return candidate;
    }
  }

  return {
    ...LEVELS[2],
    id: roundNum,
    name: `Blitz Circuit #${roundNum}`,
  };
}
