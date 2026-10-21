import { SETTINGS } from './office-settings.js';

// All coordinates describe the approved 1536 × 1024 office artwork, in pixels.
// Floors are an explicit whitelist. A room connection exists only at a doorway.
export const WIDTH = 1536;
export const HEIGHT = 1024;
export const CELL = 8;
export const RADIUS = 7;
export const BACKGROUND = '/assets/branch-office-v6-world.png';
export const ATLAS = '/assets/branch-coworkers.png';

export const FLOORS = [
  { id: 'lobby', x: 47, y: 116, w: 364, h: 241 },
  { id: 'main', x: 47, y: 351, w: 934, h: 416 },
  { id: 'lower-main', x: 348, y: 759, w: 556, h: 37 },
  { id: 'manager', x: 436, y: 84, w: 255, h: 227 },
  { id: 'manager-door', x: 436, y: 292, w: 33, h: 69 },
  { id: 'meeting', x: 727, y: 86, w: 316, h: 224 },
  { id: 'meeting-door', x: 714, y: 292, w: 51, h: 70 },
  { id: 'kitchen', x: 1008, y: 462, w: 236, h: 161 },
  { id: 'kitchen-door', x: 965, y: 480, w: 60, h: 47 },
  { id: 'annex-door', x: 1233, y: 580, w: 59, h: 43 },
  { id: 'annex', x: 1279, y: 367, w: 207, h: 350 },
  { id: 'break', x: 1070, y: 112, w: 417, h: 214 },
  { id: 'break-door', x: 1263, y: 309, w: 40, h: 97 },
];

export const OBSTACLES = [
  { id: 'waiting-chairs', x: 47, y: 208, w: 52, h: 161 },
  { id: 'lobby-coat-rack', x: 186, y: 135, w: 38, h: 76 },
  { id: 'lobby-plant', x: 369, y: 165, w: 40, h: 70 },
  { id: 'reception-front', x: 177, y: 304, w: 49, h: 213 },
  { id: 'reception-north', x: 120, y: 313, w: 75, h: 52 },
  { id: 'reception-south', x: 121, y: 456, w: 83, h: 62 },
  { id: 'reception-chair', x: 110, y: 402, w: 42, h: 50 },
  { id: 'left-mail', x: 47, y: 368, w: 39, h: 140 },
  { id: 'copier', x: 47, y: 511, w: 62, h: 96 },
  { id: 'left-files', x: 47, y: 642, w: 66, h: 111 },
  { id: 'accounting', x: 147, y: 534, w: 106, h: 159 },
  { id: 'accounting-left-chair', x: 123, y: 560, w: 34, h: 62 },
  { id: 'accounting-right-chair', x: 245, y: 551, w: 25, h: 62 },
  { id: 'sales-west', x: 402, y: 423, w: 181, h: 192 },
  { id: 'sales-west-left-chairs', x: 391, y: 479, w: 33, h: 123 },
  { id: 'sales-west-right-chair', x: 574, y: 475, w: 25, h: 61 },
  { id: 'sales-east', x: 660, y: 415, w: 183, h: 220 },
  { id: 'sales-east-left-chairs', x: 650, y: 448, w: 29, h: 153 },
  { id: 'sales-east-front-chair', x: 682, y: 592, w: 48, h: 56 },
  { id: 'sales-east-right-chair', x: 829, y: 448, w: 23, h: 73 },
  { id: 'bottom-desks', x: 465, y: 688, w: 287, h: 72 },
  { id: 'bottom-left-chair', x: 498, y: 750, w: 45, h: 45 },
  { id: 'bottom-right-chair', x: 668, y: 750, w: 45, h: 45 },
  { id: 'bottom-plant', x: 865, y: 715, w: 38, h: 79 },
  { id: 'right-files', x: 892, y: 420, w: 45, h: 190 },
  { id: 'water-cooler', x: 942, y: 536, w: 39, h: 101 },
  { id: 'restroom-block', x: 911, y: 669, w: 360, h: 258 },
  { id: 'manager-shelf', x: 440, y: 102, w: 53, h: 92 },
  { id: 'manager-cabinet', x: 493, y: 134, w: 36, h: 61 },
  { id: 'manager-desk', x: 496, y: 196, w: 139, h: 45 },
  { id: 'manager-seat', x: 548, y: 149, w: 42, h: 45 },
  { id: 'manager-left-guest-chair', x: 507, y: 264, w: 35, h: 34 },
  { id: 'manager-right-guest-chair', x: 577, y: 264, w: 35, h: 34 },
  { id: 'manager-files', x: 666, y: 118, w: 28, h: 174 },
  { id: 'glass-plant', x: 653, y: 307, w: 44, h: 57 },
  { id: 'meeting-seats', x: 772, y: 195, w: 185, h: 106 },
  { id: 'meeting-shelf', x: 980, y: 135, w: 42, h: 60 },
  { id: 'meeting-plant', x: 1016, y: 129, w: 34, h: 71 },
  { id: 'kitchen-table', x: 1069, y: 476, w: 138, h: 114 },
  { id: 'annex-desk', x: 1390, y: 416, w: 70, h: 119 },
  { id: 'annex-chair', x: 1347, y: 442, w: 47, h: 75 },
  { id: 'annex-shelf', x: 1455, y: 411, w: 38, h: 129 },
  { id: 'cubicle-back', x: 1320, y: 535, w: 170, h: 17 },
  { id: 'cubicle-side', x: 1320, y: 540, w: 10, h: 87 },
  // The front partition rises from y=713. Its painted top at y=659 is
  // foreground artwork, not the floor collision edge behind the panel.
  { id: 'cubicle-front', x: 1320, y: 713, w: 170, h: 8 },
  { id: 'cubicle-desk', x: 1351, y: 595, w: 131, h: 66 },
  { id: 'break-table', x: 1159, y: 165, w: 144, h: 141 },
  { id: 'vending', x: 1359, y: 125, w: 118, h: 124 },
  { id: 'break-plant', x: 1070, y: 135, w: 42, h: 74 },
  { id: 'break-shelf', x: 1451, y: 255, w: 40, h: 74 },
];

