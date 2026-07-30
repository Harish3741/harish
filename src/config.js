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
