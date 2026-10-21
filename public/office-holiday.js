// Holiday scenery drawn entirely in code: props, wall decor, string lights,
// ambient light, weather and costume hats. World coordinates match the
// 1536 × 1024 office artwork. Nothing here moves people or calls a provider.

const TAU = Math.PI * 2;

export function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- small painting helpers ----------
const OUTLINE = '#25302f';
function ellipse(c, x, y, rx, ry, fill, stroke, width = 1) {
  c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = width; c.strokeStyle = stroke; c.stroke(); }
}
function shadow(c, x, y, rx, ry = rx * .28) { ellipse(c, x, y, rx, ry, 'rgba(18,28,30,.28)'); }
function ball(c, x, y, r, light, dark, stroke = OUTLINE) {
  const g = c.createRadialGradient(x - r * .4, y - r * .45, r * .1, x, y, r);
  g.addColorStop(0, light); g.addColorStop(1, dark);
  ellipse(c, x, y, r, r, g, stroke, Math.max(.6, r * .09));
}
function shine(c, x, y, r) { ellipse(c, x - r * .35, y - r * .4, r * .28, r * .2, 'rgba(255,255,255,.75)'); }
// A box seen from the office camera: a lit top face above a darker front face.
function box(c, x, y, w, h, depth, color, top, ribbon) {
  c.fillStyle = color; c.fillRect(x, y - h, w, h);
  c.fillStyle = top; c.fillRect(x, y - h - depth, w, depth);
  c.lineWidth = .8; c.strokeStyle = OUTLINE; c.strokeRect(x, y - h - depth, w, h + depth);
  if (!ribbon) return;
  c.fillStyle = ribbon;
  c.fillRect(x + w / 2 - w * .07, y - h - depth, w * .14, h + depth);
  c.fillRect(x, y - h - depth / 2 - depth * .12, w, depth * .24);
  ellipse(c, x + w / 2 - w * .13, y - h - depth * .6, w * .13, depth * .32, ribbon, OUTLINE, .6);
  ellipse(c, x + w / 2 + w * .13, y - h - depth * .6, w * .13, depth * .32, ribbon, OUTLINE, .6);
}
function pumpkin(c, x, y, r, { color = '#e07a1f', dark = '#9c4310', face = false, stem = '#4d6b2a' } = {}) {
  const ry = r * .82;
  for (const dx of [-.55, .55, -.25, .25, 0]) {
    const g = c.createLinearGradient(x - r, y - ry, x + r, y + ry);
    g.addColorStop(0, color); g.addColorStop(1, dark);
    ellipse(c, x + dx * r, y, r * (dx ? .55 : .5), ry, g, OUTLINE, Math.max(.5, r * .06));
  }
  c.fillStyle = stem; c.fillRect(x - r * .09, y - ry - r * .28, r * .18, r * .32);
  if (face) {
    c.fillStyle = '#ffd25a';
    tri(c, x - r * .38, y - r * .12, r * .18); tri(c, x + r * .38, y - r * .12, r * .18);
    c.beginPath(); c.moveTo(x - r * .5, y + r * .2);
    for (let i = 0; i <= 6; i++) c.lineTo(x - r * .5 + i * r / 6, y + r * (i % 2 ? .48 : .28));
    c.lineTo(x + r * .5, y + r * .2); c.closePath(); c.fill();
  }
}
function tri(c, x, y, s) { c.beginPath(); c.moveTo(x - s, y + s * .6); c.lineTo(x + s, y + s * .6); c.lineTo(x, y - s * .7); c.closePath(); c.fill(); }
function star(c, x, y, r, fill) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = .7; c.strokeStyle = '#7a5410'; c.stroke();
}
function leaf(c, x, y, size, angle, color) {
  c.save(); c.translate(x, y); c.rotate(angle);
  c.beginPath(); c.moveTo(0, -size); c.quadraticCurveTo(size * .7, -size * .2, 0, size);
  c.quadraticCurveTo(-size * .7, -size * .2, 0, -size); c.fillStyle = color; c.fill();
  c.strokeStyle = 'rgba(60,30,10,.55)'; c.lineWidth = size * .08; c.beginPath(); c.moveTo(0, -size * .8); c.lineTo(0, size * .9); c.stroke();
  c.restore();
}
function sag(a, b, t, depth) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + Math.sin(Math.PI * t) * depth };
}