export const STATIONS = {
  manager: { x: 613, y: 173, facing: 'south', label: 'At the manager desk', kind: 'desk' },
  salesOne: { x: 377, y: 523, facing: 'east', label: 'At their desk', kind: 'desk' },
  salesTwo: { x: 617, y: 521, facing: 'west', label: 'At their desk', kind: 'desk' },
  reception: { x: 104, y: 472, facing: 'east', label: 'At reception', kind: 'desk' },
  support: { x: 1408, y: 697, facing: 'north', label: 'In the annex', kind: 'desk' },
  accounting: { x: 280, y: 624, facing: 'west', label: 'At their desk', kind: 'desk' },
  salesThree: { x: 869, y: 526, facing: 'west', label: 'At their desk', kind: 'desk' },
  operations: { x: 480, y: 785, facing: 'north', label: 'At their desk', kind: 'desk' },
  // Across the accounting desk from Angie, and across the sales desks from Stan.
  accountingTwo: { x: 130, y: 640, facing: 'north', label: 'At their desk', kind: 'desk' },
  salesFour: { x: 637, y: 478, facing: 'east', label: 'At their desk', kind: 'desk' },
  water: { x: 922, y: 642, facing: 'east', label: 'Getting water', kind: 'break' },
  // Lower in the copier nook so it stays reachable past Kelvin's chair.
  copy: { x: 126, y: 682, facing: 'west', label: 'Filing paperwork', kind: 'break' },
  coffee: { x: 1224, y: 487, facing: 'north', label: 'Making coffee', kind: 'break' },
  kitchen: { x: 1045, y: 567, facing: 'east', label: 'Taking a lunch break', kind: 'break' },
  meeting: { x: 1001, y: 254, facing: 'west', label: 'In the meeting room', kind: 'break' },
  lounge: { x: 1329, y: 275, facing: 'west', label: 'Taking a breather', kind: 'break' },
  vending: { x: 1432, y: 264, facing: 'north', label: 'At the vending machine', kind: 'break' },
};

// Named walkable waypoints for short safe circuits (not desks).
export const WAYPOINTS = {
  aisleWest: { x: 300, y: 400, facing: 'east', label: 'Walking the aisle', kind: 'waypoint' },
  aisleEast: { x: 780, y: 390, facing: 'west', label: 'Walking the aisle', kind: 'waypoint' },
  lobbyWalk: { x: 280, y: 250, facing: 'south', label: 'Crossing the lobby', kind: 'waypoint' },
  kitchenHall: { x: 990, y: 510, facing: 'east', label: 'Near the kitchen', kind: 'waypoint' },
};

