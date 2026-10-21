import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficeLife } from '../public/office-life.js';
import { STATIONS, MEET_PAIRS, WAYPOINTS, createNavigator } from '../public/world-map.js';
import { themeObstacles, getTheme } from '../public/office-themes.js';

function quietOffice() {
  const life = new OfficeLife({ seed: 5, scheduleMode: 'demo' });
  for (const p of life.people) { p.due = Infinity; p.habitDue = Infinity; }
  return life;
}
function until(life, condition, limit = 3000) {
  for (let i = 0; i < limit && !condition(); i++) life.update(.1);
  assert.ok(condition(), 'reached expected state without a stuck route');
}

test('main-office seasonal corner preserves room access and rejects shortcuts through props', () => {
  const obstacles = themeObstacles('christmas');
  const nav = createNavigator(obstacles);
  const tree = getTheme('christmas').decorations.find(d => d.id === 'xm-tree');
  assert.ok(tree.x < 980 && tree.baseline >= 351, 'tree stands outside conference room, not in break room');
  const center = { x: 917, y: 360 };
  assert.equal(nav.isWalkable(center), false);
  assert.equal(nav.findPath(STATIONS.manager, center), null);
  assert.equal(nav.segmentClear({ x: 840, y: 360 }, { x: 976, y: 360 }), false);
  assert.equal(nav.isWalkable({ x: 740, y: 359 }), true, 'conference doorway remains open');
  const destinations = [...Object.values(STATIONS), ...Object.values(WAYPOINTS), ...MEET_PAIRS.flatMap(p => [p.a, p.b])];
  for (const target of destinations) {
    const path = nav.findPath(STATIONS.manager, target);
    assert.ok(path, `holiday route to ${target.label} exists`);
    for (let i = 1; i < path.length; i++) assert.ok(nav.segmentClear(path[i - 1], path[i]));
  }
});

test('theme changes refuse occupied footprints and safely replan existing trips', () => {
  const life = quietOffice(), p = life.people[0];
  p.x = 917; p.y = 360;
  const before = life.navigator;
  assert.equal(life.setObstacles(themeObstacles('christmas')), false);
  assert.equal(life.navigator, before, 'failed switch preserves old navigation');
  Object.assign(p, { x: STATIONS.manager.x, y: STATIONS.manager.y });
  assert.ok(life.go(p, 'coffee'));
  life.update(.1);
  const location = { x: p.x, y: p.y };
  assert.equal(life.setObstacles(themeObstacles('christmas')), true);
  assert.deepEqual({ x: p.x, y: p.y }, location, 'no teleport on theme switch');
  until(life, () => p.station === 'coffee' && !p.path.length);
  assert.ok(life.navigator.isWalkable(p));
  assert.equal(life.setObstacles([]), true);
  assert.equal(life.navigator.isWalkable({ x: 917, y: 360 }), true, 'Everyday restores open floor');
});

test('selected coworker finishes real work before chat closes and returns home instead of resuming leisure', () => {
  const life = quietOffice(), p = life.people[0];
  assert.ok(life.go(p, 'water'));
  for (let i = 0; i < 80; i++) life.update(.1);
  life.select(p.id);
  const stopped = { x: p.x, y: p.y };
  life.setTask(p.id, 'working');
  life.setTask(p.id, 'done');
  for (let i = 0; i < 20; i++) life.update(.1);
  assert.deepEqual({ x: p.x, y: p.y }, stopped);
  life.select(null);
  until(life, () => life.atHome(p) && p.mode === 'desk');
  assert.equal(life.reservations.has('water'), false);
  assert.equal(p._pendingCircuit, null);
  assert.ok(p.due > life.time);
});

test('selecting a returning coworker resumes the trip even when last station equals destination', () => {
  const life = quietOffice(), p = life.people[0];
  assert.ok(life.go(p, 'water'));
  for (let i = 0; i < 60; i++) life.update(.1);
  assert.ok(life.go(p, p.home));
  life.update(.1);
  assert.equal(p.station, p.home);
  assert.equal(p.destination, p.home);
  assert.equal(life.atHome(p), false);
  life.select(p.id); life.select(null);
  until(life, () => life.atHome(p) && p.mode === 'desk');
});

test('walk-circuit pauses honor the planned dwell deadline', () => {
  const life = quietOffice(), p = life.people[0];
  assert.ok(life.startWalk(p));
  until(life, () => !!p._pendingCircuit);
  const stopped = { x: p.x, y: p.y }, next = p._pendingCircuit;
  for (let i = 0; i < 10; i++) life.update(.1);
  assert.deepEqual({ x: p.x, y: p.y }, stopped);
  assert.equal(p._pendingCircuit, next);
  until(life, () => p.mode === 'walk');
  assert.equal(p.destination, next);
});

test('every holiday keeps desks, break spots and gathering spots reachable', async () => {
  const { THEME_IDS } = await import('../public/office-themes.js');
  const { EVENT_SPOTS } = await import('../public/world-map.js');
  const targets = [...Object.values(STATIONS), ...Object.values(WAYPOINTS), ...MEET_PAIRS.flatMap(p => [p.a, p.b]),
    ...Object.values(EVENT_SPOTS).flat()];
  for (const id of THEME_IDS) {
    const nav = createNavigator(themeObstacles(id));
    for (const target of targets) {
      assert.ok(nav.isWalkable(target), `${id}: ${target.id || target.label} stays clear`);
      assert.ok(nav.findPath(STATIONS.reception, target), `${id}: reception reaches ${target.id || target.label}`);
    }
  }
});
