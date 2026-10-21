// Kelvin, drawn in code to match the painted crew: a big guy in a tan-brown suit
// buttoned over his belly, light shirt and tie, receding light-brown hair, clean-shaven.
// Units are the 96 × 128 sprite space; canvases use PX pixels per unit. After drawing,
// each frame gets one dark outline and a fine painted grain, like the generated art.
const PX = 3;
const TAU = Math.PI * 2;
const C = {
  outline: '#241a14', line: 'rgba(52,34,24,.85)',
  skin: '#eebd9b', skinShade: '#cf9473', skinDeep: '#b57a5c', skinLight: '#fcdcc5',
  blush: 'rgba(222,118,104,.26)', lip: '#c9847a', mouthLine: '#87483b',
  hair: '#a07b56', hairShade: '#7b5b3d', hairLight: '#c4a07a', brow: '#866646',
  jacket: '#9a7650', jacketShade: '#6c4f34', jacketLight: '#c09c71', jacketDeep: '#4f3824',
  shirt: '#e5ebf2', shirtShade: '#b3c0ce',
  tie: '#3f5f86', tieShade: '#273d5a', tieStripe: 'rgba(214,226,238,.38)',
  pants: '#7f6146', pantsShade: '#563f2b', pantsLight: '#9c7e5f',
  shoe: '#33251d', shoeLight: '#6b5545', button: '#4a3424', eye: '#271c16',
};

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const shape = (c, build) => { c.beginPath(); build(c); };
const oval = (x, y, rx, ry, rot = 0) => k => k.ellipse(x, y, rx, ry, rot, 0, TAU);
const poly = (...pts) => k => { k.moveTo(...pts[0]); for (const p of pts.slice(1)) k.lineTo(...p); k.closePath(); };