// Brief face-to-face chats happen on the floor, away from chair reservations.
export const MEET_PAIRS = [
  {
    id: 'meetAisle',
    a: { id: 'meetAisleA', x: 330, y: 390, facing: 'east', label: 'Catching up', kind: 'meet' },
    b: { id: 'meetAisleB', x: 360, y: 390, facing: 'west', label: 'Catching up', kind: 'meet' },
  },
  {
    id: 'meetKitchen',
    a: { id: 'meetKitchenA', x: 1015, y: 540, facing: 'east', label: 'Catching up', kind: 'meet' },
    b: { id: 'meetKitchenB', x: 1045, y: 540, facing: 'west', label: 'Catching up', kind: 'meet' },
  },
  {
    id: 'meetLobby',
    a: { id: 'meetLobbyA', x: 250, y: 240, facing: 'east', label: 'Catching up', kind: 'meet' },
    b: { id: 'meetLobbyB', x: 280, y: 240, facing: 'west', label: 'Catching up', kind: 'meet' },
  },
];

// Short circuits use only named stations/waypoints already validated as walkable.
export const WALK_CIRCUITS = [
  ['aisleWest', 'aisleEast', 'water'],
  ['lobbyWalk', 'copy'],
  ['kitchenHall', 'coffee', 'lounge'],
];

// Whole-office gatherings (meetings, drills, parties). Spots are spaced wider
// than the 17px personal space so a full crew fits without blocking.
const spots = (prefix, label, list) => list.map(([x, y, facing, seat], index) =>
  ({ id: `${prefix}${index}`, x, y, facing, label, kind: 'event', ...(seat ? { seat } : {}) }));
export const EVENT_SPOTS = {
  meeting: spots('evMeeting', 'In the all-hands meeting', [
    // Presenter at the whiteboard, a seated front row, then standing room in the aisles.
    [870, 172, 'south'],
    [794, 186, 'north', { x: 794, y: 236, facing: 'north' }], [844, 186, 'north', { x: 844, y: 236, facing: 'north' }],
    [896, 186, 'north', { x: 894, y: 236, facing: 'north' }], [946, 186, 'north', { x: 943, y: 236, facing: 'north' }],
    [752, 240, 'east'], [978, 215, 'west'], [978, 268, 'west'], [1016, 242, 'west'],
  ]),
  lobby: spots('evLobby', 'Evacuating to the lobby', [
    [130, 250, 'south'], [165, 250, 'south'], [200, 250, 'south'], [235, 250, 'south'], [270, 250, 'south'],
    [305, 250, 'south'], [340, 250, 'south'], [150, 290, 'south'], [190, 290, 'south'], [230, 290, 'south'],
  ]),
  kitchen: spots('evKitchen', 'At the office party', [
    // Around the kitchen table: the near side, then both ends.
    [1085, 608, 'north'], [1135, 608, 'north'], [1185, 608, 'north'], [1035, 505, 'east'], [1227, 525, 'west'],
    [1035, 548, 'east'], [1227, 568, 'west'], [1035, 590, 'east'], [1227, 608, 'west'],
  ]),
};

export const DESTINATIONS = { ...STATIONS, ...WAYPOINTS };
for (const pair of MEET_PAIRS) {
  DESTINATIONS[pair.a.id] = pair.a;
  DESTINATIONS[pair.b.id] = pair.b;
}
for (const group of Object.values(EVENT_SPOTS)) for (const spot of group) DESTINATIONS[spot.id] = spot;

export function destinationOf(id) {
  return DESTINATIONS[id] || null;
}

// Ids stay stable (saved agent assignments use them); names and roles come from office-settings.js.
const named = person => ({ ...person, ...SETTINGS.coworkers?.[person.id] });
export const OFFICE_NAME = SETTINGS.office?.name || 'The Branch';
export const OFFICE_TAGLINE = SETTINGS.office?.tagline ?? 'Your agents, at work.';
export const CREW = [
  { id: 'mike', row: 0, home: 'manager', routine: ['water', 'meeting', 'coffee'] },
  { id: 'evan', row: 1, home: 'salesOne', routine: ['coffee', 'copy', 'lounge'] },
  { id: 'graham', row: 2, home: 'salesTwo', routine: ['copy', 'water', 'meeting'] },
  { id: 'june', row: 3, home: 'reception', routine: ['water', 'copy', 'kitchen'] },
  { id: 'priya', row: 4, home: 'support', routine: ['lounge', 'coffee', 'kitchen'] },
  { id: 'ellie', row: 5, home: 'accounting', routine: ['copy', 'water', 'coffee'] },
  { id: 'harris', row: 6, home: 'salesThree', routine: ['kitchen', 'water', 'lounge'] },
  { id: 'nora', row: 7, home: 'salesFour', routine: ['coffee', 'copy', 'meeting'] },
  // Kelvin has no painted artwork; office-kelvin.js draws him in code. He keeps a snack habit.
  { id: 'kelvin', row: 8, sprite: 'kelvin', home: 'accountingTwo', routine: ['kitchen', 'water', 'coffee'],
    habit: { to: 'vending', every: { normal: [240, 360], demo: [150, 240] }, first: [45, 90], stay: [10, 18] } },
].map(named);

