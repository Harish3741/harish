// Global constants and the museum's colour palette.
// Every colour in the game comes from here — retheming is a single-file job.

export const TILE = 16;

// The logical render resolution. It is *not* fixed: the renderer picks an
// integer pixel scale for the window and then sizes this to suit, so a big
// monitor sees more museum rather than the same museum blown up. Chunky pixels
// stay chunky either way, because the scale is only ever a whole number.
export const view = { w: 480, h: 270 };

// Bounds the renderer respects when picking that scale. The upper bound
// matters: the logical view must never grow larger than the map itself.
export const MAX_VIEW_W = 480;
export const MAX_VIEW_H = 300;

export const COL = {
  // architecture
  wallTop: '#8B7355',
  wallTopHi: '#A38C6B',
  wallFace: '#EADCC4',
  wallFaceHi: '#F5EBDB',
  wallLine: '#5E4A36',
  baseboard: '#9A7C58',

  // floors
  marbleA: '#F1E7D6',
  marbleB: '#E8DBC6',
  marbleLine: '#D8C8AE',
  woodA: '#C99A63',
  woodB: '#BD8D57',
  woodLine: '#A97B49',
  stoneA: '#B8AE9C',
  stoneB: '#ACA190',
  stoneLine: '#9A8F7D',

  // outdoors
  grass: '#7FA85C',
  grassDark: '#6B9049',
  sky: '#1E1712',

  // props and accents
  brass: '#DCA646',
  brassDim: '#A87C2E',
  velvet: '#9C4038',
  velvetDark: '#7A2F29',
  plantA: '#6FA05A',
  plantB: '#54853F',
  pot: '#B4674A',
  potDark: '#8E4E36',
  glass: '#BFE3E8',
  ink: '#3B2A22',
  paper: '#FBF3E4',
  wood: '#8A5F3C',
  woodDark: '#6B4830',

  shadow: 'rgba(59, 42, 34, 0.25)',
};

// The About Me wing is fitted out as a small screening room, in the black and
// grey of a modern cinema rather than the red plush of an old one: acoustic
// panelling, charcoal carpet, black masking round the screen. The greys carry a
// slight warm bias so the room still belongs to a warm building, and the
// fittings are steel rather than the museum's brass.
export const THEATRE = {
  wallFace: '#2C2F33',
  wallFaceHi: '#3A3E43',
  baseboard: '#191B1E',
  panel: '#212428',
  carpetA: '#24272A',
  carpetB: '#292C30',
  carpetLine: '#191B1E',
  curtain: '#8E2A32',
  curtainDark: '#57181F',
  curtainHi: '#B24C56',
  seat: '#1C1E21',
  seatHi: '#525A63',
  seatLo: '#101214',
  trim: '#4A5058',
  screen: '#DCE4E8',
  screenDim: '#3C4248',
  glow: 'rgba(190, 214, 232, 0.16)',
};

// Wall faces are themed per room, so a room's walls belong to its floor. The
// key comes from the region's `theme` in map.js; a room without one gets the
// museum's own plaster, which is what the atrium and the gallery want anyway.
export const WALLS = {
  museum: {
    face: COL.wallFace, hi: COL.wallFaceHi, base: COL.baseboard,
    panel: 'rgba(154, 124, 88, 0.24)', panelHi: 'rgba(255, 250, 238, 0.45)',
    panelLo: 'rgba(120, 94, 64, 0.30)', rail: null,
    light: 'rgba(255, 250, 238, 0.35)',
     top: COL.wallTop, topHi: 'rgba(255, 246, 226, 0.045)',
    topLo: 'rgba(48, 34, 22, 0.05)', topJoint: 'rgba(74, 56, 38, 0.30)',
  },
  theatre: {
    face: THEATRE.wallFace, hi: THEATRE.wallFaceHi, base: THEATRE.baseboard,
    panel: 'rgba(0, 0, 0, 0.32)', panelHi: 'rgba(148, 158, 170, 0.16)',
    panelLo: 'rgba(0, 0, 0, 0.38)', rail: 'rgba(120, 132, 146, 0.35)',
    light: 'rgba(210, 224, 238, 0.07)',
     top: '#23262A', topHi: 'rgba(190, 208, 224, 0.045)',
    topLo: 'rgba(0, 0, 0, 0.14)', topJoint: 'rgba(10, 12, 14, 0.42)',
  },
  // painted blockwork, over the machine hall's stone floor
  plant: {
    face: '#ADA89C', hi: '#BEB9AC', base: '#736E5E',
    panel: 'rgba(68, 64, 54, 0.22)', panelHi: 'rgba(226, 222, 208, 0.34)',
    panelLo: 'rgba(56, 52, 44, 0.30)', rail: 'rgba(118, 114, 102, 0.32)',
    light: 'rgba(240, 238, 226, 0.20)',
     top: '#7E7A6E', topHi: 'rgba(238, 238, 226, 0.05)',
    topLo: 'rgba(34, 32, 28, 0.08)', topJoint: 'rgba(48, 46, 40, 0.32)',
  },
  // light commercial plaster, over the boardroom's carpet tile
  office: {
    face: '#C1C4CA', hi: '#D2D5DA', base: '#788089',
    panel: 'rgba(96, 102, 112, 0.18)', panelHi: 'rgba(248, 250, 252, 0.40)',
    panelLo: 'rgba(78, 84, 94, 0.26)', rail: 'rgba(140, 148, 158, 0.30)',
    light: 'rgba(248, 250, 252, 0.30)',
     top: '#8C939D', topHi: 'rgba(240, 244, 250, 0.05)',
    topLo: 'rgba(30, 36, 44, 0.09)', topJoint: 'rgba(52, 58, 68, 0.32)',
  },
};

// The droid. Same grid the avatar sheet used.
export const DROID_PAL = {
  '#': '#3B2A22',
  C: '#F5E9D8',
  S: '#D9C3A5',
  V: '#2E4756',
  E: '#7FE0D4',
  O: '#E8763A',
};

// Logical px per second. It's a hovering droid in a building you are meant to
// get around, not a character with weight — brisk beats stately here.
export const SPEED = 105;
