export type GameScreenState = 'TITLE_MENU' | 'PLAYING' | 'ROUND_SUMMARY' | 'BLITZ_OVER';
export type GameMode = 'campaign' | 'blitz';
export type LaserColor = 'cyan' | 'magenta' | 'gold' | 'white';
export type TileType = 'E' | 'T' | 'M' | 'S' | 'W' | 'P' | 'F' | 'D' | 'K' | 'G' | 'X';

export interface TileConfig {
  r: number;
  c: number;
  type: TileType;
  dir?: number;
  color?: LaserColor;
  initRot?: number;
  solRot?: number;
  initDir?: number;
  solDir?: number;
  solR?: number;
  solC?: number;
  movable?: boolean;
  pair?: string;
}

export interface RuntimeTile extends TileConfig {
  rot: number;
  dir: number;
  visualAngle: number;
  targetAngle: number;
  visualR: number;
  visualC: number;
}

export interface BeamSegment {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  color: LaserColor;
}

export interface Particle {
  r: number;
  c: number;
  vr: number;
  vc: number;
  life: number;
  decay: number;
  size: number;
  color: string;
}

export interface LevelData {
  id: number;
  name: string;
  size: number;
  tip: string;
  tiles: TileConfig[];
}

export interface BoardEngineState {
  size: number;
  grid: (RuntimeTile | null)[][];
  beams: BeamSegment[];
  litTargets: Set<string>;
  openGateColors: Set<LaserColor>;
  activeKeys: Set<string>;
  combinerColors: Record<string, Set<LaserColor>>;
  hintTile: { r: number; c: number; targetR?: number; targetC?: number } | null;
  cursor: { r: number; c: number } | null;
  dragSource: { r: number; c: number; hoverR: number; hoverC: number } | null;
  particles: Particle[];
}