// Navigation ends at the clear approach point above. Only a reserved chair's
// docking animation enters its footprint; chairs never become walkable shortcuts.
export const SEATS = {
  manager: { x: 567, y: 203, facing: 'south' },
  salesOne: { x: 410, y: 530, facing: 'east', occluders: [[[405, 500], [451, 500], [451, 541], [405, 534]]] },
  salesTwo: { x: 580, y: 530, facing: 'west', occluders: [[[545, 502], [578, 502], [578, 541], [545, 541]]] },
  reception: { x: 140, y: 455, facing: 'east', occluders: [[[156, 430], [192, 430], [192, 470], [156, 470]]] },
  support: { x: 1408, y: 697, facing: 'north' },
  accounting: { x: 248, y: 610, facing: 'west', occluders: [[[222, 585], [246, 585], [246, 630], [222, 630]]] },
  salesThree: { x: 832, y: 508, facing: 'west', occluders: [[[797, 481], [832, 481], [832, 522], [797, 522]]] },
  operations: { x: 522, y: 784, facing: 'north' },
  accountingTwo: { x: 149, y: 610, facing: 'east', occluders: [[[157, 585], [181, 585], [181, 630], [157, 630]]] },
  salesFour: { x: 676, y: 500, facing: 'east', occluders: [[[680, 474], [711, 474], [711, 515], [680, 515]]] },
  kitchen: { x: 1093, y: 570, facing: 'east' },
  meeting: { x: 943, y: 289, facing: 'north' },
  lounge: { x: 1268, y: 290, facing: 'west' },
};
export const SEATED_ATLAS = '/assets/branch-coworkers-seated-v2.png';
export const POSE_SUPPORT = { stand: true, sit: true };

export function seatFor(p) {
  const station = STATIONS[p.station] || DESTINATIONS[p.station];
  const seat = SEATS[p.station] || station?.seat;
  return station && seat && Math.hypot(p.x - station.x, p.y - station.y) < 1.25 ? seat : null;
}

export function seatedPosition(p) {
  const seat = seatFor(p), blend = seat ? (p.seatBlend || 0) : 0;
  return { x: p.x + ((seat?.x ?? p.x) - p.x) * blend,
    y: p.y + ((seat?.y ?? p.y) - p.y) * blend, seat, blend };
}

const inside = (p, r) => p.x >= r.x && p.y >= r.y && p.x <= r.x + r.w && p.y <= r.y + r.h;
const offsets = radius => [-radius, 0, radius].flatMap(x => [-radius, 0, radius].map(y => ({ x, y })));
const footprint = offsets(RADIUS);
const expand = (r, radius) => ({ x: r.x - radius, y: r.y - radius, w: r.w + radius * 2, h: r.h + radius * 2 });
const paddedObstacles = OBSTACLES.map(r => expand(r, RADIUS));
export function isWalkable(p, radius = RADIUS) {
  const blocks = radius === RADIUS ? paddedObstacles : OBSTACLES.map(r => expand(r, radius));
  if (blocks.some(r => inside(p, r))) return false;
  for (const offset of radius === RADIUS ? footprint : offsets(radius)) {
    if (!FLOORS.some(r => inside({ x: p.x + offset.x, y: p.y + offset.y }, r))) return false;
  }
  return true;
}

// Clip an entire segment against a rectangle, returning the covered interval.
// Exact swept footprints avoid the corner gaps left by point sampling.
function clip(a, b, r) {
  let from = 0, to = 1;
  for (const [axis, size] of [['x', 'w'], ['y', 'h']]) {
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-10) {
      if (a[axis] < r[axis] || a[axis] > r[axis] + r[size]) return null;
    } else {
      const first = (r[axis] - a[axis]) / delta, last = (r[axis] + r[size] - a[axis]) / delta;
      from = Math.max(from, Math.min(first, last)); to = Math.min(to, Math.max(first, last));
      if (from > to) return null;
    }
  }
  return [from, to];
}

export function segmentClear(a, b) {
  if (paddedObstacles.some(r => clip(a, b, r))) return false;
  for (const offset of footprint) {
    const start = { x: a.x + offset.x, y: a.y + offset.y }, end = { x: b.x + offset.x, y: b.y + offset.y };
    const intervals = FLOORS.map(r => clip(start, end, r)).filter(Boolean).sort((x, y) => x[0] - y[0]);
    let covered = 0;
    for (const [from, to] of intervals) {
      if (from > covered + 1e-9) return false;
      covered = Math.max(covered, to);
      if (covered >= 1) break;
    }
    if (covered < 1) return false;
  }
  return true;
}

