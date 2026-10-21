import { WIDTH, HEIGHT, BACKGROUND, ATLAS, SEATED_ATLAS, FLOORS, OBSTACLES, CREW, OFFICE_NAME, seatedPosition } from './world-map.js';
import { OfficeLife } from './office-life.js';
import { getTheme, normalizeThemeId, decorationDepth, actorDepth, replaceTarget, HOLIDAY_ATLAS, CLEAN_PLATE, PROP_FRAMES, themeObstacles } from './office-themes.js';
import { ART, HOLIDAYS, HolidayLayer, drawHat } from './office-holiday.js';
import { buildKelvin } from './office-kelvin.js';

const directions = { south: 0, west: 3, east: 6, north: 9 };
let spriteAssets;
function loadSprites() {
  if (!spriteAssets) spriteAssets = Promise.all([
    new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = ATLAS;
    }),
    fetch('/assets/branch-coworkers.frames.json').then(r => { if (!r.ok) throw Error('Sprite alignment could not load.'); return r.json(); }),
    new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = SEATED_ATLAS;
    }),
    fetch('/assets/branch-coworkers-seated-v2.frames.json').then(r => { if (!r.ok) throw Error('Seated sprite alignment could not load.'); return r.json(); }),
  ]).then(([atlas, frames, seatedAtlas, seatedFrames]) => {
    // Coworkers without painted artwork are drawn in code once, here.
    const variants = {};
    for (const member of CREW.filter(m => m.sprite)) variants[member.sprite] ??= DRAWN[member.sprite](member.row);
    return { atlas, frames, seatedAtlas, seatedFrames, variants };
  });
  return spriteAssets;
}

const DRAWN = { kelvin: buildKelvin };
// The body a coworker is drawn from: their row in the painted atlas, or a drawn sprite.
function bodyOf(sprites, p, seated) {
  const variant = p.sprite && sprites.variants[p.sprite];
  if (variant) return seated ? variant.sit : variant.stand;
  return seated ? { atlas: sprites.seatedAtlas, rows: sprites.seatedFrames.rows } : { atlas: sprites.atlas, rows: sprites.frames.rows };
}

export function stepWorld(life, dt, hidden) {
  if (hidden) return false;
  life.update(dt);
  return true;
}

const themeImages = new Map();
function loadThemeImage(src) {
  if (!themeImages.has(src)) {
    const image = new Image(); image.src = src;
    const ready = image.decode().then(() => image).catch(() => {
      themeImages.delete(src);
      throw new Error('Holiday artwork could not load. Your previous theme is still available.');
    });
    themeImages.set(src, ready);
  }
  return themeImages.get(src);
}

export async function paintPortrait(canvas, member) {
  const body = bodyOf(await loadSprites(), member, false);
  drawFrame(canvas, body.atlas, body.rows[member.row][0]);
}

