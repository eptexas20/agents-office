// View controls only: never changes world coordinates or agent state.
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 6;
export const clampZoom = value => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
export const wheelZoom = (zoom, delta, mode = 0, page = 600) =>
  clampZoom(zoom * Math.exp(-Math.max(-240, Math.min(240, delta * (mode === 1 ? 16 : mode === 2 ? page : 1))) * .0025));
export const pinchGeometry = points => {
  const [a, b] = points;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) };
};

export class OfficeCamera {
  constructor(viewport, room, { width, height, onChange = () => {} }) {
    this.viewport = viewport; this.room = room;
    this.width = width; this.height = height; this.zoom = 1; this.onChange = onChange; this.lastManual = -Infinity;
    this.pointers = new Map(); this.gesture = null; this.suppressClickUntil = 0;
    this.handlers = [];
    const on = (type, handler, options) => {
      viewport.addEventListener(type, handler, options);
      this.handlers.push([type, handler, options]);
    };
    on('wheel', e => {
      e.preventDefault();
      this.stopGlide(); this.lastManual = performance.now();
      if (this.safariGesture) return;
      if (e.shiftKey && !e.ctrlKey) {
        viewport.scrollLeft += e.deltaX || e.deltaY;
      } else this.setZoom(wheelZoom(this.zoom, e.deltaY, e.deltaMode, viewport.clientHeight), { x: e.clientX, y: e.clientY });
    }, { passive: false });
    on('pointerdown', e => this.pointerDown(e));
    on('pointermove', e => this.pointerMove(e), { passive: false });
    on('pointerup', e => this.pointerEnd(e));
    on('pointercancel', e => this.pointerEnd(e));
    on('lostpointercapture', e => this.pointerEnd(e));
    on('click', e => {
      if (performance.now() < this.suppressClickUntil) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    on('dragstart', e => e.preventDefault());
    on('keydown', e => {
      if (e.target !== viewport || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '+' || e.key === '=') this.setZoom(this.zoom * 1.25);
      else if (e.key === '-') this.setZoom(this.zoom / 1.25);
      else if (e.key === '0' || e.key === 'Home') this.setZoom(1);
      else if (e.key === 'ArrowLeft') viewport.scrollLeft -= 80;
      else if (e.key === 'ArrowRight') viewport.scrollLeft += 80;
      else if (e.key === 'ArrowUp') viewport.scrollTop -= 80;
      else if (e.key === 'ArrowDown') viewport.scrollTop += 80;
      else return;
      e.preventDefault();
    });
    // Safari trackpads expose GestureEvent; Chromium/Firefox send ctrl+wheel.
    on('gesturestart', e => {
      e.preventDefault();
      if (this.pointers.size < 2) this.safariGesture = { zoom: this.zoom, scale: e.scale || 1 };
    }, { passive: false });
    on('gesturechange', e => {
      e.preventDefault();
      if (this.safariGesture && this.pointers.size < 2)
        this.setZoom(this.safariGesture.zoom * e.scale / this.safariGesture.scale,
          Number.isFinite(e.clientX) ? { x: e.clientX, y: e.clientY } : undefined);
    }, { passive: false });
    on('gestureend', e => { e.preventDefault(); this.safariGesture = null; }, { passive: false });
    this.resize();
  }

  center() {
    const r = this.viewport.getBoundingClientRect();
    return { x: r.left + this.viewport.clientWidth / 2, y: r.top + this.viewport.clientHeight / 2 };
  }

  resize() { this.setZoom(this.zoom); }

  setZoom(value, anchor = this.center()) {
    if (!Number.isFinite(value)) return;
    const before = this.room.getBoundingClientRect();
    const x = before.width ? (anchor.x - before.left) / before.width : .5;
    const y = before.height ? (anchor.y - before.top) / before.height : .5;
    this.zoom = clampZoom(value);
    // No minimum pixel size: even small phones can fit the entire map.
    const fit = Math.max(.01, Math.min((this.viewport.clientWidth - 16) / this.width, (this.viewport.clientHeight - 16) / this.height));
    this.room.style.width = `${this.width * fit * this.zoom}px`;
    this.room.style.height = `${this.height * fit * this.zoom}px`;
    const after = this.room.getBoundingClientRect();
    if (this.zoom === 1) { this.viewport.scrollLeft = 0; this.viewport.scrollTop = 0; }
    else {
      this.viewport.scrollLeft += after.left + x * after.width - anchor.x;
      this.viewport.scrollTop += after.top + y * after.height - anchor.y;
    }
    this.viewport.dataset.zoom = this.zoom.toFixed(3);
    this.viewport.classList.toggle('can-pan', this.zoom > 1);
    this.onChange(this.zoom);
  }

  // Glides to center a map point (in map pixels) at the given zoom.
  // The map point (in map pixels) at the middle of the viewport.
  viewCenter() {
    const room = this.room.getBoundingClientRect(), view = this.viewport.getBoundingClientRect();
    return {
      x: (view.left + this.viewport.clientWidth / 2 - room.left) / room.width * this.width,
      y: (view.top + this.viewport.clientHeight / 2 - room.top) / room.height * this.height,
    };
  }

  stopGlide() {
    if (this.glide) cancelAnimationFrame(this.glide);
    this.glide = 0;
  }

  focusOn(x, y, zoom, ms = 800) {
    this.stopGlide();
    const from = this.zoom, start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / ms), ease = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      this.setZoom(from + (zoom - from) * ease);
      const room = this.room.getBoundingClientRect(), view = this.viewport.getBoundingClientRect();
      const px = room.left + x / this.width * room.width, py = room.top + y / this.height * room.height;
      this.viewport.scrollLeft += (px - (view.left + this.viewport.clientWidth / 2)) * ease;
      this.viewport.scrollTop += (py - (view.top + this.viewport.clientHeight / 2)) * ease;
      this.glide = t < 1 ? requestAnimationFrame(step) : 0;
    };
    this.glide = requestAnimationFrame(step);
  }