// Fill a part, then shade it inside its own outline: light from the upper left,
// shadow toward the lower right, optional soft highlight, then a thin inner contour.
function part(c, build, base, { from, to, light = .3, dark = .5, glow, contour = .7 } = {}) {
  shape(c, build); c.fillStyle = base; c.fill();
  c.save(); shape(c, build); c.clip();
  if (from && to) {
    const g = c.createLinearGradient(from[0], from[1], to[0], to[1]);
    g.addColorStop(0, `rgba(255,244,228,${light})`); g.addColorStop(.42, 'rgba(255,255,255,0)');
    g.addColorStop(.58, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(36,20,10,${dark})`);
    c.fillStyle = g; c.fillRect(-20, -20, 200, 200);
  }
  if (glow) {
    const [x, y, r, a = .3] = glow, g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,246,232,${a})`); g.addColorStop(1, 'rgba(255,246,232,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  c.restore();
  if (contour) { shape(c, build); c.lineWidth = contour; c.strokeStyle = C.line; c.stroke(); }
}
function stroke(c, build, color, width) { shape(c, build); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function soft(c, build, color, blur) {
  c.save(); c.filter = `blur(${blur * PX}px)`; shape(c, build); c.fillStyle = color; c.fill(); c.restore();
}
function inside(c, build, draw) { c.save(); shape(c, build); c.clip(); draw(); c.restore(); }

// ---------- pieces shared by several views ----------
function fist(c, x, y, { thumb = 0, fingers = true } = {}) {
  part(c, oval(x, y, 4.9, 5.3), C.skin, { from: [x - 5, y - 5], to: [x + 5, y + 5], glow: [x - 1.6, y - 2, 3.5, .35] });
  if (thumb) part(c, oval(x + thumb * 3.2, y - 1.6, 1.9, 2.7, thumb * .3), C.skin, { from: [x, y - 4], to: [x + 4, y + 2] });
  if (fingers) for (const dy of [.2, 2.1]) stroke(c, k => { k.moveTo(x - 3.2, y + dy); k.quadraticCurveTo(x, y + dy + .9, x + 3.2, y + dy); }, 'rgba(150,92,68,.55)', .55);
}
function shoeFront(c, x, bottom, lift = 0) {
  const b = bottom - lift;
  part(c, k => { k.moveTo(x - 9, b - 6.4); k.quadraticCurveTo(x - 9.8, b, x, b); k.quadraticCurveTo(x + 9.8, b, x + 9, b - 6.4); k.quadraticCurveTo(x, b - 8, x - 9, b - 6.4); k.closePath(); },
    C.shoe, { from: [x - 8, b - 8], to: [x + 8, b] });
  soft(c, oval(x - 2, b - 4.6, 3.6, 1.1), 'rgba(255,240,225,.35)', .3);
}
// A shoe seen from the side, toe pointing left.
function shoeSide(c, toe, bottom, length, base = C.shoe) {
  part(c, k => { k.moveTo(toe, bottom); k.quadraticCurveTo(toe - 1.6, bottom - 3.8, toe + 4.4, bottom - 5.6);
    k.lineTo(toe + length, bottom - 6.4); k.quadraticCurveTo(toe + length + 2.2, bottom - 3.4, toe + length + 1.6, bottom); k.closePath(); },
  base, { from: [toe, bottom - 7], to: [toe + length, bottom] });
  soft(c, oval(toe + 4.6, bottom - 3.8, 3, .9), 'rgba(255,240,225,.3)', .3);
}

// ---------- front and back views ----------
function frontLegs(c, cx, step, bottom) {
  for (const s of [-1, 1]) {
    const lift = (step === 1 && s < 0) || (step === 2 && s > 0) ? 2.4 : 0, X = d => cx + s * d;
    const leg = k => { k.moveTo(X(2.4), 88); k.lineTo(X(18.8), 88); k.quadraticCurveTo(X(19.4), 101, X(17.6), bottom - 6 - lift); k.lineTo(X(3.2), bottom - 6 - lift); k.quadraticCurveTo(X(2), 101, X(2.4), 88); k.closePath(); };
    part(c, leg, C.pants, { from: [cx - 20, 88], to: [cx + 20, bottom], light: s < 0 ? .3 : .16 });
    stroke(c, k => { k.moveTo(X(10.4), 94); k.lineTo(X(10.2), bottom - 8 - lift); }, 'rgba(190,160,128,.35)', .6);
    stroke(c, k => { k.moveTo(X(4.4), 99); k.quadraticCurveTo(X(6), 103, X(5), 107); }, 'rgba(40,26,16,.3)', .5);
    shoeFront(c, X(10.6), bottom, lift);
  }
}

function jacketFront(c, cx, hem, belly, back) {
  const body = k => {
    k.moveTo(cx - 10, 45.6); k.lineTo(cx - 25, 49.4);
    k.quadraticCurveTo(cx - 33, 51.8, cx - 34.6, 60);
    k.quadraticCurveTo(cx - 38.8, belly, cx - 36.2, hem - 10);
    k.quadraticCurveTo(cx - 34.2, hem - 2.5, cx - 26, hem);
    k.quadraticCurveTo(cx, hem + 4, cx + 26, hem);
    k.quadraticCurveTo(cx + 34.2, hem - 2.5, cx + 36.2, hem - 10);
    k.quadraticCurveTo(cx + 38.8, belly, cx + 34.6, 60);
    k.quadraticCurveTo(cx + 33, 51.8, cx + 25, 49.4);
    k.lineTo(cx + 10, 45.6); k.closePath();
  };
  part(c, body, C.jacket, { from: [cx - 34, 48], to: [cx + 36, hem + 2], glow: back ? null : [cx - 10, belly - 4, 20, .2] });
  return body;
}

function frontTorso(c, cx, { hem = 98, belly = 76, back = false } = {}) {
  const body = jacketFront(c, cx, hem, belly, back);
  if (back) {
    inside(c, body, () => {
      stroke(c, k => { k.moveTo(cx, 51); k.lineTo(cx, hem + 2); }, 'rgba(60,40,26,.4)', .7);
      stroke(c, k => { k.moveTo(cx, hem - 13); k.lineTo(cx, hem + 3); }, C.jacketDeep, .9);
      for (const s of [-1, 1]) stroke(c, k => { k.moveTo(cx + s * 9, 57); k.quadraticCurveTo(cx + s * 17, 62, cx + s * 24, 58); }, 'rgba(60,40,26,.25)', .6);
    });
    part(c, k => { k.moveTo(cx - 9, 45.4); k.quadraticCurveTo(cx, 43.2, cx + 9, 45.4); k.lineTo(cx + 8.6, 47); k.quadraticCurveTo(cx, 45, cx - 8.6, 47); k.closePath(); }, C.shirt, { contour: .5 });
    part(c, k => { k.moveTo(cx - 11, 46); k.quadraticCurveTo(cx, 43.6, cx + 11, 46); k.lineTo(cx + 10.4, 50); k.quadraticCurveTo(cx, 47.8, cx - 10.4, 50); k.closePath(); }, C.jacketShade, { contour: .6 });
    return;
  }
  const vb = Math.min(77.5, hem - 18);
  part(c, poly([cx - 9.6, 46.2], [cx + 9.6, 46.2], [cx + .6, vb], [cx - .6, vb]), C.shirt, { from: [cx - 8, 46], to: [cx + 8, vb], contour: .5 });
  // Tie: knot, then a blade tucked behind the buttoned jacket.
  part(c, poly([cx - 3, 47.6], [cx + 3, 47.6], [cx + 2.2, 52], [cx - 2.2, 52]), C.tie, { from: [cx - 3, 47], to: [cx + 3, 52], contour: .5 });
  const blade = poly([cx - 2.3, 52], [cx + 2.3, 52], [cx + 3.9, vb - 4], [cx, vb + .5], [cx - 3.9, vb - 4]);
  part(c, blade, C.tie, { from: [cx - 4, 52], to: [cx + 4, vb], contour: .5 });
  inside(c, blade, () => { for (let y = 52; y < vb; y += 3.2) stroke(c, k => { k.moveTo(cx - 5, y); k.lineTo(cx + 5, y + 3); }, C.tieStripe, .7); });
  for (const s of [-1, 1]) {
    part(c, poly([cx + s * 9.8, 45.8], [cx + s * 2.6, 47.2], [cx + s * 5.8, 53.4]), C.shirt, { contour: .55 });
    // Notch lapels, lighter on the lit side.
    part(c, poly([cx + s * 10, 45.6], [cx + s * 16.6, 49.8], [cx + s * 18.6, 55.4], [cx + s * 15.2, 56.2], [cx + s * 4.2, vb - 3], [cx + s * .6, vb], [cx + s * 8.2, 52]),
      s < 0 ? C.jacketLight : C.jacket, { from: [cx - 18, 46], to: [cx + 18, vb], light: .12, dark: .3, contour: .65 });
  }
  inside(c, body, () => {
    stroke(c, k => { k.moveTo(cx - .2, vb); k.lineTo(cx + .6, hem + 3); }, C.jacketDeep, .8);
    // Strain lines pulling from the button across the belly.
    for (const [x, y] of [[cx - 10, vb - 5], [cx + 11, vb - 4.6], [cx - 9, vb + 14], [cx + 10, vb + 14.5]])
      stroke(c, k => { k.moveTo(cx + 1.3, vb + 4); k.quadraticCurveTo((cx + x) / 2, (vb + 4 + y) / 2 + 1, x, y); }, 'rgba(60,40,26,.28)', .6);
    for (const s of [-1, 1]) {
      stroke(c, k => { k.moveTo(cx + s * 27, hem - 10.2); k.lineTo(cx + s * 15, hem - 9.6); }, 'rgba(60,40,26,.6)', .7);
      soft(c, poly([cx + s * 27, hem - 10], [cx + s * 15, hem - 9.4], [cx + s * 15.2, hem - 8], [cx + s * 26.8, hem - 8.6]), 'rgba(60,40,26,.22)', .2);
    }
    stroke(c, k => { k.moveTo(cx - 25, 60.6); k.lineTo(cx - 17.6, 60.1); }, 'rgba(60,40,26,.55)', .6);
  });
  for (const y of [vb + 4, vb + 12.5]) if (y < hem - 3) {
    part(c, oval(cx + 1.4, y, 1.35, 1.35), C.button, { contour: .4 });
    soft(c, oval(cx + 1, y - .4, .5, .4), 'rgba(255,240,220,.6)', .1);
  }
}

function frontArms(c, cx, step, back) {
  for (const s of [-1, 1]) {
    const dy = step === 1 ? (s < 0 ? 2 : -1) : step === 2 ? (s < 0 ? -1 : 2) : 0, X = d => cx + s * d;
    const sleeve = k => { k.moveTo(X(24.6), 49.6); k.quadraticCurveTo(X(34.6), 51.2, X(36.6), 63); k.quadraticCurveTo(X(40.2), 78, X(38.6), 88.6 + dy);
      k.lineTo(X(30.2), 90 + dy); k.quadraticCurveTo(X(30.6), 77, X(28.4), 66); k.quadraticCurveTo(X(27.2), 57, X(21.6), 53.4); k.closePath(); };
    part(c, sleeve, C.jacket, { from: [cx - 40, 50], to: [cx + 40, 92], light: s < 0 ? .3 : .14, dark: s < 0 ? .3 : .46 });
    inside(c, sleeve, () => stroke(c, k => { k.moveTo(X(31), 70 + dy * .5); k.quadraticCurveTo(X(34.5), 72.5 + dy * .5, X(37.8), 71 + dy * .5); }, 'rgba(60,40,26,.35)', .6));
    part(c, poly([X(38.7), 87.6 + dy], [X(30.2), 89 + dy], [X(30.4), 91.2 + dy], [X(38.9), 89.8 + dy]), C.shirt, { contour: .5 });
    fist(c, X(34.6), 94.2 + dy, { thumb: back ? 0 : -s, fingers: !back });
  }
}

function headShape(cx, cy) { return [oval(cx, cy, 22.2, 22.4), oval(cx, cy + 12, 19.4, 11.6)]; }
function skinHead(c, builds, light) {
  const union = k => { for (const b of builds) b(k); };
  shape(c, union); c.fillStyle = C.skin; c.fill();
  inside(c, union, () => {
    const [x, y] = light;
    const g = c.createRadialGradient(x, y, 2, x + 6, y + 12, 34);
    g.addColorStop(0, 'rgba(255,240,226,.55)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,60,36,.42)');
    c.fillStyle = g; c.fillRect(x - 40, y - 40, 100, 100);
  });
  return union;
}

function frontHead(c, cx, back, cy = 23.8) {
  for (const s of [-1, 1]) {
    part(c, oval(cx + s * 21.6, cy + 2.4, 3.7, 5.6), C.skin, { from: [cx + s * 18, cy - 3], to: [cx + s * 25, cy + 8] });
    if (!back) stroke(c, k => k.arc(cx + s * 21.8, cy + 2.6, 2, s < 0 ? Math.PI * .55 : -Math.PI * .45, s < 0 ? Math.PI * 1.45 : Math.PI * .45), 'rgba(170,104,78,.7)', .6);
  }
  const head = skinHead(c, headShape(cx, cy), [cx - 8, cy - 12]);
  if (back) {
    // Short, thin hair at the back; the crown is sparse.
    inside(c, head, () => {
      const g = c.createLinearGradient(0, cy - 16, 0, cy + 17);
      g.addColorStop(0, 'rgba(160,123,86,0)'); g.addColorStop(.35, 'rgba(160,123,86,.55)'); g.addColorStop(.7, C.hair); g.addColorStop(1, C.hairShade);
      shape(c, k => { k.moveTo(cx - 25, cy - 9); k.quadraticCurveTo(cx, cy - 15, cx + 25, cy - 9); k.lineTo(cx + 25, cy + 13); k.quadraticCurveTo(cx, cy + 19, cx - 25, cy + 13); k.closePath(); });
      c.fillStyle = g; c.fill();
      const r = rng(5);
      for (let i = 0; i < 26; i++) {
        const x = cx - 21 + i * 1.65, y = cy - 8 + r() * 6;
        stroke(c, k => { k.moveTo(x, y); k.quadraticCurveTo(x + .6, y + 6, x - .4, y + 12 + r() * 4); }, i % 2 ? 'rgba(124,92,62,.5)' : 'rgba(196,160,122,.45)', .5);
      }
    });
    stroke(c, k => { k.moveTo(cx - 8.6, cy + 19.2); k.quadraticCurveTo(cx, cy + 21, cx + 8.6, cy + 19.2); }, 'rgba(176,112,84,.7)', .7);
    stroke(c, k => { k.moveTo(cx - 7, cy + 21.4); k.quadraticCurveTo(cx, cy + 22.8, cx + 7, cy + 21.4); }, 'rgba(176,112,84,.5)', .6);
    soft(c, oval(cx - 5, cy - 14, 6, 2.6), 'rgba(255,245,235,.35)', .6);
    return;
  }
  // Receding hairline: a thin, see-through layer of light-brown hair combed back over the top.
  inside(c, head, () => {
    shape(c, k => { k.moveTo(cx - 20.5, cy - 7); k.quadraticCurveTo(cx - 11, cy - 15.6, cx, cy - 15.2); k.quadraticCurveTo(cx + 11, cy - 15.6, cx + 20.5, cy - 7);
      k.quadraticCurveTo(cx + 19, cy - 25, cx, cy - 25); k.quadraticCurveTo(cx - 19, cy - 25, cx - 20.5, cy - 7); k.closePath(); });
    c.fillStyle = 'rgba(160,123,86,.3)'; c.fill();
    const r = rng(9);
    for (let i = 0; i < 24; i++) {
      const x = cx - 18 + i * 1.55, base = cy - 15.2 + ((x - cx) / 18) ** 2 * 7.6;
      stroke(c, k => { k.moveTo(x, base); k.quadraticCurveTo(x + (x - cx) * .06, base - 4, x + (x - cx) * .14, cy - 23 - r() * 2); }, i % 3 ? 'rgba(150,114,78,.55)' : 'rgba(205,172,134,.5)', .45);
    }
  });
  for (const s of [-1, 1]) {
    const X = d => cx + s * d;
    const side = k => { k.moveTo(X(22), cy + 3.6); k.quadraticCurveTo(X(23.5), cy - 9.6, X(16.6), cy - 17.4); k.quadraticCurveTo(X(14.8), cy - 14.4, X(17.2), cy - 10.4);
      k.quadraticCurveTo(X(19.3), cy - 4.6, X(18.7), cy + 3.6); k.closePath(); };
    part(c, side, C.hair, { from: [cx - 22, cy - 18], to: [cx + 22, cy + 4], contour: .5 });
    inside(c, side, () => { for (const t of [0, 1, 2, 3]) stroke(c, k => { k.moveTo(X(18.6 + t * 1.1), cy - 13 + t * 3); k.lineTo(X(19.6 + t * 1), cy - 7 + t * 3.2); }, 'rgba(110,80,52,.55)', .45); });
  }
  soft(c, oval(cx - 7, cy - 12.5, 6.5, 3), 'rgba(255,245,235,.4)', .7);
  for (const s of [-1, 1]) {
    const X = d => cx + s * d;
    stroke(c, k => { k.moveTo(X(13.2), cy - 4.2); k.quadraticCurveTo(X(9), cy - 6.9, X(4.6), cy - 4.9); }, C.brow, 1.45);
    stroke(c, k => { k.moveTo(X(12.4), cy - 4.6); k.quadraticCurveTo(X(9), cy - 6.6, X(5.6), cy - 5.1); }, 'rgba(200,164,126,.5)', .5);
    stroke(c, k => { k.moveTo(X(11.9), cy - .5); k.quadraticCurveTo(X(8.4), cy - 2.9, X(4.9), cy - .4); }, 'rgba(150,90,66,.8)', .8);
    shape(c, oval(X(8.4), cy + 1.5, 2.55, 3)); c.fillStyle = C.eye; c.fill();
    shape(c, oval(X(8.4) - .9, cy + .3, .9, .9)); c.fillStyle = '#ffffff'; c.fill();
    shape(c, oval(X(8.4) + .9, cy + 2.6, .45, .45)); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill();
    stroke(c, k => { k.moveTo(X(10.8), cy + 4.5); k.quadraticCurveTo(X(8.4), cy + 5.7, X(6), cy + 4.5); }, 'rgba(176,112,84,.4)', .55);
    soft(c, oval(X(13.4), cy + 8.4, 4.4, 2.6), C.blush, .8);
  }
  soft(c, oval(cx + 1.2, cy + 7.6, 3.9, 2.8), 'rgba(176,112,84,.38)', .6);
  for (const s of [-1, 1]) { shape(c, oval(cx + s * 1.9, cy + 8.8, .7, .5)); c.fillStyle = 'rgba(140,82,62,.7)'; c.fill(); }
  soft(c, oval(cx - .7, cy + 5.6, 1, .9), 'rgba(255,236,222,.85)', .2);
  stroke(c, k => { k.moveTo(cx - 4.8, cy + 13.4); k.quadraticCurveTo(cx - 1.5, cy + 14.3, cx, cy + 13.9); k.quadraticCurveTo(cx + 1.5, cy + 14.3, cx + 4.8, cy + 13.4); }, C.mouthLine, .95);
  soft(c, oval(cx, cy + 15, 3.1, 1.05), C.lip, .15);
  stroke(c, k => { k.moveTo(cx - 8.8, cy + 20.4); k.quadraticCurveTo(cx, cy + 23.4, cx + 8.8, cy + 20.4); }, 'rgba(176,112,84,.75)', .8);
  soft(c, oval(cx, cy + 22.2, 10, 1.8), 'rgba(150,90,64,.22)', .8);
}

// ---------- side views, facing left (east frames are mirrored) ----------
function sideLegs(c, cx, step, bottom) {
  const near = (pts) => part(c, poly(...pts), C.pants, { from: [cx - 16, 88], to: [cx + 12, bottom], light: .28 });
  const far = (pts) => part(c, poly(...pts), C.pantsShade, { from: [cx - 16, 88], to: [cx + 12, bottom], light: .08 });
  if (step === 0) {
    far([[cx - 4, 88], [cx + 10, 88], [cx + 9, bottom - 6], [cx - 3, bottom - 6]]);
    shoeSide(c, cx - 9, bottom - .4, 15, '#2a1e17');
    near([[cx - 9.4, 88], [cx + 6, 88], [cx + 4.6, bottom - 6], [cx - 8, bottom - 6]]);
    shoeSide(c, cx - 14.6, bottom, 18);
    return;
  }
  const forward = [[cx - 6.4, 88], [cx + 6, 88], [cx - 4.6, bottom - 6], [cx - 15.6, bottom - 7.2]];
  const backward = [[cx - 3.4, 88], [cx + 9.4, 88], [cx + 16.2, bottom - 7.4], [cx + 5, bottom - 5.6]];
  const fwdShoe = base => shoeSide(c, cx - 22, bottom, 17, base), backShoe = base => shoeSide(c, cx + 2.4, bottom - .6, 15, base);
  if (step === 1) { far(backward); backShoe('#2a1e17'); near(forward); fwdShoe(); }
  else { far(forward); fwdShoe('#2a1e17'); near(backward); backShoe(); }
}

function sideTorso(c, cx, { hem = 98.5, belly = 31, seated = false } = {}) {
  const body = k => {
    k.moveTo(cx - 4, 46); k.quadraticCurveTo(cx - 16, 49.5, cx - 21, 60);
    if (seated) { k.quadraticCurveTo(cx - belly, 67, cx - 25, hem); }
    else { k.quadraticCurveTo(cx - belly, 73, cx - 29.4, 86); k.quadraticCurveTo(cx - 27.6, 96, cx - 19, hem); }
    k.lineTo(cx + 14.6, hem); k.quadraticCurveTo(cx + 18.4, hem - 16, cx + 17, 62); k.quadraticCurveTo(cx + 15.6, 49.6, cx + 6, 45.2); k.closePath();
  };
  part(c, body, C.jacket, { from: [cx - 30, 48], to: [cx + 18, hem], glow: [cx - 20, 72, 14, .18] });
  const button = seated ? [cx - 24.6, 64] : [cx - 27.4, 79];
  part(c, k => { k.moveTo(cx - 4, 46); k.quadraticCurveTo(cx - 13, 49, cx - 17.6, 56); k.lineTo(cx - 14, 57); k.quadraticCurveTo(cx - 10, 51, cx + .6, 47); k.closePath(); }, C.shirt, { from: [cx - 16, 46], to: [cx, 57], contour: .5 });
  const tie = k => { k.moveTo(cx - 7.2, 48.6); k.quadraticCurveTo(cx - 14, 55, cx - 19.4, 63); k.lineTo(button[0] + 1.8, button[1] - 1); k.lineTo(button[0] + 4.6, button[1] - 2.2);
    k.quadraticCurveTo(cx - 16.6, 64, cx - 11.6, 57.6); k.quadraticCurveTo(cx - 8, 52, cx - 4.8, 50); k.closePath(); };
  part(c, tie, C.tie, { from: [cx - 20, 48], to: [cx - 5, button[1]], contour: .5 });
  inside(c, body, () => {
    stroke(c, k => { k.moveTo(cx + .6, 47); k.quadraticCurveTo(cx - 9, 57, cx - 17, 66); k.lineTo(...button); }, C.jacketDeep, .75);
    for (const [x, y] of [[cx - 16, button[1] - 6], [cx - 15, button[1] + 6], [cx - 18, button[1] + 13]])
      stroke(c, k => { k.moveTo(button[0] + 1, button[1]); k.quadraticCurveTo((button[0] + x) / 2, (button[1] + y) / 2 + 1, x, y); }, 'rgba(60,40,26,.28)', .55);
    if (!seated) stroke(c, k => { k.moveTo(cx - 22, 88.6); k.lineTo(cx - 8, 89.2); }, 'rgba(60,40,26,.55)', .7);
  });
  part(c, oval(button[0] + 1, button[1], 1.3, 1.3), C.button, { contour: .4 });
  if (!seated) part(c, oval(button[0] + 1.4, button[1] + 8.6, 1.3, 1.3), C.button, { contour: .4 });
  part(c, k => { k.moveTo(cx + 2, 45.2); k.quadraticCurveTo(cx + 8.6, 43.8, cx + 12.6, 47); k.lineTo(cx + 11.6, 50.4); k.quadraticCurveTo(cx + 7.6, 48.4, cx + 2.4, 48.8); k.closePath(); }, C.jacketShade, { contour: .6 });
}

function sideArm(c, cx, angle) {
  c.save(); c.translate(cx + 3, 50.6); c.rotate(angle);
  const sleeve = k => { k.moveTo(-6.4, 0); k.quadraticCurveTo(-8.4, 15, -6.8, 24); k.quadraticCurveTo(-6.6, 31, -5.6, 37.4); k.lineTo(5.4, 37.4); k.quadraticCurveTo(7.4, 24, 6.6, -1); k.closePath(); };
  part(c, sleeve, C.jacket, { from: [-7, 0], to: [7, 38], light: .3, dark: .4 });
  inside(c, sleeve, () => stroke(c, k => { k.moveTo(-6, 21); k.quadraticCurveTo(-2, 23, 2, 21.4); }, 'rgba(60,40,26,.35)', .6));
  part(c, poly([-5.6, 36.6], [5.4, 36.6], [5.2, 39.2], [-5.4, 39.2]), C.shirt, { contour: .5 });
  fist(c, -.2, 42.4, { thumb: -1 });
  c.restore();
}

function sideHead(c, cx, cy = 23.8) {
  const hx = cx - 2;
  part(c, oval(hx - 21, cy + 6.8, 3.4, 3.7), C.skin, { from: [hx - 24, cy + 3], to: [hx - 18, cy + 10], contour: .8 });
  const head = skinHead(c, [oval(hx, cy, 21.6, 22.6), oval(hx - 6, cy + 12.6, 15.4, 10.6)], [hx - 9, cy - 12]);
  // Hair: a short fringe from above the ear around the back, thin on top.
  inside(c, head, () => {
    const r = rng(13);
    shape(c, k => { k.moveTo(hx - 14, cy - 14); k.quadraticCurveTo(hx, cy - 21, hx + 16, cy - 15); k.lineTo(hx + 22, cy - 8); k.lineTo(hx + 22, cy - 26); k.lineTo(hx - 14, cy - 26); k.closePath(); });
    c.fillStyle = 'rgba(160,123,86,.28)'; c.fill();
    for (let i = 0; i < 20; i++) {
      const x = hx - 13 + i * 1.6;
      stroke(c, k => { k.moveTo(x, cy - 14.6 - i * .28); k.quadraticCurveTo(x + 4, cy - 19 - i * .2, x + 8, cy - 18 - r() * 4); }, i % 3 ? 'rgba(150,114,78,.5)' : 'rgba(205,172,134,.45)', .45);
    }
  });
  const fringe = k => { k.moveTo(hx + .4, cy - 5.6); k.quadraticCurveTo(hx + 12, cy - 11, hx + 20.4, cy - 3.6); k.quadraticCurveTo(hx + 22.2, cy + 7.6, hx + 16.2, cy + 14.6);
    k.lineTo(hx + 12.2, cy + 12.4); k.quadraticCurveTo(hx + 15, cy + 5.6, hx + 13.4, cy + .8); k.quadraticCurveTo(hx + 8.6, cy - 2.8, hx + 2.2, cy - 2); k.closePath(); };
  part(c, fringe, C.hair, { from: [hx, cy - 10], to: [hx + 22, cy + 14], contour: .5 });
  inside(c, fringe, () => { for (const t of [0, 1, 2, 3, 4]) stroke(c, k => { k.moveTo(hx + 8 + t * 2.6, cy - 6 + t * .9); k.lineTo(hx + 9.6 + t * 2.6, cy - .4 + t * 1.3); }, 'rgba(110,80,52,.5)', .45); });
  part(c, oval(hx + 5.4, cy + 3.4, 3.5, 5.2), C.skin, { from: [hx + 2, cy - 2], to: [hx + 9, cy + 9], contour: .7 });
  stroke(c, k => { k.moveTo(hx + 4.4, cy + .8); k.quadraticCurveTo(hx + 6.8, cy + 3.4, hx + 4.8, cy + 6.4); }, 'rgba(170,104,78,.7)', .6);
  soft(c, oval(hx - 8, cy - 12.4, 6, 2.6), 'rgba(255,245,235,.4)', .7);
  stroke(c, k => { k.moveTo(hx - 17.6, cy - 4.6); k.quadraticCurveTo(hx - 14.2, cy - 6.8, hx - 10, cy - 5); }, C.brow, 1.4);
  stroke(c, k => { k.moveTo(hx - 16.6, cy - .4); k.quadraticCurveTo(hx - 14, cy - 2.2, hx - 11.4, cy - .4); }, 'rgba(160,98,72,.75)', .7);
  shape(c, oval(hx - 14, cy + 1.5, 2.1, 2.9)); c.fillStyle = C.eye; c.fill();
  shape(c, oval(hx - 14.8, cy + .4, .8, .8)); c.fillStyle = '#ffffff'; c.fill();
  soft(c, oval(hx - 9.6, cy + 8.6, 4.2, 2.5), C.blush, .8);
  soft(c, oval(hx - 21.6, cy + 5.6, 1.1, .9), 'rgba(255,236,222,.8)', .2);
  stroke(c, k => { k.moveTo(hx - 18.6, cy + 13.6); k.quadraticCurveTo(hx - 16, cy + 14.6, hx - 13.4, cy + 13.8); }, C.mouthLine, .9);
  soft(c, oval(hx - 16.2, cy + 15, 2, .9), C.lip, .15);
  stroke(c, k => { k.moveTo(hx - 14.6, cy + 19.8); k.quadraticCurveTo(hx - 8.6, cy + 23, hx - 1.6, cy + 21.4); }, 'rgba(176,112,84,.75)', .8);
}

// ---------- poses ----------
const STAND = { w: 94, h: 120 }, SIDE = { w: 74, h: 120 }, SIT = { w: 84, h: 98 }, SIT_SIDE = { w: 82, h: 98 };
const FEET = 118.8, SEAT_FEET = 96.9;

const standFront = step => c => { const cx = 47; frontLegs(c, cx, step, FEET); frontTorso(c, cx); frontArms(c, cx, step, false); frontHead(c, cx, false); };
const standBack = step => c => { const cx = 47; frontLegs(c, cx, step, FEET); frontTorso(c, cx, { back: true }); frontArms(c, cx, step, true); frontHead(c, cx, true); };
const standSide = step => c => { const cx = 42; sideLegs(c, cx, step, FEET); sideTorso(c, cx); sideArm(c, cx, step === 1 ? .2 : step === 2 ? -.2 : .02); sideHead(c, cx); };

function sitFront(c) {
  const cx = 42;
  for (const s of [-1, 1]) {
    const X = d => cx + s * d;
    part(c, k => k.roundRect(Math.min(X(6), X(18)), 79, 12, 13, 2.5), C.pantsShade, { from: [cx - 18, 79], to: [cx + 18, 92], light: .1 });
    shoeFront(c, X(12), SEAT_FEET);
    part(c, k => { k.moveTo(X(28.4), 65); k.lineTo(X(1.6), 65); k.lineTo(X(2.6), 79.6); k.quadraticCurveTo(X(13), 85.2, X(24.4), 80.6); k.quadraticCurveTo(X(29.4), 76, X(28.4), 65); k.closePath(); },
      C.pants, { from: [cx - 28, 64], to: [cx + 28, 85], light: s < 0 ? .3 : .14 });
  }
  frontTorso(c, cx, { hem: 74.5, belly: 66 });
  for (const s of [-1, 1]) {
    const X = d => cx + s * d;
    const sleeve = k => { k.moveTo(X(24.6), 49.6); k.quadraticCurveTo(X(33.4), 51.4, X(34.4), 60); k.quadraticCurveTo(X(35.4), 68.4, X(30.6), 74.4);
      k.lineTo(X(22.4), 79.2); k.lineTo(X(18), 73.4); k.quadraticCurveTo(X(25.6), 67.6, X(26.2), 61.4); k.quadraticCurveTo(X(25.6), 55.6, X(21.6), 53.4); k.closePath(); };
    part(c, sleeve, C.jacket, { from: [cx - 38, 50], to: [cx + 38, 80], light: s < 0 ? .3 : .14, dark: s < 0 ? .3 : .46 });
    part(c, poly([X(22.6), 79.4], [X(17.6), 73.8], [X(16.4), 75.4], [X(21.2), 80.8]), C.shirt, { contour: .5 });
    fist(c, X(18.4), 79, { thumb: -s });
  }
  frontHead(c, cx, false);
}
function sitBack(c) {
  const cx = 42;
  for (const s of [-1, 1]) shoeFront(c, cx + s * 12, SEAT_FEET + .2);
  part(c, k => { k.moveTo(cx - 30, 70); k.lineTo(cx + 30, 70); k.lineTo(cx + 28, 88.4); k.quadraticCurveTo(cx, 93, cx - 28, 88.4); k.closePath(); }, C.pants, { from: [cx - 30, 70], to: [cx + 30, 92], light: .14 });
  frontTorso(c, cx, { hem: 82, belly: 68, back: true });
  for (const s of [-1, 1]) {
    const X = d => cx + s * d;
    part(c, k => { k.moveTo(X(24.6), 49.6); k.quadraticCurveTo(X(36), 52, X(38), 62); k.quadraticCurveTo(X(39.6), 71, X(36.6), 75.4); k.lineTo(X(29.4), 76.2);
      k.quadraticCurveTo(X(29), 66, X(27.6), 60); k.quadraticCurveTo(X(26.4), 55, X(21.6), 53.4); k.closePath(); },
    C.jacket, { from: [cx - 40, 50], to: [cx + 40, 78], light: s < 0 ? .26 : .12, dark: s < 0 ? .3 : .44 });
  }
  frontHead(c, cx, true);
}
function sitSide(c) {
  const cx = 52;
  shoeSide(c, cx - 43, SEAT_FEET, 17);
  part(c, k => k.roundRect(cx - 35, 75, 12.4, 17, 2.5), C.pants, { from: [cx - 35, 75], to: [cx - 22, 92], light: .22 });
  part(c, k => { k.moveTo(cx + 13, 64.6); k.lineTo(cx - 27, 65.6); k.quadraticCurveTo(cx - 35.6, 66.6, cx - 35.6, 73.4); k.quadraticCurveTo(cx - 35.6, 80.6, cx - 27, 81);
    k.lineTo(cx + 13, 81.6); k.closePath(); }, C.pants, { from: [cx - 30, 64], to: [cx + 10, 82], light: .3 });
  sideTorso(c, cx, { hem: 75.5, belly: 29, seated: true });
  const arm = k => { k.moveTo(cx - 2, 49.6); k.quadraticCurveTo(cx + 8.4, 50.6, cx + 8.6, 58); k.lineTo(cx + 7.8, 66.6); k.quadraticCurveTo(cx - 6, 70.4, cx - 21.4, 75.4);
    k.lineTo(cx - 23.4, 68.6); k.quadraticCurveTo(cx - 8, 64, cx - 3.4, 61); k.quadraticCurveTo(cx - 4.6, 55, cx - 2, 49.6); k.closePath(); };
  part(c, arm, C.jacket, { from: [cx - 22, 50], to: [cx + 9, 76], light: .3, dark: .4 });
  part(c, poly([cx - 21.4, 75.4], [cx - 23.4, 68.6], [cx - 25.2, 69], [cx - 23.2, 75.8]), C.shirt, { contour: .5 });
  fist(c, cx - 27.6, 72, { thumb: -1 });
  sideHead(c, cx);
}

// One dark outline around the whole figure, then a fine grain at the crew's pixel scale.
function finish(canvas, outline, grain, seed) {
  const w = canvas.width, h = canvas.height;
  const tint = document.createElement('canvas'); tint.width = w; tint.height = h;
  const t = tint.getContext('2d'); t.drawImage(canvas, 0, 0);
  t.globalCompositeOperation = 'source-in'; t.fillStyle = C.outline; t.fillRect(0, 0, w, h);
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const o = out.getContext('2d', { willReadFrequently: true });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; o.drawImage(tint, Math.cos(a) * outline, Math.sin(a) * outline); }
  o.drawImage(canvas, 0, 0);
  const image = o.getImageData(0, 0, w, h), d = image.data, r = rng(seed);
  for (let by = 0; by < h; by += grain) for (let bx = 0; bx < w; bx += grain) {
    const j = 1 + (r() - .5) * .045;
    for (let y = by; y < Math.min(h, by + grain); y++) for (let x = bx; x < Math.min(w, bx + grain); x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 200) continue;
      d[i] = Math.min(255, d[i] * j); d[i + 1] = Math.min(255, d[i + 1] * j); d[i + 2] = Math.min(255, d[i + 2] * j);
    }
  }
  o.putImageData(image, 0, 0);
  return out;
}

// Frames side by side on one canvas, each with its own display scale.
function sheet(specs, { outline, grain }) {
  const rendered = specs.map((spec, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(spec.w * PX); canvas.height = Math.ceil(spec.h * PX);
    const c = canvas.getContext('2d');
    c.translate(spec.flip ? canvas.width : 0, 0); c.scale(spec.flip ? -PX : PX, PX);
    c.lineJoin = 'round'; c.lineCap = 'round';
    spec.draw(c);
    return finish(canvas, outline * PX, grain, 31 + index * 7);
  });
  const atlas = document.createElement('canvas');
  atlas.width = rendered.reduce((sum, f) => sum + f.width + 4, 0); atlas.height = Math.max(...rendered.map(f => f.height));
  const a = atlas.getContext('2d');
  let x = 0;
  const frames = rendered.map(frame => {
    a.drawImage(frame, x, 0);
    const placed = { x, y: 0, w: frame.width, h: frame.height, scale: 1 / PX };
    x += frame.width + 4;
    return placed;
  });
  return { canvas: atlas, frames };
}

// Same frame order as the painted atlases: standing south, west, east, north × idle and two steps;
// seated south, west, east, north.
export function buildKelvin(row) {
  const stand = sheet([
    ...[0, 1, 2].map(step => ({ ...STAND, draw: standFront(step) })),
    ...[0, 1, 2].map(step => ({ ...SIDE, draw: standSide(step) })),
    ...[0, 1, 2].map(step => ({ ...SIDE, draw: standSide(step), flip: true })),
    ...[0, 1, 2].map(step => ({ ...STAND, draw: standBack(step) })),
  ], { outline: .85, grain: 3 });
  const sit = sheet([
    { ...SIT, draw: sitFront }, { ...SIT_SIDE, draw: sitSide }, { ...SIT_SIDE, draw: sitSide, flip: true }, { ...SIT, draw: sitBack },
  ], { outline: .65, grain: 2 });
  return {
    stand: { atlas: stand.canvas, rows: { [row]: stand.frames } },
    sit: { atlas: sit.canvas, rows: { [row]: sit.frames } },
  };
}