// ---------- floor and table props (local coordinates, baseline at the bottom) ----------
// Each returns optional lights/glows in local coordinates for the animated layer.
export const ART = {
  tree(c, w, h) {
    const r = rng(7), cx = w / 2, base = h * .86, lights = [], glows = [];
    shadow(c, cx, h * .95, w * .44, h * .05);
    const skirt = c.createRadialGradient(cx, h * .9, 2, cx, h * .9, w * .4);
    skirt.addColorStop(0, '#c2353a'); skirt.addColorStop(1, '#7c1a20');
    ellipse(c, cx, h * .9, w * .38, h * .06, skirt, OUTLINE, .8);
    ellipse(c, cx, h * .9, w * .38, h * .06, null, '#f3eee4', 1.6);
    c.fillStyle = '#5a3a22'; c.fillRect(cx - w * .04, base - h * .02, w * .08, h * .07);
    const tiers = [];
    for (let i = 0; i < 6; i++) {
      const t = i / 5, bottom = base - i * h * .128, half = w * .45 * (1 - t * .78), top = bottom - h * .22;
      tiers.push({ bottom, half, top });
      const g = c.createLinearGradient(cx - half, top, cx + half, bottom);
      g.addColorStop(0, '#3f7a4a'); g.addColorStop(.55, '#24563a'); g.addColorStop(1, '#143826');
      c.beginPath(); c.moveTo(cx, top);
      c.lineTo(cx + half, bottom - h * .01);
      for (let k = 8; k >= 0; k--) {
        const x = cx - half + (2 * half) * k / 8;
        c.quadraticCurveTo(x + half / 8, bottom + h * .025, x, bottom - h * .01);
      }
      c.closePath(); c.fillStyle = g; c.fill(); c.lineWidth = .9; c.strokeStyle = '#0f2a1c'; c.stroke();
      // Needle texture: short downward strokes, lighter on the lit left side.
      for (let k = 0; k < 70 + 30 * (5 - i); k++) {
        const v = r(), u = r() * 2 - 1, y = top + (bottom - top) * (.15 + .85 * v), span = half * (y - top) / (bottom - top);
        const x = cx + u * span * .95;
        c.strokeStyle = u < -.2 ? (r() < .5 ? '#5f9a5c' : '#4b8a52') : (r() < .5 ? '#2f6a43' : '#1d4a31');
        c.lineWidth = .9; c.beginPath(); c.moveTo(x, y); c.lineTo(x + u * 2.5, y + 3 + r() * 2); c.stroke();
      }
    }
    const inside = () => {
      const tier = tiers[Math.floor(r() * tiers.length)], v = .25 + .7 * r();
      const y = tier.top + (tier.bottom - tier.top) * v, span = tier.half * v * .82;
      return { x: cx + (r() * 2 - 1) * span, y };
    };
    // Gold bead garland swooping across the tiers.
    c.strokeStyle = '#e2b84a'; c.lineWidth = 1.4; c.setLineDash([1.6, 1.6]);
    for (const tier of tiers.slice(0, 5)) {
      c.beginPath(); c.moveTo(cx - tier.half * .8, tier.bottom - h * .07);
      c.quadraticCurveTo(cx, tier.bottom - h * .02, cx + tier.half * .8, tier.bottom - h * .1); c.stroke();
    }
    c.setLineDash([]);
    const colors = [['#ff6b6b', '#9e1b23'], ['#ffe08a', '#b8860b'], ['#e8eef5', '#8a9aa8'], ['#7fb5ff', '#24518f'], ['#d68cff', '#6b2a8f']];
    for (let i = 0; i < 26; i++) { const p = inside(), [l, d] = colors[i % colors.length]; ball(c, p.x, p.y, 2.4 + r() * 1.6, l, d, '#3a2a1a'); }
    for (let i = 0; i < 46; i++) lights.push({ ...inside(), color: ['#ffd86b', '#ff7070', '#79c2ff', '#9dff8a', '#fff4d6'][i % 5] });
    const topY = tiers.at(-1).top;
    star(c, cx, topY - 2, w * .08, '#f6c945');
    glows.push({ x: cx, y: topY - 2, r: w * .32, color: '255,214,110', strength: .55 });
    // Presents tucked around the base.
    box(c, cx - w * .44, h * .97, w * .2, h * .07, h * .04, '#a8262f', '#c94a4f', '#f2d27a');
    box(c, cx - w * .2, h * .99, w * .16, h * .06, h * .035, '#2f6b4f', '#4c8b6a', '#f4ede0');
    box(c, cx + w * .06, h * .985, w * .22, h * .08, h * .04, '#e8e1d2', '#fbf7ee', '#b6262e');
    box(c, cx + w * .3, h * .965, w * .15, h * .055, h * .035, '#2e4f8f', '#4d6fb0', '#e2b84a');
    return { lights, glows };
  },

  snowman(c, w, h) {
    const cx = w / 2;
    shadow(c, cx, h * .95, w * .42, h * .05);
    ellipse(c, cx, h * .94, w * .46, h * .07, '#f4f8fc', '#b9c8d8', .8);
    const snow = (y, r) => ball(c, cx, y, r, '#ffffff', '#bfcde0', '#7d93ad');
    snow(h * .78, w * .32); snow(h * .52, w * .24);
    c.strokeStyle = '#5a3d27'; c.lineWidth = 1.6;
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(cx + s * w * .2, h * .5); c.lineTo(cx + s * w * .48, h * .38); c.stroke();
      c.beginPath(); c.moveTo(cx + s * w * .4, h * .42); c.lineTo(cx + s * w * .46, h * .32); c.stroke();
    }
    snow(h * .3, w * .18);
    // Scarf, face, buttons, hat.
    c.fillStyle = '#c0313a'; c.fillRect(cx - w * .2, h * .38, w * .4, h * .045);
    c.fillRect(cx + w * .06, h * .4, w * .08, h * .14);
    c.fillStyle = '#f2e6d0'; for (let i = 0; i < 3; i++) c.fillRect(cx - w * .2 + i * w * .14, h * .385, w * .03, h * .035);
    for (const [x, y] of [[-.06, .27], [.06, .27]]) ellipse(c, cx + x * w, y * h, 1.4, 1.4, '#1c1c1c');
    c.fillStyle = '#ef7d22'; c.beginPath(); c.moveTo(cx, h * .3); c.lineTo(cx + w * .2, h * .32); c.lineTo(cx, h * .33); c.fill();
    for (const y of [.5, .58, .66]) ellipse(c, cx, y * h, 1.6, 1.6, '#1c1c1c');
    ellipse(c, cx, h * .17, w * .24, h * .025, '#1d1d22', OUTLINE, .6);
    c.fillStyle = '#25252b'; c.fillRect(cx - w * .14, h * .05, w * .28, h * .12);
    c.fillStyle = '#b8323a'; c.fillRect(cx - w * .14, h * .135, w * .28, h * .03);
    ellipse(c, cx, h * .05, w * .14, h * .02, '#33333a');
    return {};
  },

  cauldron(c, w, h) {
    const cx = w / 2;
    shadow(c, cx, h * .95, w * .44, h * .06);
    c.fillStyle = '#6b4226'; c.fillRect(cx - w * .32, h * .84, w * .64, h * .07);
    for (const s of [-1, 1]) { c.fillStyle = '#1c1c22'; c.fillRect(cx + s * w * .26 - 2, h * .74, 4, h * .2); }
    const body = c.createRadialGradient(cx - w * .12, h * .5, 2, cx, h * .6, w * .45);
    body.addColorStop(0, '#4a4a55'); body.addColorStop(1, '#101014');
    ellipse(c, cx, h * .6, w * .4, h * .27, body, '#050506', 1);
    ellipse(c, cx, h * .38, w * .42, h * .09, '#2a2a31', '#050506', 1);
    const brew = c.createRadialGradient(cx, h * .38, 1, cx, h * .38, w * .36);
    brew.addColorStop(0, '#d6ff7a'); brew.addColorStop(1, '#3aa22f');
    ellipse(c, cx, h * .385, w * .35, h * .065, brew);
    const r = rng(3);
    for (let i = 0; i < 7; i++) ellipse(c, cx + (r() - .5) * w * .5, h * (.37 + (r() - .5) * .05), 1.5 + r() * 2, 1.2 + r() * 1.5, null, '#efffc0', .7);
    return { glows: [{ x: cx, y: h * .36, r: w * .9, color: '140,255,90', strength: .5, flicker: 1 }, { x: cx, y: h * .88, r: w * .5, color: '255,150,60', strength: .45, flicker: 2 }] };
  },

  tombstones(c, w, h) {
    const r = rng(9);
    shadow(c, w * .5, h * .94, w * .5, h * .08);
    ellipse(c, w * .5, h * .9, w * .48, h * .1, '#4b5a3a');
    for (let i = 0; i < 26; i++) {
      const x = w * (.05 + r() * .9), y = h * (.84 + r() * .12);
      c.strokeStyle = r() < .5 ? '#6a7f45' : '#3e5229'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - .5) * 3, y - 4 - r() * 3); c.stroke();
    }
    const stone = (x, y, sw, sh, label) => {
      const g = c.createLinearGradient(x, y - sh, x + sw, y);
      g.addColorStop(0, '#b3b6ba'); g.addColorStop(1, '#6b7075');
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - sh + sw / 2);
      c.arc(x + sw / 2, y - sh + sw / 2, sw / 2, Math.PI, 0); c.lineTo(x + sw, y); c.closePath();
      c.fillStyle = g; c.fill(); c.lineWidth = .9; c.strokeStyle = OUTLINE; c.stroke();
      c.fillStyle = '#4a4f55'; c.font = `bold ${Math.round(sw * .3)}px Georgia, serif`; c.textAlign = 'center';
      c.fillText(label, x + sw / 2, y - sh * .45);
    };
    stone(w * .08, h * .86, w * .26, h * .5, 'RIP');
    stone(w * .4, h * .9, w * .3, h * .66, 'RIP');
    stone(w * .74, h * .87, w * .22, h * .42, '†');
    pumpkin(c, w * .36, h * .92, w * .07, { face: true });
    return { glows: [{ x: w * .36, y: h * .9, r: w * .25, color: '255,170,60', strength: .5, flicker: 3 }] };
  },

  hayDisplay(c, w, h) {
    const r = rng(11);
    shadow(c, w * .5, h * .95, w * .5, h * .07);
    // Corn stalks behind the bale.
    for (let i = 0; i < 11; i++) {
      const x = w * (.18 + i * .065), lean = (r() - .5) * 10;
      c.strokeStyle = i % 2 ? '#c8a76a' : '#a8884f'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(x, h * .62); c.quadraticCurveTo(x + lean * .5, h * .3, x + lean, h * .04); c.stroke();
      for (let k = 0; k < 3; k++) leaf(c, x + lean * (.3 + k * .2), h * (.45 - k * .12), 4, (r() - .5) * 2, '#cfae6d');
    }
    // Hay bale.
    c.fillStyle = '#d7b257'; c.fillRect(w * .08, h * .6, w * .84, h * .3);
    c.fillStyle = '#e8cc7a'; c.fillRect(w * .08, h * .5, w * .84, h * .1);
    c.lineWidth = .9; c.strokeStyle = OUTLINE; c.strokeRect(w * .08, h * .5, w * .84, h * .4);
    for (let i = 0; i < 90; i++) {
      const x = w * (.09 + r() * .82), y = h * (.52 + r() * .37);
      c.strokeStyle = r() < .5 ? '#b38d3b' : '#f0d88f'; c.lineWidth = .8;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - .5) * 7, y + (r() - .5) * 2); c.stroke();
    }
    c.strokeStyle = '#7a5a2a'; c.lineWidth = 1.2;
    for (const x of [.3, .7]) { c.beginPath(); c.moveTo(w * x, h * .5); c.lineTo(w * x, h * .9); c.stroke(); }
    pumpkin(c, w * .3, h * .5, w * .1);
    pumpkin(c, w * .55, h * .46, w * .14, { color: '#e98a2a' });
    pumpkin(c, w * .78, h * .52, w * .08, { color: '#f1e6c8', dark: '#b8a67a' });
    pumpkin(c, w * .14, h * .9, w * .09);
    pumpkin(c, w * .88, h * .92, w * .1, { color: '#d9662a' });
    ellipse(c, w * .62, h * .94, w * .06, w * .04, '#7c9a3a', OUTLINE, .5);
    ellipse(c, w * .7, h * .95, w * .05, w * .035, '#e6c23a', OUTLINE, .5);
    return {};
  },

  scarecrow(c, w, h) {
    const cx = w / 2, r = rng(23);
    shadow(c, cx, h * .96, w * .3, h * .03);
    c.fillStyle = '#6b4a2a'; c.fillRect(cx - 1.5, h * .3, 3, h * .66);
    c.fillRect(cx - w * .45, h * .36, w * .9, 3);
    // Plaid shirt with straw cuffs.
    c.fillStyle = '#b8323a'; c.fillRect(cx - w * .26, h * .34, w * .52, h * .3);
    c.fillRect(cx - w * .46, h * .34, w * .2, h * .09); c.fillRect(cx + w * .26, h * .34, w * .2, h * .09);
    c.strokeStyle = 'rgba(40,20,20,.55)'; c.lineWidth = .7;
    for (let x = -.24; x < .26; x += .08) { c.beginPath(); c.moveTo(cx + x * w, h * .34); c.lineTo(cx + x * w, h * .64); c.stroke(); }
    for (let y = .38; y < .64; y += .06) { c.beginPath(); c.moveTo(cx - w * .26, h * y); c.lineTo(cx + w * .26, h * y); c.stroke(); }
    c.fillStyle = '#3d5a8a'; c.fillRect(cx - w * .22, h * .64, w * .44, h * .12);
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
      c.strokeStyle = r() < .5 ? '#e6c46a' : '#c8a24a'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx + s * w * .46, h * .38); c.lineTo(cx + s * w * (.5 + r() * .06), h * (.36 + r() * .08)); c.stroke();
    }
    ball(c, cx, h * .24, w * .2, '#e2c48e', '#a8844a', '#5a4020');
    for (const d of [-1, 1]) { c.strokeStyle = '#2a1a10'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx + d * w * .1 - 1.5, h * .22 - 1.5); c.lineTo(cx + d * w * .1 + 1.5, h * .22 + 1.5); c.moveTo(cx + d * w * .1 + 1.5, h * .22 - 1.5); c.lineTo(cx + d * w * .1 - 1.5, h * .22 + 1.5); c.stroke(); }
    c.beginPath(); c.arc(cx, h * .26, w * .08, .2, Math.PI - .2); c.stroke();
    ellipse(c, cx, h * .13, w * .42, h * .04, '#d9b65a', OUTLINE, .7);
    c.fillStyle = '#c8a24a'; c.beginPath(); c.moveTo(cx - w * .2, h * .13); c.lineTo(cx - w * .12, h * .02); c.lineTo(cx + w * .12, h * .02); c.lineTo(cx + w * .2, h * .13); c.closePath(); c.fill();
    c.lineWidth = .7; c.strokeStyle = OUTLINE; c.stroke();
    c.fillStyle = '#8a3a2a'; c.fillRect(cx - w * .19, h * .1, w * .38, h * .025);
    return {};
  },

  turkey(c, w, h) {
    shadow(c, w * .5, h * .86, w * .48, h * .1);
    ellipse(c, w * .5, h * .7, w * .48, h * .22, '#eef0f2', '#8a9196', .9);
    ellipse(c, w * .5, h * .7, w * .4, h * .16, '#dfe3e6');
    const r = rng(5);
    for (let i = 0; i < 14; i++) ellipse(c, w * (.15 + r() * .7), h * (.62 + r() * .16), 1.6, 1.6, i % 2 ? '#b8262f' : '#4f7a32');
    const g = c.createRadialGradient(w * .42, h * .45, 2, w * .5, h * .55, w * .34);
    g.addColorStop(0, '#f0b45c'); g.addColorStop(.6, '#b86a25'); g.addColorStop(1, '#7a3e15');
    ellipse(c, w * .5, h * .55, w * .32, h * .22, g, '#4a2510', 1);
    for (const s of [-1, 1]) {
      ellipse(c, w * (.5 + s * .3), h * .42, w * .09, h * .1, '#b8702e', '#4a2510', .8);
      ellipse(c, w * (.5 + s * .38), h * .32, w * .05, h * .05, '#fbf3e4', '#8a7a60', .6);
    }
    shine(c, w * .5, h * .5, w * .22);
    return {};
  },

  pies(c, w, h) {
    const pie = (x, y, r, filling) => {
      ellipse(c, x, y + 1.5, r, r * .55, '#9aa0a6', OUTLINE, .6);
      ellipse(c, x, y, r * .95, r * .5, '#d9a35a', '#8a5a26', .7);
      ellipse(c, x, y, r * .78, r * .38, filling);
      c.strokeStyle = '#e8bb72'; c.lineWidth = 1.4;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * r * .28 - r * .2, y - r * .32); c.lineTo(x + k * r * .28 + r * .2, y + r * .32); c.stroke(); }
    };
    pie(w * .3, h * .62, w * .26, '#b5651d'); pie(w * .7, h * .7, w * .24, '#7a2533');
    return {};
  },

  cornucopia(c, w, h) {
    const r = rng(13);
    shadow(c, w * .5, h * .88, w * .48, h * .1);
    c.beginPath(); c.moveTo(w * .05, h * .35); c.quadraticCurveTo(w * .25, h * .95, w * .7, h * .8);
    c.lineTo(w * .62, h * .4); c.quadraticCurveTo(w * .3, h * .45, w * .05, h * .35); c.closePath();
    const g = c.createLinearGradient(0, h * .4, w * .7, h * .8); g.addColorStop(0, '#6b4520'); g.addColorStop(1, '#c08a45');
    c.fillStyle = g; c.fill(); c.lineWidth = .9; c.strokeStyle = OUTLINE; c.stroke();
    c.strokeStyle = 'rgba(60,35,10,.6)'; c.lineWidth = .7;
    for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(w * (.12 + i * .06), h * .4); c.lineTo(w * (.18 + i * .06), h * .86); c.stroke(); }
    ellipse(c, w * .66, h * .6, w * .1, h * .22, '#4a2c12');
    const fruit = [['#c8323a', '#7a1a20'], ['#e9a73a', '#9a5a12'], ['#7b4a9a', '#3e1f55'], ['#9fc34a', '#4f6d1a'], ['#e07a1f', '#9c4310']];
    for (let i = 0; i < 9; i++) { const [l, d] = fruit[i % fruit.length]; ball(c, w * (.68 + r() * .26), h * (.45 + r() * .4), w * (.06 + r() * .04), l, d); }
    leaf(c, w * .9, h * .4, 5, .8, '#d9662a'); leaf(c, w * .75, h * .3, 4, -.6, '#e6b23a');
    return {};
  },

  treats(c, w, h) {
    // Christmas kitchen spread: gingerbread house, cookies, eggnog.
    shadow(c, w * .5, h * .9, w * .48, h * .1);
    ellipse(c, w * .5, h * .78, w * .48, h * .16, '#c9a24a', '#7a5a1a', .8);
    box(c, w * .14, h * .78, w * .3, h * .26, h * .12, '#9a5a2a', '#b06e36');
    c.fillStyle = '#f8f4ea'; c.beginPath(); c.moveTo(w * .1, h * .52); c.lineTo(w * .29, h * .22); c.lineTo(w * .48, h * .52); c.closePath(); c.fill();
    c.strokeStyle = OUTLINE; c.lineWidth = .7; c.stroke();
    for (const [x, col] of [[.2, '#d23a3a'], [.29, '#3a9a4a'], [.38, '#e6c23a']]) ellipse(c, w * x, h * .58, 1.6, 1.6, col);
    c.fillStyle = '#fbf3e4'; c.fillRect(w * .26, h * .62, w * .07, h * .16);
    for (let i = 0; i < 5; i++) ball(c, w * (.56 + (i % 3) * .1), h * (.68 + Math.floor(i / 3) * .1), w * .05, '#e7b46a', '#a8692a');
    c.fillStyle = '#f6efdc'; c.fillRect(w * .82, h * .46, w * .1, h * .22);
    c.lineWidth = .7; c.strokeStyle = OUTLINE; c.strokeRect(w * .82, h * .46, w * .1, h * .22);
    return {};
  },

  candy(c, w, h) {
    // Halloween kitchen spread: candy bowl, caramel apples and a jack-o-lantern.
    shadow(c, w * .5, h * .9, w * .48, h * .1);
    ellipse(c, w * .32, h * .72, w * .26, h * .14, '#3a2a4a', OUTLINE, .8);
    const r = rng(17);
    for (let i = 0; i < 16; i++) ellipse(c, w * (.14 + r() * .36), h * (.62 + r() * .1), 2.2, 1.6, ['#ff8a2a', '#9b59d0', '#7ad04a', '#f2e04a', '#e8e8e8'][i % 5], OUTLINE, .4);
    for (let i = 0; i < 2; i++) {
      ball(c, w * (.62 + i * .14), h * .76, w * .07, '#d68a3a', '#7a3e15');
      c.strokeStyle = '#efe2c4'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(w * (.62 + i * .14), h * .7); c.lineTo(w * (.62 + i * .14), h * .55); c.stroke();
    }
    pumpkin(c, w * .82, h * .68, w * .12, { face: true });
    return { glows: [{ x: w * .82, y: h * .68, r: w * .4, color: '255,170,60', strength: .55, flicker: 4 }] };
  },

  skeleton(c, w, h) {
    // Sitting in a waiting-room chair, facing the room.
    const bone = '#efe8d6', edge = '#7a7364';
    c.lineCap = 'round';
    const line = (pts, width) => { c.strokeStyle = edge; c.lineWidth = width + 1.4; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(w * x, h * y) : c.moveTo(w * x, h * y)); c.stroke(); c.strokeStyle = bone; c.lineWidth = width; c.stroke(); };
    line([[.5, .32], [.5, .62]], 2.4);
    for (let i = 0; i < 4; i++) line([[.36 + i * .01, .38 + i * .05], [.64 - i * .01, .38 + i * .05]], 1.6);
    line([[.36, .36], [.2, .55], [.3, .7]], 2);
    line([[.64, .36], [.82, .5], [.9, .4]], 2);
    line([[.42, .64], [.38, .8], [.36, .97]], 2.2);
    line([[.58, .64], [.64, .8], [.66, .97]], 2.2);
    ellipse(c, w * .5, h * .64, w * .12, h * .04, bone, edge, .8);
    ball(c, w * .5, h * .2, w * .17, '#fbf7ec', '#cfc6ad', edge);
    ellipse(c, w * .43, h * .19, w * .05, h * .035, '#2a2522'); ellipse(c, w * .57, h * .19, w * .05, h * .035, '#2a2522');
    c.fillStyle = '#2a2522'; c.fillRect(w * .44, h * .27, w * .12, h * .015);
    // A party hat, because it is the office.
    c.fillStyle = '#ff8a2a'; c.beginPath(); c.moveTo(w * .4, h * .07); c.lineTo(w * .6, h * .07); c.lineTo(w * .52, -h * .08); c.closePath(); c.fill();
    return {};
  },

  poinsettia(c, w, h) {
    const r = rng(19);
    shadow(c, w * .5, h * .95, w * .4, h * .06);
    c.fillStyle = '#c99a2e'; c.beginPath(); c.moveTo(w * .25, h * .62); c.lineTo(w * .75, h * .62); c.lineTo(w * .67, h * .94); c.lineTo(w * .33, h * .94); c.closePath(); c.fill();
    c.lineWidth = .8; c.strokeStyle = OUTLINE; c.stroke();
    ellipse(c, w * .5, h * .62, w * .26, h * .04, '#e2b84a', OUTLINE, .7);
    for (let i = 0; i < 9; i++) leaf(c, w * (.5 + (r() - .5) * .7), h * (.45 + r() * .18), w * .14, r() * TAU, '#2f6a3a');
    for (let k = 0; k < 3; k++) {
      const x = w * (.32 + k * .18), y = h * (.28 + (k % 2) * .1);
      for (let i = 0; i < 6; i++) leaf(c, x + Math.cos(i * TAU / 6) * w * .09, y + Math.sin(i * TAU / 6) * w * .07, w * .1, i * TAU / 6 + Math.PI / 2, i % 2 ? '#c41e2a' : '#e0323c');
      ellipse(c, x, y, 2, 2, '#f2d24a');
    }
    return {};
  },
};

