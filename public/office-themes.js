// Painted holiday props share the office camera and use world-pixel anchors.
export const THEME_IDS = ['everyday', 'halloween', 'thanksgiving', 'christmas'];
export const THEME_STORAGE_KEY = 'branch.theme.v1';
export const DEPTH_BIAS = 10;
export const HOLIDAY_ATLAS = '/assets/holidays/painted-props-v1.png';
export const CLEAN_PLATE = '/assets/holidays/plant-cleanplate-v1.png';

// Measured alpha bounds in the generated atlas; rendering preserves the original PNG.
export const PROP_FRAMES = {
  tree: [69, 15, 396, 559],
  pumpkins: [557, 234, 457, 319],
  autumn: [1067, 61, 431, 482],
  wreath: [39, 574, 449, 424],
  candles: [546, 643, 463, 319],
  harvest: [1050, 637, 459, 308],
};

// Only these small rectangles are taken from the prepared clean plate.
// No color-keying, guessed carpet, or replacement of the approved office map.
export const PLANT_ANCHORS = {
  lobbyPlant: { id: 'lobby-plant', x: 359, y: 146, w: 53, h: 85, baseline: 224 },
  bottomPlant: { id: 'bottom-plant', x: 850, y: 698, w: 59, h: 99, baseline: 789 },
};

// Code-drawn props (see ART in office-holiday.js) use the same placement contract.
function drawn(id, title, art, x, y, w, h, baseline, options = {}) {
  return { id, title, art, x, y, w, h, baseline, layer: 'surface', ...options };
}

function prop(id, title, sprite, x, y, w, baseline, options = {}) {
  const frame = PROP_FRAMES[sprite];
  return { id, title, sprite, x, y, w, h: w * frame[3] / frame[2], baseline, layer: 'surface', ...options };
}

// The seasonal display is OUTSIDE the conference room, against its right glass corner.
// Its footprint leaves the left doorway and the east/west aisle open.
const corner = { id: 'seasonal-corner', x: 866, y: 345, w: 103, h: 30 };

export const THEMES = {
  everyday: { id: 'everyday', label: 'Everyday', provisional: false, ui: {}, decorations: [] },
  halloween: {
    id: 'halloween', label: 'Halloween', provisional: false,
    ui: { '--theme-accent': '#955328', '--theme-header': '#f4eee7', '--theme-controls': '#efe7de' },
    decorations: [
      prop('hw-main-display', 'Pumpkins and lantern by the conference room', 'pumpkins', 854, 287, 120, 371,
        { layer: 'floor', focal: true, footprint: corner }),
      prop('hw-reception', 'Reception pumpkins', 'pumpkins', 159, 304, 41, 333),
      prop('hw-lounge', 'Lounge pumpkin centerpiece', 'pumpkins', 1212, 189, 34, 213),
      drawn('hw-cauldron', 'Bubbling cauldron', 'cauldron', 288, 156, 52, 50, 204,
        { layer: 'floor', footprint: { x: 294, y: 186, w: 40, h: 18 } }),
      drawn('hw-tombstones', 'Office graveyard', 'tombstones', 272, 700, 84, 56, 756,
        { layer: 'floor', footprint: { x: 278, y: 736, w: 72, h: 18 } }),
      drawn('hw-skeleton', 'Skeleton waiting for a meeting', 'skeleton', 56, 214, 40, 56, 262),
      drawn('hw-kitchen', 'Candy and caramel apples', 'candy', 1104, 489, 64, 40, 526),
    ],
  },
  thanksgiving: {
    id: 'thanksgiving', label: 'Thanksgiving', provisional: false,
    ui: { '--theme-accent': '#845637', '--theme-header': '#f5eee5', '--theme-controls': '#eee6d9' },
    decorations: [
      prop('tg-main-display', 'Autumn maple by the conference room', 'autumn', 865, 251, 106, 371,
        { layer: 'floor', focal: true, footprint: corner }),
      prop('tg-lobby-plant', 'Autumn foliage at reception', 'autumn', 357, 144, 68, 220,
        { layer: 'floor', replaces: 'lobby-plant' }),
      prop('tg-floor-plant', 'Autumn foliage in the main office', 'autumn', 850, 704, 70, 783,
        { layer: 'floor', replaces: 'bottom-plant' }),
      prop('tg-reception', 'Reception harvest arrangement', 'harvest', 155, 303, 46, 334),
      drawn('tg-hay', 'Harvest hay display', 'hayDisplay', 270, 128, 86, 80, 206,
        { layer: 'floor', footprint: { x: 276, y: 186, w: 74, h: 18 } }),
      drawn('tg-scarecrow', 'Office scarecrow', 'scarecrow', 228, 112, 44, 92, 204,
        { layer: 'floor', footprint: { x: 240, y: 190, w: 20, h: 12 } }),
      drawn('tg-turkey', 'Potluck turkey', 'turkey', 1108, 486, 58, 42, 526),
      drawn('tg-cornucopia', 'Cornucopia', 'cornucopia', 1206, 196, 48, 36, 226),
    ],
  },
  christmas: {
    id: 'christmas', label: 'Christmas', provisional: false,
    ui: { '--theme-accent': '#355e4d', '--theme-header': '#eef2ed', '--theme-controls': '#e5ece3' },
    decorations: [
      drawn('xm-tree', 'Christmas tree in the main office', 'tree', 846, 180, 136, 196, 374,
        { layer: 'floor', focal: true, footprint: corner }),
      drawn('xm-snowman', 'Lobby snowman', 'snowman', 290, 140, 46, 68, 204,
        { layer: 'floor', footprint: { x: 296, y: 186, w: 34, h: 18 } }),
      drawn('xm-lobby-plant', 'Poinsettia at reception', 'poinsettia', 360, 158, 50, 70, 226,
        { layer: 'floor', replaces: 'lobby-plant' }),
      drawn('xm-floor-plant', 'Poinsettia in the main office', 'poinsettia', 852, 718, 56, 74, 790,
        { layer: 'floor', replaces: 'bottom-plant' }),
      drawn('xm-kitchen', 'Gingerbread house and cookies', 'treats', 1106, 487, 62, 44, 526),
      prop('xm-reception', 'Reception holiday centerpiece', 'candles', 162, 308, 34, 332),
      prop('xm-lounge', 'Lounge holiday centerpiece', 'candles', 1214, 188, 34, 212),
    ],
  },
};

export const decorationDepth = deco => Math.round(deco.baseline) + DEPTH_BIAS;
export const actorDepth = y => Math.round(y) + DEPTH_BIAS;
export const worldToScreen = (worldPx, roomPx, worldSpan) => worldPx / worldSpan * roomPx;
export const replaceTarget = deco => Object.values(PLANT_ANCHORS).find(a => a.id === deco?.replaces) || null;
export const normalizeThemeId = value => THEME_IDS.includes(value) ? value : 'everyday';
export const getTheme = id => THEMES[normalizeThemeId(id)];
export const themeObstacles = id => getTheme(id).decorations.filter(d => d.footprint).map(d => ({ ...d.footprint }));

export function readStoredTheme() {
  try { return normalizeThemeId(localStorage.getItem(THEME_STORAGE_KEY)); }
  catch { return 'everyday'; }
}
export function storeTheme(id) {
  const themeId = normalizeThemeId(id);
  try { localStorage.setItem(THEME_STORAGE_KEY, themeId); } catch { /* session-only */ }
  return themeId;
}