// A* on a small, collision-checked grid. Diagonal moves cannot cut corners.
export function createNavigator(extraObstacles = []) {
  const extra = extraObstacles.map(r => expand(r, RADIUS));
  const walkable = p => isWalkable(p) && !extra.some(r => inside(p, r));
  const clearSegment = (a, b) => segmentClear(a, b) && !extra.some(r => clip(a, b, r));
  const cols = Math.ceil(WIDTH / CELL), rows = Math.ceil(HEIGHT / CELL);
  const grid = new Uint8Array(cols * rows);
  const point = id => ({ x: (id % cols) * CELL + CELL / 2, y: Math.floor(id / cols) * CELL + CELL / 2 });
  for (let i = 0; i < grid.length; i++) grid[i] = walkable(point(i)) ? 1 : 0;
  function nearest(p, free, clear) {
    if (!walkable(p)) return -1;
    let result = -1, best = Infinity;
    const cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL);
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      const id = y * cols + x, q = point(id), d = Math.hypot(q.x - p.x, q.y - p.y);
      if (grid[id] && d < best && free(q) && clear(p, q)) { best = d; result = id; }
    }
    return result;
  }
  function findPath(start, end, avoid = []) {
    const free = p => avoid.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= 19);
    const clear = (a, b) => {
      if (!clearSegment(a, b)) return false;
      const n = Math.max(1, Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) / 4));
      for (let i = 0; i <= n; i++) if (!free({ x: a.x + (b.x - a.x) * i / n, y: a.y + (b.y - a.y) * i / n })) return false;
      return true;
    };
    if (!walkable(start) || !walkable(end)) return null;
    if (!free(end)) return null;
    if (clear(start, end)) return [{ ...start }, { ...end }];
    const from = nearest(start, free, clear), to = nearest(end, free, clear);
    if (from < 0 || to < 0) return null;
    const g = new Float64Array(grid.length).fill(Infinity);
    const prev = new Int32Array(grid.length).fill(-1);
    const closed = new Uint8Array(grid.length);
    const heap = [];
    const heuristic = id => { const p = point(id), q = point(to); return Math.hypot(p.x - q.x, p.y - q.y); };
    function push(id, cost) {
      let i = heap.length; heap.push({ id, cost });
      while (i > 0) { const p = (i - 1) >> 1; if (heap[p].cost <= cost) break; heap[i] = heap[p]; i = p; }
      heap[i] = { id, cost };
    }
    function pop() {
      const first = heap[0], last = heap.pop();
      if (heap.length) {
        let i = 0;
        while (i * 2 + 1 < heap.length) {
          let c = i * 2 + 1;
          if (c + 1 < heap.length && heap[c + 1].cost < heap[c].cost) c++;
          if (heap[c].cost >= last.cost) break;
          heap[i] = heap[c]; i = c;
        }
        heap[i] = last;
      }
      return first.id;
    }
    g[from] = 0; push(from, heuristic(from));
    while (heap.length) {
      const id = pop();
      if (closed[id]) continue;
      if (id === to) {
        const path = [{ ...end }];
        for (let at = to; at !== -1; at = prev[at]) path.push(point(at));
        path.push({ ...start }); path.reverse();
        // Smooth only where the complete segment passes the same collision map.
        const smooth = [path[0]];
        let i = 0;
        while (i < path.length - 1) {
          let j = path.length - 1;
          while (j > i + 1 && !clear(path[i], path[j])) j--;
          if (!clear(path[i], path[j])) return null;
          smooth.push(path[j]); i = j;
        }
        return smooth;
      }
      closed[id] = 1;
      const x = id % cols, y = Math.floor(id / cols);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || x + dx < 0 || x + dx >= cols || y + dy < 0 || y + dy >= rows) continue;
        const next = (y + dy) * cols + x + dx;
        if (!grid[next] || closed[next] || !free(point(next))) continue;
        if (dx && dy && (!grid[y * cols + x + dx] || !grid[(y + dy) * cols + x])) continue;
        if (!clear(point(id), point(next))) continue;
        const cost = g[id] + CELL * (dx && dy ? Math.SQRT2 : 1);
        if (cost >= g[next]) continue;
        g[next] = cost; prev[next] = id; push(next, cost + heuristic(next));
      }
    }
    return null;
  }
  return { findPath, grid, cols, rows, point, isWalkable: walkable, segmentClear: clearSegment };
}
