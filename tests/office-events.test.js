import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_SPOTS, STATIONS, createNavigator, isWalkable } from '../public/world-map.js';
import { OfficeLife } from '../public/office-life.js';

const plan = (life, group) => life.people.map((p, i) => ({ personId: p.id, spot: EVENT_SPOTS[group][i % EVENT_SPOTS[group].length].id }));
function runUntil(life, done, limit = 120) {
  for (let t = 0; t < limit; t += .05) {
    life.update(.05);
    for (const p of life.people) assert.ok(isWalkable(p), `${p.id} stays on clear floor at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    if (done()) return t;
  }
  return Infinity;
}

test('every gathering spot is walkable and reachable from every desk', () => {
  const navigator = createNavigator();
  for (const [group, spots] of Object.entries(EVENT_SPOTS)) {
    assert.ok(spots.length >= 8, `${group} fits the whole crew`);
    for (const spot of spots) {
      assert.ok(isWalkable(spot), `${spot.id} is walkable`);
      // Opposite corners of the office: the manager's room and the annex.
      for (const id of ['manager', 'support']) assert.ok(navigator.findPath(STATIONS[id], spot), `${id} reaches ${spot.id}`);
    }
  }
});

for (const group of Object.keys(EVENT_SPOTS)) {
  test(`the whole crew gathers in the ${group} and walks back`, () => {
    const life = new OfficeLife({ seed: 8, scheduleMode: 'demo' });
    // Kelvin's snack runs keep their own clock; keep him at the gathering for this check.
    for (const p of life.people) p.habitDue = Infinity;
    runUntil(life, () => false, 30);
    const joined = life.gather(group, plan(life, group), { label: group, speed: 2 });
    assert.equal(joined.length, life.people.length);
    assert.ok(runUntil(life, () => life.gathered(group).length === life.people.length) < 60, 'everyone arrives');
    life.dismiss(group);
    assert.equal(life.gathering, null);
    assert.ok(runUntil(life, () => life.people.every(p => life.atHome(p) && p.mode === 'desk')) < 60, 'everyone returns');
    for (const p of life.people) {
      assert.equal(p._crowd, false);
      assert.equal(p.speed, 1);
    }
  });
}

test('Kelvin walks to the vending machine about every five minutes and comes back', () => {
  const life = new OfficeLife({ seed: 3, scheduleMode: 'normal' });
  const kelvin = life.people.find(p => p.id === 'kelvin'), trips = [];
  life.onHabit = (p, phase) => { if (phase === 'arrive') { trips.push(life.time); assert.equal(p.station, 'vending'); } };
  runUntil(life, () => false, 30 * 60);
  assert.ok(trips.length >= 5 && trips.length <= 8, `${trips.length} vending trips in 30 minutes`);
  for (let i = 1; i < trips.length; i++) assert.ok(trips[i] - trips[i - 1] >= 200, 'trips are spaced out');
  assert.ok(runUntil(life, () => life.atHome(kelvin) && kelvin.mode === 'desk', 120) < 120, 'Kelvin gets back to his desk');
});

test('gatherings skip anyone talking with you or working, and release them cleanly', () => {
  const life = new OfficeLife({ seed: 2, scheduleMode: 'demo' });
  for (const p of life.people) p.habitDue = Infinity;
  life.select('evan');
  life.setTask('harris', 'working');
  const joined = life.gather('meeting', plan(life, 'meeting'), { label: 'Meeting' });
  assert.ok(!joined.includes('evan') && !joined.includes('harris'));
  runUntil(life, () => false, 5);
  // Selecting a walker mid-route pulls them out and freezes them for the conversation.
  life.select('june');
  const june = life.people.find(p => p.id === 'june');
  assert.equal(june.event, null);
  assert.equal(june.mode, 'held');
  life.setTask('nora', 'working');
  const nora = life.people.find(p => p.id === 'nora');
  assert.equal(nora.event, null);
  life.select(null);
  life.dismiss('meeting');
  life.setTask('harris', 'idle');
  life.setTask('nora', 'idle');
  assert.ok(runUntil(life, () => life.people.every(p => life.atHome(p) && p.mode === 'desk')) < 90, 'everyone returns');
});