// ---------- wall decorations (drawn once onto a full-map canvas, world coordinates) ----------
function stringPath(c, a, b, depth, color = '#2a2f2a', width = .8) {
  c.strokeStyle = color; c.lineWidth = width; c.beginPath();
  for (let i = 0; i <= 24; i++) { const p = sag(a, b, i / 24, depth); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); }
  c.stroke();
}
const DECOR = {
  garland(c, { from, to, depth = 6, bows = '#b8262f' }) {
    const r = rng(from[0] * 7 + to[0]), a = { x: from[0], y: from[1] }, b = { x: to[0], y: to[1] };
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2.2);
    for (let i = 0; i <= n; i++) {
      const p = sag(a, b, i / n, depth);
      ellipse(c, p.x + (r() - .5) * 2, p.y + (r() - .5) * 2, 3.4, 2.6, ['#1d4a31', '#2f6a43', '#24563a', '#3f7a4a'][i % 4]);
    }
    for (let t = 0; t <= 1.001; t += .25) {
      const p = sag(a, b, t, depth);
      ellipse(c, p.x - 3, p.y - 1, 3, 2.2, bows, OUTLINE, .5); ellipse(c, p.x + 3, p.y - 1, 3, 2.2, bows, OUTLINE, .5);
      c.fillStyle = bows; c.fillRect(p.x - 1, p.y, 2, 5);
    }
  },
  leafGarland(c, { from, to, depth = 6 }) {
    const r = rng(from[0] * 3 + to[1]), a = { x: from[0], y: from[1] }, b = { x: to[0], y: to[1] };
    stringPath(c, a, b, depth, '#6b4a2a', 1);
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 5);
    for (let i = 0; i <= n; i++) {
      const p = sag(a, b, i / n, depth);
      leaf(c, p.x + (r() - .5) * 3, p.y + (r() - .5) * 3, 3.6, r() * TAU, ['#d9662a', '#b8323a', '#e6b23a', '#a8572a', '#c8862a'][i % 5]);
    }
  },
  bunting(c, { from, to, depth = 5, colors, letters = '' }) {
    const a = { x: from[0], y: from[1] }, b = { x: to[0], y: to[1] };
    stringPath(c, a, b, depth, '#3a332a', .9);
    const count = letters ? letters.length : Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 11);
    for (let i = 0; i < count; i++) {
      const t = (i + .5) / count, p = sag(a, b, t, depth), s = letters ? 6.2 : 5;
      c.fillStyle = colors[i % colors.length];
      c.beginPath(); c.moveTo(p.x - s, p.y); c.lineTo(p.x + s, p.y); c.lineTo(p.x, p.y + s * 1.7); c.closePath(); c.fill();
      c.lineWidth = .5; c.strokeStyle = OUTLINE; c.stroke();
      if (letters && letters[i] !== ' ') {
        c.fillStyle = '#fffaf0'; c.font = 'bold 6.5px Georgia, serif'; c.textAlign = 'center'; c.fillText(letters[i], p.x, p.y + 6);
      }
    }
  },
  wreath(c, { at: [x, y], r = 11 }) {
    const rr = rng(x + y);
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * TAU, d = r * (.8 + rr() * .3);
      ellipse(c, x + Math.cos(a) * d, y + Math.sin(a) * d, 3, 2.4, ['#1d4a31', '#2f6a43', '#3f7a4a'][i % 3]);
    }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .3; ellipse(c, x + Math.cos(a) * r, y + Math.sin(a) * r, 1.4, 1.4, '#d23a3a'); }
    ellipse(c, x - 3.5, y + r, 3.4, 2.4, '#b8262f', OUTLINE, .5); ellipse(c, x + 3.5, y + r, 3.4, 2.4, '#b8262f', OUTLINE, .5);
    c.fillStyle = '#b8262f'; c.fillRect(x - 3, y + r, 2, 7); c.fillRect(x + 1, y + r, 2, 7);
  },
  mistletoe(c, { at: [x, y] }) {
    c.strokeStyle = '#b8262f'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x, y); c.stroke();
    for (let i = 0; i < 6; i++) leaf(c, x + (i - 2.5) * 2.4, y + 2 + Math.abs(i - 2.5), 3.2, (i - 2.5) * .5, '#5a8a3a');
    for (const dx of [-2, 0, 2]) ellipse(c, x + dx, y + 4, 1.5, 1.5, '#f7f4ea', '#9aa0a6', .4);
  },
  cobweb(c, { at: [x, y], dir: [dx, dy], size = 34 }) {
    c.strokeStyle = 'rgba(245,245,250,.6)'; c.lineWidth = .6;
    const spokes = 6, start = dx > 0 ? (dy > 0 ? 0 : -Math.PI / 2) : (dy > 0 ? Math.PI / 2 : Math.PI);
    const ends = [];
    for (let i = 0; i < spokes; i++) {
      const a = start + i / (spokes - 1) * Math.PI / 2, e = { x: x + Math.cos(a) * size, y: y + Math.sin(a) * size };
      ends.push(a); c.beginPath(); c.moveTo(x, y); c.lineTo(e.x, e.y); c.stroke();
    }
    for (let ring = 1; ring <= 5; ring++) {
      const d = size * ring / 5.5; c.beginPath();
      ends.forEach((a, i) => {
        const p = { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d };
        if (!i) c.moveTo(p.x, p.y);
        else { const m = (a + ends[i - 1]) / 2; c.quadraticCurveTo(x + Math.cos(m) * d * .85, y + Math.sin(m) * d * .85, p.x, p.y); }
      });
      c.stroke();
    }
  },
  spider(c, { at: [x, y], drop = 30 }) {
    c.strokeStyle = 'rgba(240,240,245,.7)'; c.lineWidth = .5; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + drop); c.stroke();
    c.strokeStyle = '#111'; c.lineWidth = .9;
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x, y + drop); c.quadraticCurveTo(x + s * 4, y + drop - 3 + i * 2, x + s * 6, y + drop + i * 2 - 1); c.stroke(); }
    ellipse(c, x, y + drop, 2.6, 3, '#151515'); ellipse(c, x, y + drop - 3, 1.7, 1.7, '#151515');
  },
  paperBats(c, { from, to, depth = 6 }) {
    const a = { x: from[0], y: from[1] }, b = { x: to[0], y: to[1] };
    stringPath(c, a, b, depth, 'rgba(30,30,30,.6)', .6);
    for (let t = .08; t < 1; t += .14) { const p = sag(a, b, t, depth); drawBat(c, p.x, p.y + 6, 5, .6); }
  },
  sign(c, { at: [x, y], text, fill = '#fffaf0', ink = '#3a2a1a', w = 70 }) {
    c.fillStyle = fill; c.fillRect(x - w / 2, y - 7, w, 14);
    c.lineWidth = .7; c.strokeStyle = OUTLINE; c.strokeRect(x - w / 2, y - 7, w, 14);
    c.fillStyle = ink; c.font = 'bold 8px Georgia, serif'; c.textAlign = 'center'; c.fillText(text, x, y + 3);
  },
  jack(c, { at: [x, y], r = 6 }) { pumpkin(c, x, y, r, { face: true }); },
};
export function drawBat(c, x, y, s, flap) {
  c.fillStyle = '#16131a';
  c.beginPath(); c.moveTo(x, y);
  c.quadraticCurveTo(x - s * .9, y - s * (1.2 * flap), x - s * 2.2, y - s * .2 * flap);
  c.quadraticCurveTo(x - s * 1.4, y + s * .2, x - s * .9, y + s * .5);
  c.quadraticCurveTo(x - s * .4, y + s * .2, x, y + s * .5);
  c.quadraticCurveTo(x + s * .4, y + s * .2, x + s * .9, y + s * .5);
  c.quadraticCurveTo(x + s * 1.4, y + s * .2, x + s * 2.2, y - s * .2 * flap);
  c.quadraticCurveTo(x + s * .9, y - s * (1.2 * flap), x, y);
  c.fill();
}