function drawFrame(canvas, atlas, frame, seated = false, flip = false, hat = null, facing = 'south') {
  const context = canvas.getContext('2d');
  context.setTransform(canvas.width / 96, 0, 0, canvas.height / 128, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.clearRect(0, 0, 96, 128);
  // Drawn frames carry their own scale; painted frames fit the sprite box.
  const scale = frame.scale ?? Math.min(1, 90 / frame.w, (seated ? 98 : 120) / frame.h);
  const left = (96 - frame.w * scale) / 2, top = 125 - frame.h * scale;
  context.save();
  if (flip) { context.translate(96, 0); context.scale(-1, 1); }
  context.drawImage(atlas, frame.x, frame.y, frame.w, frame.h, left, top, frame.w * scale, frame.h * scale);
  context.restore();
  if (!hat) return;
  const head = headOf(atlas, frame);
  const x = left + head.x * scale;
  drawHat(context, hat, { x: flip ? 96 - x : x, top: top + head.top * scale, w: head.w * scale, facing, seated });
}

// Where the head sits in a sprite frame, measured once from its alpha.
const heads = new WeakMap();
function headOf(atlas, frame) {
  if (!heads.has(atlas)) heads.set(atlas, new Map());
  const cache = heads.get(atlas), key = `${frame.x}:${frame.y}`;
  if (cache.has(key)) return cache.get(key);
  let head = { x: frame.w / 2, top: 0, w: frame.w * .4 };
  try {
    const probe = document.createElement('canvas'); probe.width = frame.w; probe.height = frame.h;
    const c = probe.getContext('2d', { willReadFrequently: true });
    c.drawImage(atlas, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
    const { data } = c.getImageData(0, 0, frame.w, frame.h);
    const solid = (x, y) => data[(y * frame.w + x) * 4 + 3] > 140;
    let top = 0;
    while (top < frame.h && ![...Array(frame.w).keys()].some(x => solid(x, top))) top++;
    let min = frame.w, max = 0;
    for (let y = top; y < Math.min(frame.h, top + frame.h * .16); y++) for (let x = 0; x < frame.w; x++) if (solid(x, y)) { min = Math.min(min, x); max = Math.max(max, x); }
    if (max > min) head = { x: (min + max) / 2, top, w: max - min };
  } catch { /* keep the estimate */ }
  cache.set(key, head);
  return head;
}

function hideBehindFurniture(canvas, visual) {
  if (!visual.seat?.occluders?.length) return;
  const context = canvas.getContext('2d');
  context.save();
  // Canvas coordinates share the same world baseline as the actor button.
  context.translate(48, 125);
  context.scale(96 / 68, 96 / 68);
  context.translate(-visual.x, -visual.y);
  context.globalCompositeOperation = 'destination-out';
  for (const polygon of visual.seat.occluders) {
    context.beginPath();
    polygon.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath(); context.fill();
  }
  context.restore();
}

export class OfficeWorld {
  constructor(root, onSelect, onActivity, options = {}) {
    this.root = root;
    this.life = new OfficeLife(options.life || {});
    this.onActivity = onActivity;
    this.nodes = new Map();
    this.decoNodes = [];
    this.themeId = 'everyday';
    this.themeToken = 0;
    this.lastTime = null;
    this.lastNotice = 0;
    this.hats = {};
    root.replaceChildren();
    const map = document.createElement('img');
    map.className = 'office-map'; map.src = BACKGROUND;
    map.alt = `${OFFICE_NAME}: reception, workstations, meeting room, kitchen, break room and annex`;
    map.draggable = false;
    // The office name above the floor plan is text, so it follows office-settings.js.
    const title = document.createElement('div');
    title.className = 'map-title'; title.setAttribute('aria-hidden', 'true');
    title.textContent = OFFICE_NAME;
    root.append(map, title);
    this.map = map;
    for (const person of this.life.people) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'coworker'; button.dataset.personId = person.id;
      const shadow = document.createElement('span'); shadow.className = 'person-shadow';
      const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 256; canvas.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.className = 'person-name'; label.textContent = person.name;
      const dot = document.createElement('span'); dot.className = 'task-dot'; dot.setAttribute('aria-hidden', 'true');
      button.append(shadow, canvas, label, dot);
      button.addEventListener('click', () => onSelect(person.id));
      root.append(button);
      this.nodes.set(person.id, { button, canvas, frame: -1 });
    }
    // Foreground pieces retain their natural depth relative to each sprite.
    map.addEventListener('load', () => {
      const pieces = [
        [492, 196, 143, 52], [507, 750, 31, 27, 805],
        [469, 309, 220, 40], [766, 305, 278, 43], [1335, 659, 154, 59],
        [351, 795, 555, 90], [24, 768, 299, 83], [907, 854, 365, 71],
      ];
      for (const [x, y, w, h, depth] of pieces) {
        const layer = document.createElement('canvas'); layer.className = 'scene-foreground'; layer.width = w; layer.height = h;
        Object.assign(layer.style, { left: `${x / WIDTH * 100}%`, top: `${y / HEIGHT * 100}%`, width: `${w / WIDTH * 100}%`, height: `${h / HEIGHT * 100}%`, zIndex: actorDepth(depth ?? y + h) });
        layer.getContext('2d').drawImage(map, x, y, w, h, 0, 0, w, h); root.append(layer);
      }
    }, { once: true });
    this.ready = loadSprites().then(sprites => {
      this.sprites = sprites; this.atlas = sprites.atlas;
      root.dataset.ready = 'true'; this.render();
    }).catch(() => { root.dataset.ready = 'error'; onActivity?.('Character artwork could not load. Refresh the page.'); });
    this.debug = new URLSearchParams(location.search).has('nav');
    if (this.debug) this.addDebugMap();
    this.render();
    this.loop = this.loop.bind(this);
    this.animation = requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    const dt = this.lastTime == null ? 0 : Math.min((timestamp - this.lastTime) / 1000, .05);
    this.lastTime = timestamp;
    stepWorld(this.life, dt, document.hidden);
    if (!document.hidden && !this.life.paused) this.director?.tick(dt);
    if (!document.hidden) this.holiday?.tick(dt);
    this.render();
    if (timestamp - this.lastNotice > 500) { this.lastNotice = timestamp; this.onActivity?.(); }
    this.animation = requestAnimationFrame(this.loop);
  }

  render() {
    for (const p of this.life.people) {
      const node = this.nodes.get(p.id);
      const visual = seatedPosition(p);
      const seated = visual.blend > .15;
      node.button.style.left = `${visual.x / WIDTH * 100}%`;
      node.button.style.top = `${visual.y / HEIGHT * 100}%`;
      node.button.style.zIndex = actorDepth(visual.y);
      node.button.classList.toggle('seated', seated);
      node.button.classList.toggle('hatted', !!this.hats[p.id]);
      node.button.classList.toggle('selected', p.selected);
      node.button.classList.toggle('walking', p.mode === 'walk' && !p.selected && !this.life.paused);
      node.button.dataset.task = p.task;
      node.button.dataset.pose = p.pose || 'stand';
      node.button.dataset.seatBlend = visual.blend.toFixed(2);
      node.button.dataset.visualX = visual.x.toFixed(2); node.button.dataset.visualY = visual.y.toFixed(2);
      node.button.dataset.x = p.x.toFixed(2); node.button.dataset.y = p.y.toFixed(2);
      node.button.dataset.walkable = String(this.life.navigator.isWalkable(p));
      node.button.dataset.activity = this.life.activity(p);
      node.button.dataset.destination = p.destination;
      node.button.setAttribute('aria-label', `${p.name}, ${this.life.activity(p)}. Open conversation`);
      node.button.title = `${p.name} · ${this.life.activity(p)}`;
      const walking = p.path.length && !seated && !p.selected && !this.life.paused;
      const steps = [1, 0, 2, 0];
      // A glance at the documentary camera overrides the usual facing.
      const facing = p.lookUntil > this.life.time ? 'south' : seated ? visual.seat.facing : p.facing;
      const frame = seated ? directions[facing] / 3 : directions[facing] + (walking ? steps[Math.floor(p.walkTime / .16) % 4] : 0);
      const hat = this.hats[p.id] || null;
      const key = `${seated ? 'sit' : 'stand'}:${frame}:${hat}:${seated ? `${p.station}:${visual.x.toFixed(2)}:${visual.y.toFixed(2)}` : ''}`;
      if (this.atlas && key !== node.frame) {
        // Mike's generated east cell faces left; mirror the matching west profile.
        const flip = seated && p.row === 0 && facing === 'east';
        const body = bodyOf(this.sprites, p, seated);
        drawFrame(node.canvas, body.atlas, body.rows[p.row][seated && flip ? 1 : frame], seated, flip, hat, facing);
        if (seated) hideBehindFurniture(node.canvas, visual);
        node.frame = key;
      }
    }
  }

  clearDecorations() {
    for (const node of this.decoNodes) node.remove();
    this.decoNodes = [];
  }

  async setTheme(id) {
    const themeId = normalizeThemeId(id);
    const token = ++this.themeToken;
    const theme = getTheme(themeId);
    const needsPatch = theme.decorations.some(d => replaceTarget(d));
    const [atlas, clean] = await Promise.all([
      theme.decorations.some(d => d.sprite) ? loadThemeImage(HOLIDAY_ATLAS) : null,
      needsPatch ? loadThemeImage(CLEAN_PLATE) : null,
    ]);
    if (token !== this.themeToken) return null;
    const nodes = [], extras = { lights: [], glows: [] };
    const place = (node, rect, z) => {
      Object.assign(node.style, {
        left: `${rect.x / WIDTH * 100}%`, top: `${rect.y / HEIGHT * 100}%`,
        width: `${rect.w / WIDTH * 100}%`, height: `${rect.h / HEIGHT * 100}%`, zIndex: z,
      });
      node.setAttribute('aria-hidden', 'true');
      nodes.push(node);
    };
    for (const deco of theme.decorations) {
      const anchor = replaceTarget(deco);
      if (anchor) {
        const patch = document.createElement('canvas');
        patch.className = 'theme-patch'; patch.width = anchor.w; patch.height = anchor.h;
        const c = patch.getContext('2d');
        c.drawImage(clean, anchor.x, anchor.y, anchor.w, anchor.h, 0, 0, anchor.w, anchor.h);
        // Feather the outer two pixels only; this is a background repair, never an actor occluder.
        c.globalCompositeOperation = 'destination-in';
        const mask = c.createLinearGradient(0, 0, anchor.w, 0);
        mask.addColorStop(0, 'transparent'); mask.addColorStop(2 / anchor.w, '#000');
        mask.addColorStop(1 - 2 / anchor.w, '#000'); mask.addColorStop(1, 'transparent');
        c.fillStyle = mask; c.fillRect(0, 0, anchor.w, anchor.h);
        place(patch, anchor, 1);
      }
      const node = document.createElement('canvas');
      node.className = 'theme-deco'; node.dataset.decoId = deco.id;
      node.dataset.layer = deco.layer; node.dataset.baseline = String(deco.baseline);
      node.title = deco.title;
      if (deco.art) {
        // Drawn at 3× world pixels so it stays sharp when zoomed in.
        node.width = Math.ceil(deco.w * 3); node.height = Math.ceil(deco.h * 3);
        const c = node.getContext('2d'); c.scale(3, 3);
        const meta = ART[deco.art](c, deco.w, deco.h) || {};
        for (const l of meta.lights || []) extras.lights.push({ ...l, x: deco.x + l.x, y: deco.y + l.y });
        for (const g of meta.glows || []) extras.glows.push({ ...g, x: deco.x + g.x, y: deco.y + g.y });
      } else {
        const [sx, sy, sw, sh] = PROP_FRAMES[deco.sprite];
        node.width = sw; node.height = sh;
        node.getContext('2d').drawImage(atlas, sx, sy, sw, sh, 0, 0, sw, sh);
      }
      place(node, deco, decorationDepth(deco));
    }

    // Swap artwork and navigation together, only after every asset has loaded.
    if (!this.life.setObstacles(themeObstacles(themeId))) {
      throw new Error('A coworker is standing where the decorations go. Let them pass, then choose the theme again.');
    }
    // Lights, weather and tint are built only once the switch is certain.
    this.holiday ??= new HolidayLayer(this.root, { width: WIDTH, height: HEIGHT, depth: actorDepth });
    nodes.push(...this.holiday.build(themeId, extras));
    this.clearDecorations();
    this.root.append(...nodes);
    this.decoNodes = nodes;
    this.themeId = themeId;
    this.hats = HOLIDAYS[themeId]?.hats || {};
    this.root.dataset.theme = themeId;
    return theme;
  }

  select(id) { this.life.select(id); this.render(); }
  setTask(id, task) { this.life.setTask(id, task); this.render(); }
  setPaused(value) { this.life.paused = value; this.render(); }
  setDemoActivity(enabled) { this.life.setScheduleMode(enabled ? 'demo' : 'normal'); }
  activity(id) { const p = this.life.people.find(p => p.id === id); return p ? this.life.activity(p) : ''; }
  destroy() { ++this.themeToken; cancelAnimationFrame(this.animation); }

  addDebugMap() {
    const canvas = document.createElement('canvas'); canvas.width = WIDTH; canvas.height = HEIGHT; canvas.className = 'navigation-overlay';
    const c = canvas.getContext('2d');
    c.fillStyle = '#4be8a930'; for (const r of FLOORS) c.fillRect(r.x, r.y, r.w, r.h);
    c.fillStyle = '#ef476f80'; for (const r of OBSTACLES) c.fillRect(r.x, r.y, r.w, r.h);
    c.fillStyle = '#fcf086';
    for (const p of this.life.people) { c.beginPath(); c.arc(p.x, p.y, 7, 0, Math.PI * 2); c.fill(); }
    this.root.append(canvas);
  }
}
