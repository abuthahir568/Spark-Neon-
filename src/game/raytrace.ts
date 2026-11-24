import { BeamSegment, LaserColor, RuntimeTile } from '../types/game';

export const DR = [-1, 0, 1, 0] as const;
export const DC = [0, 1, 0, -1] as const;

export interface RaytraceResult {
  beams: BeamSegment[];
  litTargets: Set<string>;
  openGateColors: Set<LaserColor>;
  activeKeys: Set<string>;
  combinerColors: Record<string, Set<LaserColor>>;
}

function runSinglePass(
  size: number,
  grid: (RuntimeTile | null)[][],
  openGateColors: Set<LaserColor>,
  chargedCombiners: Set<string>
): RaytraceResult {
  const beams: BeamSegment[] = [];
  const litTargets = new Set<string>();
  const nextOpenGateColors = new Set<LaserColor>(openGateColors);
  const activeKeys = new Set<string>();
  const combinerColors: Record<string, Set<LaserColor>> = {};
  const visited = new Set<string>();
  const queue: Array<{ r: number; c: number; dir: number; color: LaserColor }> = [];
  const portals: Record<string, RuntimeTile[]> = {};

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const tile = grid[r][c];
      if (!tile) continue;
      if (tile.type === 'E') {
        queue.push({ r, c, dir: tile.dir, color: tile.color ?? 'cyan' });
      } else if (tile.type === 'P' && tile.pair) {
        if (!portals[tile.pair]) portals[tile.pair] = [];
        portals[tile.pair].push(tile);
      } else if (tile.type === 'X') {
        const key = `${r},${c}`;
        combinerColors[key] = new Set<LaserColor>();
        if (chargedCombiners.has(key)) {
          queue.push({ r, c, dir: tile.dir, color: 'white' });
        }
      }
    }
  }

  let safety = 0;
  while (queue.length > 0 && safety++ < 700) {
    const ray = queue.shift()!;
    const { r: startR, c: startC, dir, color } = ray;

    const nr = startR + DR[dir];
    const nc = startC + DC[dir];

    if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
      beams.push({
        r1: startR,
        c1: startC,
        r2: startR + DR[dir] * 0.48,
        c2: startC + DC[dir] * 0.48,
        color,
      });
      continue;
    }

    const visitKey = `${nr},${nc},${dir},${color}`;
    if (visited.has(visitKey)) {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      continue;
    }
    visited.add(visitKey);

    const tile = grid[nr][nc];

    if (!tile) {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      queue.push({ r: nr, c: nc, dir, color });
    } else if (tile.type === 'W' || tile.type === 'E') {
      beams.push({
        r1: startR,
        c1: startC,
        r2: nr - DR[dir] * 0.36,
        c2: nc - DC[dir] * 0.36,
        color,
      });
    } else if (tile.type === 'G') {
      const gateColor = tile.color ?? 'cyan';
      if (openGateColors.has(gateColor)) {
        beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
        queue.push({ r: nr, c: nc, dir, color });
      } else {
        beams.push({
          r1: startR,
          c1: startC,
          r2: nr - DR[dir] * 0.32,
          c2: nc - DC[dir] * 0.32,
          color,
        });
      }
    } else if (tile.type === 'K') {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      const keyColor = tile.color ?? 'cyan';
      if (color === keyColor || color === 'white') {
        activeKeys.add(`${nr},${nc}`);
        nextOpenGateColors.add(keyColor);
      }
      queue.push({ r: nr, c: nc, dir, color });
    } else if (tile.type === 'X') {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      const xKey = `${nr},${nc}`;
      if (!combinerColors[xKey]) combinerColors[xKey] = new Set<LaserColor>();
      if (color !== 'white') {
        combinerColors[xKey].add(color);
      } else {
        combinerColors[xKey].add('cyan');
        combinerColors[xKey].add('magenta');
      }
    } else if (tile.type === 'T') {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      if (tile.color === color) {
        litTargets.add(`${nr},${nc}`);
      }
      queue.push({ r: nr, c: nc, dir, color });
    } else if (tile.type === 'F') {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      queue.push({ r: nr, c: nc, dir, color: tile.color ?? color });
    } else if (tile.type === 'M') {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      const ndir = tile.rot % 2 === 0 ? dir ^ 1 : 3 - dir;
      queue.push({ r: nr, c: nc, dir: ndir, color });
    } else if (tile.type === 'S') {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      const ndir = tile.rot % 2 === 0 ? dir ^ 1 : 3 - dir;
      queue.push({ r: nr, c: nc, dir, color });
      queue.push({ r: nr, c: nc, dir: ndir, color });
    } else if (tile.type === 'D') {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      queue.push({ r: nr, c: nc, dir: tile.dir, color });
    } else if (tile.type === 'P') {
      beams.push({ r1: startR, c1: startC, r2: nr, c2: nc, color });
      const pairList = tile.pair ? portals[tile.pair] ?? [] : [];
      const other = pairList.find((p) => p.r !== nr || p.c !== nc);
      if (other) {
        queue.push({ r: other.r, c: other.c, dir, color });
      }
    }
  }

  return {
    beams,
    litTargets,
    openGateColors: nextOpenGateColors,
    activeKeys,
    combinerColors,
  };
}

export function traceLaserNetwork(
  size: number,
  grid: (RuntimeTile | null)[][]
): RaytraceResult {
  let openGates = new Set<LaserColor>();
  let chargedCombiners = new Set<string>();
  let result: RaytraceResult = {
    beams: [],
    litTargets: new Set<string>(),
    openGateColors: openGates,
    activeKeys: new Set<string>(),
    combinerColors: {},
  };

  // Fixed-point convergence for Gates & Prismatic Combiners
  for (let pass = 0; pass < 5; pass++) {
    result = runSinglePass(size, grid, openGates, chargedCombiners);

    let changed = false;
    result.openGateColors.forEach((col) => {
      if (!openGates.has(col)) {
        openGates.add(col);
        changed = true;
      }
    });

    for (const [xKey, cols] of Object.entries(result.combinerColors)) {
      if (cols.size >= 2 && !chargedCombiners.has(xKey)) {
        chargedCombiners.add(xKey);
        changed = true;
      }
    }

    if (!changed) break;
  }

  return result;
}

export function findHintTile(
  interactiveTiles: RuntimeTile[],
  _grid: (RuntimeTile | null)[][],
  _size: number
): { r: number; c: number; targetR?: number; targetC?: number } | null {
  // 1. Check for a movable tile that isn't in its solution position yet
  const misplaced = interactiveTiles.find(
    (t) => t.movable && t.solR !== undefined && t.solC !== undefined && (t.r !== t.solR || t.c !== t.solC)
  );
  if (misplaced) {
    return {
      r: misplaced.r,
      c: misplaced.c,
      targetR: misplaced.solR,
      targetC: misplaced.solC,
    };
  }

  // 2. Check for a rotatable Mirror/Splitter or 4-Way Diode with wrong orientation
  const wrongRot = interactiveTiles.find((t) => {
    if (t.type === 'M' || t.type === 'S') {
      return t.solRot !== undefined && t.rot % 2 !== t.solRot % 2;
    }
    if (t.type === 'D') {
      return t.solDir !== undefined && t.dir % 4 !== t.solDir % 4;
    }
    return false;
  });

  if (wrongRot) {
    return { r: wrongRot.r, c: wrongRot.c };
  }

  return null;
}