// ---------- the three holidays ----------
// Walls whose top edge carries string lights; railings carry garlands.
const WALL_RUNS = [
  [[54, 114], [410, 114]], [[434, 78], [690, 78]], [[714, 80], [1042, 80]],
  [[1062, 94], [1152, 94]], [[1157, 82], [1492, 82]], [[1006, 345], [1242, 345]], [[1314, 355], [1490, 355]],
];
const RAILINGS = [[[470, 309], [650, 309]], [[745, 309], [982, 309]]];
const RAIL_Y = 350;
// The world rectangle a wall decoration can paint into.
function boundsOf(kind, o) {
  if (o.from) {
    const [x1, y1] = o.from, [x2, y2] = o.to;
    return { x: Math.min(x1, x2) - 12, y: Math.min(y1, y2) - 12, w: Math.abs(x2 - x1) + 24, h: Math.abs(y2 - y1) + (o.depth ?? 6) + 30 };
  }
  const [x, y] = o.at;
  if (kind === 'cobweb') { const s = (o.size ?? 34) + 4; return { x: x - s, y: y - s, w: s * 2, h: s * 2 }; }
  if (kind === 'spider') return { x: x - 10, y: y - 2, w: 20, h: (o.drop ?? 30) + 12 };
  if (kind === 'mistletoe') return { x: x - 12, y: y - 16, w: 24, h: 26 };
  if (kind === 'sign') return { x: x - (o.w ?? 70) / 2 - 2, y: y - 9, w: (o.w ?? 70) + 4, h: 18 };
  const r = (o.r ?? 8) + 14;
  return { x: x - r, y: y - r, w: r * 2, h: r * 2 };
}
// Railing decor is in front of the glass; anything hung low over a doorway is overhead.
function layerOf(kind, { from, at }) {
  const y = (from || at)[1];
  if (kind === 'mistletoe' || kind === 'spider' && y > 300) return 'ceiling';
  return y > 290 && y < RAIL_Y ? 'rail' : 'wall';
}

