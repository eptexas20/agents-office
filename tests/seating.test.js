import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { OfficeLife } from '../public/office-life.js';
import { CREW, SEATS, STATIONS, seatFor, seatedPosition, isWalkable } from '../public/world-map.js';

const advance = (life, seconds) => { for (let i = 0; i < seconds * 10; i++) life.update(.1); };
const quiet = () => {
  const life = new OfficeLife({ seed: 29 });
  for (const p of life.people) { p.due = Infinity; p.postureDue = Infinity; p.habitDue = Infinity; }
  return life;
};

test('every coworker has seated artwork and a chair with a clear floor approach', () => {
  const frames = JSON.parse(fs.readFileSync(new URL('../public/assets/branch-coworkers-seated-v2.frames.json', import.meta.url)));
  const png = fs.readFileSync(new URL('../public/assets/branch-coworkers-seated-v2.png', import.meta.url));
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  const life = quiet();
  for (const p of life.people) {
    assert.ok(SEATS[p.home], p.name);
    assert.ok(isWalkable(p), `${p.name} can stand beside the chair`);
    assert.equal(p.pose, 'sit');
    assert.equal(p.seatBlend, 1);
    assert.equal(seatedPosition(p).x, SEATS[p.home].x);
    assert.equal(seatedPosition(p).y, SEATS[p.home].y);
    if (p.sprite) {
      // Character-specific artwork is loaded separately from the shared crew atlas.
      const source = fs.readFileSync(new URL(`../public/office-${p.sprite}.js`, import.meta.url), 'utf8');
      assert.match(source, /export (?:async )?function build\w+\(row\)/, `${p.name} has a sprite builder`);
      const characterPng = fs.readFileSync(new URL(`../public/assets/${p.sprite}-sprites.png`, import.meta.url));
      assert.equal(characterPng.toString('hex', 0, 8), '89504e470d0a1a0a', 'sprite asset is a PNG');
      assert.ok(characterPng.readUInt32BE(16) >= 512 && characterPng.readUInt32BE(20) >= 512, 'sprite sheet has enough resolution for 16 poses');
      continue;
    }
    assert.equal(frames.rows[p.row].length, 4);
    for (const f of frames.rows[p.row]) {
      assert.ok(f.w > 0 && f.h > 0 && f.x >= 0 && f.y >= 0);
      assert.ok(f.x + f.w <= width && f.y + f.h <= height);
    }
  }
  assert.equal(new Set(CREW.map(p => p.home)).size, CREW.length);
});

test('coworkers finish standing up before walking and sit after returning', () => {
  const life = quiet(), p = life.people[0], start = { x: p.x, y: p.y };
  assert.ok(life.go(p, 'water'));
  advance(life, .5);
  assert.equal(p.pose, 'stand');
  assert.ok(p.seatBlend > 0 && p.seatBlend < 1);
  assert.deepEqual({ x: p.x, y: p.y }, start, 'floor movement waits for the chair exit');
  for (let i = 0; i < 1800 && p.station !== 'water'; i++) life.update(.1);
  assert.equal(p.station, 'water');
  assert.equal(p.pose, 'stand', 'standing amenity does not get a seated pose');
  assert.equal(p.seatBlend, 0);
  assert.ok(life.go(p, p.home));
  for (let i = 0; i < 1800 && p.mode !== 'desk'; i++) life.update(.1);
  advance(life, 2);
  assert.equal(p.station, p.home);
  assert.equal(p.pose, 'sit');
  assert.equal(p.seatBlend, 1);
});

test('shared break chairs remain reserved and release when a coworker leaves', () => {
  const life = quiet(), [p, q] = life.people;
  p.activityKind = 'kitchen';
  assert.ok(life.go(p, 'kitchen'));
  assert.equal(life.go(q, 'kitchen'), false);
  for (let i = 0; i < 1800 && p.station !== 'kitchen'; i++) life.update(.1);
  advance(life, 2);
  assert.equal(p.pose, 'sit');
  assert.equal(p.seatBlend, 1);
  assert.equal(seatFor(p), SEATS.kitchen);
  assert.equal(life.reservations.get('kitchen'), p.id);
  assert.ok(life.go(p, p.home));
  for (let i = 0; i < 1800 && p.mode !== 'desk'; i++) life.update(.1);
  assert.ok(life.go(q, 'kitchen'), 'next visitor can use the shared chair');
});

test('stretches, selection and pause do not strand seated coworkers', () => {
  const life = quiet(), p = life.people[1];
  p.postureDue = 0;
  advance(life, 2);
  assert.equal(p.pose, 'stand');
  assert.equal(p.seatBlend, 0);
  assert.deepEqual({ x: p.x, y: p.y }, { x: STATIONS[p.home].x, y: STATIONS[p.home].y });
  advance(life, 30);
  assert.equal(p.pose, 'sit');
  life.select(p.id);
  life.setTask(p.id, 'working');
  const before = seatedPosition(p);
  advance(life, 30);
  assert.deepEqual(seatedPosition(p), before);
  life.select(null);
  life.paused = true;
  const time = life.time;
  advance(life, 30);
  assert.equal(life.time, time);
  life.paused = false;
  life.setTask(p.id, 'done');
  assert.ok(life.go(p, 'coffee'));
  advance(life, 5);
  assert.equal(p.seatBlend, 0);
  assert.equal(p.mode, 'walk');
});

test('normal opening becomes active quickly while keeping the rest of the office seated', () => {
  const life = new OfficeLife({ seed: 29 });
  let walked = false, stretched = false, seatedWithWalker = false;
  for (let i = 0; i < 1800; i++) {
    life.update(.1);
    walked ||= life.people.some(p => p.mode === 'walk' && p.seatBlend === 0);
    stretched ||= life.people.some(p => p.mode === 'desk' && p.pose === 'stand');
    seatedWithWalker ||= life.people.some(p => p.mode === 'walk') && life.people.some(p => p.pose === 'sit');
    assert.ok(life.awayCount() <= 2);
  }
  assert.ok(walked && stretched && seatedWithWalker);
});

test('reception standing breaks use clear floor instead of the chair footprint', () => {
  const life = quiet(), june = life.people.find(p => p.id === 'june');
  assert.equal(isWalkable({ x: 133, y: 432 }), false, 'reception chair blocks ordinary walking');
  june.postureDue = 0;
  advance(life, 2);
  assert.equal(june.pose, 'stand');
  assert.equal(june.seatBlend, 0);
  assert.ok(isWalkable(june));
  const visual = seatedPosition(june);
  assert.equal(visual.x, june.x);
  assert.equal(visual.y, june.y);
  assert.ok(Math.hypot(visual.x - SEATS.reception.x, visual.y - SEATS.reception.y) > 30);
  assert.ok(life.go(june, 'water'));
  for (let i = 0; i < 1800 && june.station !== 'water'; i++) {
    life.update(.1);
    assert.ok(isWalkable(june), 'reception exit stays on clear floor');
  }
  assert.equal(june.station, 'water');
});
