import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficeCamera, MAX_ZOOM, wheelZoom } from '../public/office-camera.js';

// Layout fixture models centered fit, scroll clamping, pointer capture and DOM events.
function scene(width = 1000, height = 700) {
  const handlers = new Map(), captured = new Set(), classes = new Set();
  let left = 0, top = 0;
  const room = { style: { width: '984px', height: '656px' }, getBoundingClientRect() {
    const w = parseFloat(this.style.width), h = parseFloat(this.style.height);
    return { left: 10 + Math.max(0, (viewport.clientWidth - w) / 2) - left,
      top: 20 + Math.max(0, (viewport.clientHeight - h) / 2) - top, width: w, height: h };
  } };
  const viewport = {
    clientWidth: width, clientHeight: height, dataset: {},
    classList: { toggle: (c, on) => on ? classes.add(c) : classes.delete(c), add: c => classes.add(c), remove: c => classes.delete(c) },
    getBoundingClientRect: () => ({ left: 10, top: 20, width: viewport.clientWidth, height: viewport.clientHeight }),
    addEventListener: (name, fn) => handlers.set(name, fn), removeEventListener: name => handlers.delete(name),
    setPointerCapture: id => captured.add(id), hasPointerCapture: id => captured.has(id), releasePointerCapture: id => captured.delete(id),
    get scrollLeft() { return left; }, set scrollLeft(v) { left = Math.max(0, Math.min(v, parseFloat(room.style.width) - this.clientWidth)); },
    get scrollTop() { return top; }, set scrollTop(v) { top = Math.max(0, Math.min(v, parseFloat(room.style.height) - this.clientHeight)); },
  };
  const camera = new OfficeCamera(viewport, room, { width: 1536, height: 1024 });
  const event = (type, props = {}) => {
    const e = { pointerType: 'touch', pointerId: 1, button: 0, clientX: 500, clientY: 350, target: viewport,
      preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...props };
    handlers.get(type)?.(e); return e;
  };
  return { viewport, room, camera, event, captured };
}
const pointInMap = (room, x, y) => { const r = room.getBoundingClientRect(); return [(x - r.left) / r.width, (y - r.top) / r.height]; };
const close = (a, b) => assert.ok(Math.abs(a - b) < .00001, `${a} ~= ${b}`);

test('wheel zoom holds the detail under the cursor and Fit restores the whole office', () => {
  const { camera, room, viewport, event } = scene();
  camera.setZoom(2);
  const before = pointInMap(room, 430, 300);
  const wheel = event('wheel', { clientX: 430, clientY: 300, deltaY: -100, deltaMode: 0 });
  assert.ok(wheel.prevented);
  assert.ok(camera.zoom > 2);
  pointInMap(room, 430, 300).forEach((n, i) => close(n, before[i]));
  camera.setZoom(1);
  assert.equal(viewport.scrollLeft, 0); assert.equal(viewport.scrollTop, 0);
  assert.ok(parseFloat(room.style.width) <= viewport.clientWidth);
  assert.ok(parseFloat(room.style.height) <= viewport.clientHeight);
});

test('touch pinch zooms then transitions to one-finger pan without opening a coworker', () => {
  const { camera, viewport, event, captured } = scene();
  camera.setZoom(2);
  event('pointerdown', { pointerId: 1, clientX: 400, clientY: 350 });
  event('pointerdown', { pointerId: 2, clientX: 600, clientY: 350 });
  event('pointermove', { pointerId: 2, clientX: 700, clientY: 350 });
  close(camera.zoom, 3);
  event('pointerup', { pointerId: 2 });
  const scroll = viewport.scrollLeft;
  event('pointermove', { pointerId: 1, clientX: 360, clientY: 350 });
  close(viewport.scrollLeft, scroll + 40);
  event('pointerup', { pointerId: 1 });
  assert.equal(captured.size, 0);
  const click = event('click');
  assert.ok(click.prevented && click.stopped);
  event('pointerdown'); event('pointerup');
  assert.ok(!event('click').prevented, 'a fresh tap can still open a coworker');
});

test('mouse drag pans, while clicks and tiny movements remain normal clicks', () => {
  const { camera, viewport, event } = scene();
  camera.setZoom(3);
  const before = viewport.scrollLeft;
  event('pointerdown', { pointerType: 'mouse' });
  event('pointermove', { pointerType: 'mouse', clientX: 450 });
  event('pointerup', { pointerType: 'mouse' });
  close(viewport.scrollLeft, before + 50);
  assert.ok(event('click').stopped);
  event('pointerdown', { pointerType: 'mouse' });
  event('pointermove', { pointerType: 'mouse', clientX: 502 });
  event('pointerup', { pointerType: 'mouse' });
  assert.ok(!event('click').stopped);
});

test('trackpad pinch, Safari gesture fallback, bounds and cancel cleanup work', () => {
  const { camera, event, captured } = scene();
  event('wheel', { ctrlKey: true, deltaY: -100, deltaMode: 0 });
  assert.ok(camera.zoom > 1);
  camera.setZoom(2);
  event('gesturestart', { scale: 1 });
  event('gesturechange', { scale: 1.5 });
  close(camera.zoom, 3);
  event('wheel', { ctrlKey: true, deltaY: -100, deltaMode: 0 });
  close(camera.zoom, 3, 'Safari duplicate wheel is ignored');
  event('gestureend');
  event('pointerdown'); event('pointermove', { clientX: 400 }); event('pointercancel');
  assert.equal(captured.size, 0); assert.equal(camera.pointers.size, 0);
  camera.setZoom(99); assert.equal(camera.zoom, MAX_ZOOM);
  camera.setZoom(.1); assert.equal(camera.zoom, 1);
  assert.equal(wheelZoom(6, -1000), 6);
  assert.equal(wheelZoom(1, 1000), 1);
  assert.ok(wheelZoom(2, -3, 1) > 2);
});

test('small screens fit without clipping, keyboard controls do not hijack browser shortcuts', () => {
  const { camera, viewport, room, event } = scene(320, 180);
  assert.ok(parseFloat(room.style.height) < 180);
  event('keydown', { key: '+' }); assert.ok(camera.zoom > 1);
  assert.ok(!event('keydown', { key: '+', ctrlKey: true }).prevented);
  event('keydown', { key: '0' }); assert.equal(camera.zoom, 1);
  viewport.clientWidth = 700; viewport.clientHeight = 400; camera.resize();
  assert.ok(parseFloat(room.style.width) <= 700 && parseFloat(room.style.height) <= 400);
  camera.destroy(); assert.equal(event('wheel', { deltaY: -100 }).prevented, undefined);
});