export const HOLIDAYS = {
  everyday: null,
  christmas: {
    heading: { title: 'Happy holidays, team.' },
    lights: { colors: ['#ff4d4d', '#ffd84d', '#4dff88', '#4db8ff', '#ffffff'], runs: [...WALL_RUNS, ...RAILINGS] },
    particles: 'snow',
    decor: [
      ...RAILINGS.map(([from, to]) => ['garland', { from, to }]),
      ['garland', { from: [54, 116], to: [410, 116], depth: 7 }],
      ['wreath', { at: [139, 141], r: 12 }], ['wreath', { at: [757, 116] }], ['wreath', { at: [1110, 128] }], ['wreath', { at: [466, 112] }],
      ['bunting', { from: [795, 92], to: [950, 92], depth: 6, colors: ['#b8262f', '#2f6a43'], letters: 'HAPPY HOLIDAYS' }],
      ['mistletoe', { at: [992, 470] }],
    ],
    hats: { mike: 'santaSuit', evan: 'santa', graham: 'elf', june: 'santa', priya: 'santa', ellie: 'elf', harris: 'antlers', nora: 'santa', kelvin: 'santa' },
  },
  halloween: {
    heading: { title: 'Something’s off in accounting.' },
    lights: { colors: ['#ff8a1f', '#a64dff', '#7dff4d'], runs: [...WALL_RUNS, ...RAILINGS] },
    particles: 'bats',
    decor: [
      ...RAILINGS.map(([from, to]) => ['bunting', { from, to, colors: ['#ff8a1f', '#1d1a22', '#7a3ab8'] }]),
      ['paperBats', { from: [234, 120], to: [404, 120] }], ['paperBats', { from: [1160, 88], to: [1340, 88] }],
      ['bunting', { from: [800, 92], to: [946, 92], depth: 6, colors: ['#ff8a1f', '#1d1a22'], letters: 'HAPPY HALLOWEEN' }],
      ['cobweb', { at: [54, 114], dir: [1, 1] }], ['cobweb', { at: [690, 78], dir: [-1, 1], size: 30 }],
      ['cobweb', { at: [714, 80], dir: [1, 1], size: 30 }], ['cobweb', { at: [1492, 82], dir: [-1, 1], size: 40 }],
      ['cobweb', { at: [1242, 345], dir: [-1, 1], size: 26 }], ['cobweb', { at: [1314, 355], dir: [1, 1], size: 26 }],
      ['spider', { at: [1200, 345], drop: 34 }], ['spider', { at: [600, 78], drop: 26 }],
      ['jack', { at: [470, 300] }], ['jack', { at: [650, 300] }], ['jack', { at: [745, 300] }], ['jack', { at: [982, 300] }],
    ],
    glowsFromPainted: [{ x: 914, y: 350, r: 70, color: '255,160,50', strength: .55, flicker: 5 }, { x: 180, y: 322, r: 34, color: '255,160,50', strength: .45, flicker: 6 }],
    hats: { mike: 'vampire', evan: 'catEars', graham: 'horns', june: 'witch', priya: 'catEars', ellie: 'witch', harris: 'horns', nora: 'witch', kelvin: 'pumpkin' },
  },
  thanksgiving: {
    heading: { title: 'Pass the stuffing, please.' },
    lights: { colors: ['#ffc46b', '#ffdf9e', '#ff9a4d'], runs: WALL_RUNS },
    particles: 'leaves',
    decor: [
      ...RAILINGS.map(([from, to]) => ['leafGarland', { from, to }]),
      ['leafGarland', { from: [54, 117], to: [410, 117], depth: 7 }],
      ['bunting', { from: [818, 92], to: [930, 92], depth: 6, colors: ['#c8562a', '#e6b23a', '#8a4a2a'], letters: 'GIVE THANKS' }],
      ['bunting', { from: [1160, 92], to: [1340, 92], depth: 6, colors: ['#c8562a', '#e6b23a', '#8a4a2a', '#6b7a2a'] }],
    ],
    hats: { mike: 'turkey', evan: 'pilgrim', graham: 'pilgrim', june: 'leaves', priya: 'leaves', ellie: 'leaves', harris: 'pilgrim', nora: 'leaves', kelvin: 'pilgrim' },
  },
};