  pointerDown(e) {
    this.stopGlide(); this.lastManual = performance.now();
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
    if (!this.pointers.size) this.suppressClickUntil = 0;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, dragging: false });
    if (this.pointers.size === 2) {
      this.gesture = pinchGeometry([...this.pointers.values()]);
      this.suppressClickUntil = Infinity;
      for (const id of this.pointers.keys()) this.viewport.setPointerCapture(id);
    }
    if (e.button === 1) e.preventDefault();
  }

  pointerMove(e) {
    const point = this.pointers.get(e.pointerId);
    if (!point) return;
    const oldX = point.x, oldY = point.y;
    point.x = e.clientX; point.y = e.clientY;
    if (this.pointers.size >= 2) {
      e.preventDefault();
      const next = pinchGeometry([...this.pointers.values()]);
      if (this.gesture?.distance > 2 && next.distance > 2) {
        this.setZoom(this.zoom * next.distance / this.gesture.distance, this.gesture);
        this.viewport.scrollLeft -= next.x - this.gesture.x;
        this.viewport.scrollTop -= next.y - this.gesture.y;
      }
      this.gesture = next;
    } else {
      if (!point.dragging && Math.hypot(point.x - point.startX, point.y - point.startY) < 5) return;
      e.preventDefault();
      if (!point.dragging) this.viewport.setPointerCapture(e.pointerId);
      point.dragging = true;
      this.viewport.scrollLeft -= point.x - oldX;
      this.viewport.scrollTop -= point.y - oldY;
      this.viewport.classList.add('panning');
      this.suppressClickUntil = Infinity;
    }
  }

  pointerEnd(e) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.delete(e.pointerId);
    if (this.viewport.hasPointerCapture(e.pointerId)) this.viewport.releasePointerCapture(e.pointerId);
    this.gesture = null;
    for (const p of this.pointers.values()) { p.startX = p.x; p.startY = p.y; }
    if (!this.pointers.size) {
      this.viewport.classList.remove('panning');
      if (this.suppressClickUntil === Infinity) this.suppressClickUntil = performance.now() + 350;
    }
  }

  destroy() {
    for (const [type, handler, options] of this.handlers) this.viewport.removeEventListener(type, handler, options);
    for (const id of this.pointers.keys()) if (this.viewport.hasPointerCapture(id)) this.viewport.releasePointerCapture(id);
    this.pointers.clear(); this.viewport.classList.remove('panning');
  }
}