// ---------- the live holiday layer ----------
const SCALE = 2; // prop canvases render at 2× world pixels so they stay crisp when zoomed

export class HolidayLayer {
  constructor(root, { width, height, depth }) {
    this.root = root; this.width = width; this.height = height; this.depth = depth;
    this.nodes = []; this.time = 0; this.theme = null; this.lightTimer = 0;
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  place(node, x, y, w, h, z) {
    Object.assign(node.style, {
      position: 'absolute', left: `${x / this.width * 100}%`, top: `${y / this.height * 100}%`,
      width: `${w / this.width * 100}%`, height: `${h / this.height * 100}%`, zIndex: z, pointerEvents: 'none',
    });
    node.setAttribute('aria-hidden', 'true');
    this.nodes.push(node);
    return node;
  }

  // A canvas covering just one world rectangle, drawn in world coordinates.
  canvas(className, x, y, w, h, z, scale = SCALE) {
    const node = document.createElement('canvas');
    node.className = className; node.width = Math.ceil(w * scale); node.height = Math.ceil(h * scale);
    const c = node.getContext('2d'); c.scale(scale, scale); c.translate(-x, -y);
    return { node: this.place(node, x, y, w, h, z), c, box: { x, y, w, h } };
  }
  region(className, box, z, scale = SCALE) {
    return this.canvas(className, Math.floor(box.x), Math.floor(box.y), Math.ceil(box.w), Math.ceil(box.h), z, scale);
  }

  // Builds every layer for a theme. Returns the DOM nodes so the caller can swap atomically.
  build(themeId, extras = {}) {
    this.nodes = []; this.lights = []; this.glows = []; this.particles = [];
    const theme = HOLIDAYS[themeId];
    this.theme = theme; this.themeId = themeId;
    if (!theme) return [];
    // Wall decor sits just above the map. Railing decor sits in front of the glass railings
    // (people inside those rooms pass behind it), and ceiling decor hangs over everyone.
    // Each piece gets a canvas only as large as itself, which keeps memory low on phones.
    const z = { wall: 2, rail: this.depth(RAIL_Y), ceiling: 2100 };
    for (const [kind, options] of theme.decor) {
      const layer = layerOf(kind, options);
      DECOR[kind](this.region('holiday-decor', boundsOf(kind, options), z[layer]).c, options);
    }
    // Lights and glows reported by code-drawn props, already in world coordinates.
    for (const l of extras.lights || []) this.lights.push({ ...l });
    for (const g of extras.glows || []) this.glows.push({ ...g });
    for (const g of theme.glowsFromPainted || []) this.glows.push(g);
    // String lights along walls and railings.
    const r = rng(21);
    theme.lights.runs.forEach(([from, to], run) => {
      const a = { x: from[0], y: from[1] }, b = { x: to[0], y: to[1] }, n = Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 13);
      for (let i = 0; i <= n; i++) {
        const p = sag(a, b, i / n, 7);
        this.lights.push({ x: p.x, y: p.y + 2, color: theme.lights.colors[(i + run) % theme.lights.colors.length], group: `run${run}`, phase: r() * TAU });
      }
    });
    for (const l of this.lights) { l.phase ??= r() * TAU; l.group ??= 'props'; }
    // One small canvas per light string. Wall strings sit just above the wall decor,
    // railing strings in front of the glass, and lights on props above the props.
    this.lightGroups = [];
    for (const group of new Set(this.lights.map(l => l.group))) {
      const lights = this.lights.filter(l => l.group === group);
      const xs = lights.map(l => l.x), ys = lights.map(l => l.y);
      const box = { x: Math.min(...xs) - 6, y: Math.min(...ys) - 6, w: Math.max(...xs) - Math.min(...xs) + 12, h: Math.max(...ys) - Math.min(...ys) + 12 };
      const zIndex = group === 'props' ? 2000 : box.y > RAIL_Y - 60 && box.y < RAIL_Y ? this.depth(RAIL_Y) + 1 : 3;
      this.lightGroups.push({ lights, layer: this.region('holiday-lights', box, zIndex, 1.5) });
    }
    this.glowCanvas = this.canvas('holiday-glow', 0, 0, this.width, this.height, 4600, .5);
    this.glowCanvas.node.style.mixBlendMode = 'screen';
    this.fx = this.canvas('holiday-fx', 0, 0, this.width, this.height, 4700, 1);
    this.seedParticles(theme.particles);
    this.drawLights(0); this.drawGlows(0); this.drawParticles(0);
    return this.nodes;
  }

  seedParticles(kind) {
    const r = rng(33), W = this.width, H = this.height;
    if (kind === 'snow') for (let i = 0; i < 170; i++) this.particles.push({ x: r() * W, y: r() * H, s: .8 + r() * 2.2, v: 14 + r() * 26, sway: r() * TAU });
    if (kind === 'leaves') for (let i = 0; i < 34; i++) this.particles.push({ x: r() * W, y: r() * H, s: 3 + r() * 3, v: 16 + r() * 18, sway: r() * TAU, spin: r() * TAU, color: ['#d9662a', '#b8323a', '#e6b23a', '#a8572a'][i % 4] });
    if (kind === 'bats') {
      for (let i = 0; i < 6; i++) this.particles.push({ bat: true, x: r() * W, y: 120 + r() * 600, s: 5 + r() * 3, v: 50 + r() * 50, dir: r() < .5 ? -1 : 1, sway: r() * TAU });
      this.particles.push({ ghost: true, x: 860, y: 150, phase: 0 });
    }
  }

  // A heavier snowfall for a while (the "Snow day" scene).
  burst(seconds) {
    if (this.theme?.particles !== 'snow') return;
    const r = rng(Math.floor(this.time * 1000));
    for (let i = 0; i < 260; i++) this.particles.push({ x: r() * this.width, y: -r() * this.height, s: 1 + r() * 2.6, v: 30 + r() * 40, sway: r() * TAU, until: this.time + seconds });
  }

  tick(dt) {
    if (!this.theme) return;
    this.time += dt;
    this.lightTimer += dt;
    if (this.lightTimer > .12) { this.lightTimer = 0; this.drawLights(this.time); this.drawGlows(this.time); }
    if (!this.reduced) { this.stepParticles(dt); this.drawParticles(this.time); }
  }

  drawLights(t) {
    for (const { lights, layer: { c, box } } of this.lightGroups) {
      c.clearRect(box.x, box.y, box.w, box.h);
      for (const l of lights) {
        const on = this.reduced ? 1 : .55 + .45 * Math.sin(t * 2.4 + l.phase);
        c.globalAlpha = .25 * on; ellipse(c, l.x, l.y, 4.5, 4.5, l.color);
        c.globalAlpha = .5 + .5 * on; ellipse(c, l.x, l.y, 1.7, 1.9, l.color);
        c.globalAlpha = .8 * on; ellipse(c, l.x - .4, l.y - .5, .6, .6, '#fff');
      }
      c.globalAlpha = 1;
    }
  }

  drawGlows(t) {
    const c = this.glowCanvas.c;
    c.clearRect(0, 0, this.width, this.height);
    for (const g of this.glows) {
      const flick = g.flicker && !this.reduced ? .75 + .25 * Math.sin(t * 9 + g.flicker * 3) * Math.sin(t * 5.3 + g.flicker) : 1;
      const grad = c.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      grad.addColorStop(0, `rgba(${g.color},${g.strength * flick})`); grad.addColorStop(1, `rgba(${g.color},0)`);
      c.fillStyle = grad; c.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
    }
  }

  stepParticles(dt) {
    const W = this.width, H = this.height;
    for (const p of this.particles) {
      if (p.ghost) { p.phase += dt; p.x = 860 + Math.sin(p.phase * .35) * 120; p.y = 150 + Math.sin(p.phase * 1.3) * 10; continue; }
      if (p.bat) {
        p.x += p.dir * p.v * dt; p.sway += dt * 2; p.y += Math.sin(p.sway) * 18 * dt;
        if (p.x < -30) { p.x = W + 20; } if (p.x > W + 30) { p.x = -20; }
        continue;
      }
      p.y += p.v * dt; p.sway += dt; p.x += Math.sin(p.sway) * 12 * dt + (p.spin != null ? 10 * dt : 0);
      if (p.spin != null) p.spin += dt * 1.5;
      if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; if (p.until && this.time > p.until) p.dead = true; }
      if (p.x > W + 10) p.x = -10;
    }
    if (this.particles.some(p => p.dead)) this.particles = this.particles.filter(p => !p.dead);
  }

  // Snow, leaves and bats layer: cleared and redrawn each frame.
  drawParticles(t) {
    const c = this.fx.c;
    c.clearRect(0, 0, this.width, this.height);
    for (const p of this.particles) {
      if (p.ghost) { drawGhost(c, p.x, p.y, t); continue; }
      if (p.bat) { drawBat(c, p.x, p.y, p.s, .4 + .6 * Math.abs(Math.sin(t * 12 + p.sway))); continue; }
      if (p.spin != null) { leaf(c, p.x, p.y, p.s, p.spin, p.color); continue; }
      c.globalAlpha = .85; ellipse(c, p.x, p.y, p.s, p.s, '#ffffff'); c.globalAlpha = 1;
    }
  }
}

function drawGhost(c, x, y, t) {
  c.save(); c.globalAlpha = .82;
  const w = 22, h = 30;
  c.beginPath(); c.moveTo(x - w / 2, y + h * .4);
  c.quadraticCurveTo(x - w / 2, y - h / 2, x, y - h / 2); c.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y + h * .4);
  for (let i = 0; i <= 4; i++) c.lineTo(x + w / 2 - i * w / 4, y + h * .4 + (i % 2 ? -4 : 3) + Math.sin(t * 6 + i) * 1.5);
  c.closePath();
  const g = c.createLinearGradient(x, y - h / 2, x, y + h / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d9e2f2');
  c.fillStyle = g; c.fill();
  ellipse(c, x - 4, y - 4, 2, 2.8, '#1c1c28'); ellipse(c, x + 4, y - 4, 2, 2.8, '#1c1c28'); ellipse(c, x, y + 4, 2.4, 3, '#1c1c28');
  c.restore();
}

// ---------- costume hats, drawn on top of each coworker sprite ----------
// head: { x, top, w } in the 96 × 128 sprite canvas space.
// Recolors everything below the neck, keeping the sprite's own shading.
// Where the collar sits: the head box is measured from the hair, so standing frames need more room.
const neckOf = ({ top, w, seated }) => top + w * (seated ? 1.05 : 1.24);
function dressBody(c, head, color, alpha) {
  const neck = neckOf(head);
  c.save(); c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = alpha; c.fillStyle = color;
  c.fillRect(0, neck, 96, 128 * .93 - neck);
  c.restore();
}

export function drawHat(c, kind, head) {
  const { x, top, w, facing = 'south' } = head, s = w;
  c.save(); c.lineJoin = 'round';
  const outline = () => { c.lineWidth = Math.max(.8, s * .05); c.strokeStyle = OUTLINE; c.stroke(); };
  if (kind === 'santaSuit') {
    // Santa suit: red coat with white fur trim and a black belt, plus the hat. No beard, so his face stays visible.
    const neck = neckOf(head), bottom = 128 * .93, waist = neck + (bottom - neck) * .42;
    dressBody(c, head, '#c41e2a', .72);
    c.save(); c.globalCompositeOperation = 'source-atop';
    c.fillStyle = '#f8f5ee'; c.fillRect(0, neck, 96, s * .12);
    if (facing === 'south') c.fillRect(x - s * .09, neck, s * .18, waist - neck);
    c.fillStyle = '#1c1c20'; c.fillRect(0, waist, 96, s * .15);
    c.fillStyle = '#e9c43a'; c.fillRect(x - s * .11, waist - s * .02, s * .22, s * .19);
    c.fillStyle = '#f8f5ee'; c.fillRect(0, waist + s * .3, 96, s * .1);
    c.restore();
    c.restore();
    drawHat(c, 'santa', head);
    return;
  }
  if (kind === 'vampire') {
    // Count costume: a tall caped collar with red lining, and a black cape from behind.
    const neck = top + w * 1.05;
    dressBody(c, head, '#16131a', facing === 'north' ? .85 : .45);
    if (facing !== 'north') for (const d of facing === 'east' ? [-1] : facing === 'west' ? [1] : [-1, 1]) {
      c.beginPath(); c.moveTo(x + d * s * .25, neck + s * .05); c.lineTo(x + d * s * .9, top + s * .15); c.lineTo(x + d * s * .55, neck - s * .1); c.closePath();
      c.fillStyle = '#16131a'; c.fill(); outline();
      c.beginPath(); c.moveTo(x + d * s * .3, neck); c.lineTo(x + d * s * .78, top + s * .3); c.lineTo(x + d * s * .52, neck - s * .14); c.closePath();
      c.fillStyle = '#a3172a'; c.fill();
    }
    c.restore();
    return;
  }
  if (kind === 'santa' || kind === 'elf') {
    const base = top + s * .22, color = kind === 'santa' ? '#c8262f' : '#2f8a45', dark = kind === 'santa' ? '#7c121a' : '#185a2a';
    const g = c.createLinearGradient(x - s / 2, top - s * .4, x + s / 2, base); g.addColorStop(0, color); g.addColorStop(1, dark);
    c.beginPath(); c.moveTo(x - s * .55, base);
    if (kind === 'santa') { c.quadraticCurveTo(x - s * .2, top - s * .55, x + s * .25, top - s * .45); c.quadraticCurveTo(x + s * .55, top - s * .2, x + s * .72, top + s * .12); c.lineTo(x + s * .55, base); }
    else { c.quadraticCurveTo(x - s * .1, top - s * .5, x + s * .1, top - s * .95); c.quadraticCurveTo(x + s * .25, top - s * .3, x + s * .55, base); }
    c.closePath(); c.fillStyle = g; c.fill(); outline();
    c.beginPath(); c.roundRect(x - s * .62, base - s * .1, s * 1.24, s * .22, s * .1);
    c.fillStyle = kind === 'santa' ? '#f8f5ee' : '#e9c43a'; c.fill(); outline();
    if (kind === 'santa') ball(c, x + s * .72, top + s * .14, s * .14, '#ffffff', '#d8dde2');
    else ball(c, x + s * .1, top - s * .95, s * .12, '#ffe36b', '#b88a12');
  } else if (kind === 'antlers') {
    c.strokeStyle = '#6b4520'; c.lineWidth = Math.max(1.6, s * .1); c.lineCap = 'round';
    for (const d of [-1, 1]) {
      c.beginPath(); c.moveTo(x + d * s * .25, top + s * .15); c.lineTo(x + d * s * .45, top - s * .35); c.stroke();
      c.beginPath(); c.moveTo(x + d * s * .38, top - s * .15); c.lineTo(x + d * s * .65, top - s * .25); c.stroke();
      c.beginPath(); c.moveTo(x + d * s * .43, top - s * .3); c.lineTo(x + d * s * .32, top - s * .55); c.stroke();
    }
  } else if (kind === 'witch') {
    const brim = top + s * .2;
    ellipse(c, x, brim, s * .78, s * .16, '#1e1a26', OUTLINE, Math.max(.8, s * .05));
    c.beginPath(); c.moveTo(x - s * .4, brim); c.quadraticCurveTo(x - s * .1, top - s * .5, x + s * .35, top - s * .9);
    c.quadraticCurveTo(x + s * .15, top - s * .3, x + s * .4, brim); c.closePath(); c.fillStyle = '#2a2335'; c.fill(); outline();
    c.fillStyle = '#7a3ab8'; c.fillRect(x - s * .4, brim - s * .16, s * .8, s * .12);
    c.fillStyle = '#e9c43a'; c.fillRect(x - s * .08, brim - s * .17, s * .16, s * .14);
  } else if (kind === 'horns') {
    for (const d of [-1, 1]) {
      c.beginPath(); c.moveTo(x + d * s * .18, top + s * .12); c.quadraticCurveTo(x + d * s * .45, top - s * .05, x + d * s * .4, top - s * .4);
      c.quadraticCurveTo(x + d * s * .3, top - s * .05, x + d * s * .05, top + s * .16); c.closePath();
      c.fillStyle = '#c8262f'; c.fill(); outline();
    }
  } else if (kind === 'catEars') {
    for (const d of [-1, 1]) {
      c.beginPath(); c.moveTo(x + d * s * .1, top + s * .12); c.lineTo(x + d * s * .42, top - s * .32); c.lineTo(x + d * s * .5, top + s * .15); c.closePath();
      c.fillStyle = '#1d1a22'; c.fill(); outline();
      c.beginPath(); c.moveTo(x + d * s * .22, top + s * .08); c.lineTo(x + d * s * .4, top - s * .16); c.lineTo(x + d * s * .43, top + s * .1); c.closePath();
      c.fillStyle = '#f0a0b8'; c.fill();
    }
  } else if (kind === 'pumpkin') {
    pumpkin(c, x, top - s * .05, s * .42);
  } else if (kind === 'pilgrim') {
    const brim = top + s * .2;
    ellipse(c, x, brim, s * .72, s * .14, '#1c1c20', OUTLINE, Math.max(.8, s * .05));
    c.beginPath(); c.moveTo(x - s * .38, brim); c.lineTo(x - s * .3, top - s * .55); c.lineTo(x + s * .3, top - s * .55); c.lineTo(x + s * .38, brim); c.closePath();
    c.fillStyle = '#25252b'; c.fill(); outline();
    c.fillStyle = '#5a4a3a'; c.fillRect(x - s * .37, brim - s * .2, s * .74, s * .14);
    c.lineWidth = Math.max(1, s * .06); c.strokeStyle = '#e9c43a'; c.strokeRect(x - s * .12, brim - s * .22, s * .24, s * .18);
  } else if (kind === 'turkey') {
    const body = top - s * .05;
    for (let i = 0; i < 5; i++) { const a = -Math.PI * (.15 + i * .175); leaf(c, x + Math.cos(a) * s * .45, body + Math.sin(a) * s * .45 - s * .1, s * .2, a + Math.PI / 2, ['#b8323a', '#e6b23a', '#d9662a', '#e6b23a', '#b8323a'][i]); }
    ball(c, x, body, s * .4, '#c88a45', '#7a4a1e');
    for (const d of [-1, 1]) {
      c.save(); c.translate(x + d * s * .32, body - s * .25); c.rotate(d * .5);
      c.fillStyle = '#b06e36'; c.beginPath(); c.ellipse(0, 0, s * .1, s * .2, 0, 0, TAU); c.fill(); outline();
      ellipse(c, 0, -s * .22, s * .07, s * .06, '#fbf3e4'); c.restore();
    }
  } else if (kind === 'leaves') {
    for (let i = 0; i < 6; i++) leaf(c, x - s * .45 + i * s * .18, top + s * .1 - Math.sin(i / 5 * Math.PI) * s * .12, s * .17, (i - 2.5) * .35, ['#d9662a', '#b8323a', '#e6b23a'][i % 3]);
  }
  c.restore();
}
