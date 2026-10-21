import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CREW, STATIONS, OBSTACLES, WAYPOINTS, MEET_PAIRS, WIDTH, createNavigator, isWalkable, segmentClear, destinationOf } from '../public/world-map.js';
import { OfficeLife, LIFE_CONFIG } from '../public/office-life.js';
import { normalizeThemeId, getTheme, THEME_IDS, decorationDepth, actorDepth, worldToScreen, PROP_FRAMES, HOLIDAY_ATLAS, CLEAN_PLATE } from '../public/office-themes.js';
import { stepWorld } from '../public/office-world.js';
import { ART } from '../public/office-holiday.js';

const position = p => ({ x: p.x, y: p.y });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function checkPath(path, label, avoid = []) {
  assert.ok(path && path.length >= 2, `${label}: route exists`);
  for (let i = 1; i < path.length; i++) {
    assert.ok(segmentClear(path[i - 1], path[i]), `${label}: segment ${i} clears furniture and walls`);
    const count = Math.ceil(distance(path[i - 1], path[i]));
    for (let step = 0; step <= count; step++) {
      const ratio = count ? step / count : 0;
      const p = { x: path[i - 1].x + (path[i].x - path[i - 1].x) * ratio, y: path[i - 1].y + (path[i].y - path[i - 1].y) * ratio };
      assert.ok(avoid.every(q => distance(p, q) >= 18.8), `${label}: avoids another coworker`);
    }
  }
}

test('all desks and amenities connect through collision-safe routes', () => {
  const nav = createNavigator();
  for (const [name, point] of Object.entries(STATIONS)) assert.ok(isWalkable(point), `${name} is on free floor`);
  for (const [a, start] of Object.entries(STATIONS)) {
    for (const [b, end] of Object.entries(STATIONS)) {
      const path = nav.findPath(start, end);
      checkPath(path, `${a} -> ${b}`);
      assert.deepEqual(position(path[0]), position(start));
      assert.deepEqual(position(path.at(-1)), position(end));
    }
  }
});

test('waypoints and meet spots stay walkable and connected', () => {
  const nav = createNavigator();
  for (const [name, point] of Object.entries(WAYPOINTS)) {
    assert.ok(isWalkable(point), `${name} walkable`);
    checkPath(nav.findPath(STATIONS.salesOne, point), `salesOne -> ${name}`);
  }
  for (const pair of MEET_PAIRS) {
    assert.ok(isWalkable(pair.a), pair.a.id);
    assert.ok(isWalkable(pair.b), pair.b.id);
    assert.ok(distance(pair.a, pair.b) >= 17, `${pair.id} keeps safe spacing`);
    checkPath(nav.findPath(pair.a, pair.b), pair.id);
  }
});

test('desks, walls and inaccessible rooms reject destinations and shortcuts', () => {
  const nav = createNavigator();
  for (const obstacle of OBSTACLES) {
    const p = { x: obstacle.x + obstacle.w / 2, y: obstacle.y + obstacle.h / 2 };
    assert.equal(isWalkable(p), false, obstacle.id);
    assert.equal(nav.findPath(STATIONS.salesOne, p), null, obstacle.id);
  }
  for (const p of [{ x: 420, y: 220 }, { x: 700, y: 230 }, { x: 900, y: 330 }, { x: 1020, y: 810 }, { x: -10, y: -10 }]) {
    assert.equal(nav.findPath(STATIONS.salesOne, p), null);
  }
  assert.equal(segmentClear(STATIONS.salesOne, STATIONS.salesTwo), false, 'sales desk blocks the straight line');
  assert.equal(segmentClear(STATIONS.salesTwo, STATIONS.coffee), false, 'kitchen wall and counters block the straight line');
});

test('routes avoid coworkers at desks and on the floor', () => {
  const nav = createNavigator();
  for (const p of CREW) {
    const avoid = CREW.filter(q => q !== p).map(q => STATIONS[q.home]);
    for (const stop of p.routine) checkPath(nav.findPath(STATIONS[p.home], STATIONS[stop], avoid), `${p.name} -> ${stop}`, avoid);
  }
  const avoid = [{ x: 331, y: 407 }];
  checkPath(nav.findPath({ x: 270, y: 400 }, { x: 380, y: 400 }, avoid), 'detour around person', avoid);
  assert.equal(nav.findPath(STATIONS.salesOne, STATIONS.water, [STATIONS.water]), null, 'occupied destination stays unavailable');
});

test('forty-five minutes of demo activity preserve collisions, reservations and returns', () => {
  const life = new OfficeLife({ seed: 42, scheduleMode: 'demo' });
  const returned = new Set();
  const kinds = new Set();
  // ~45 minutes of simulated time at demo cadence.
  for (let tick = 0; tick < 27_000; tick++) {
    const before = life.people.map(position);
    life.update(.1);
    for (const [index, p] of life.people.entries()) {
      assert.ok(isWalkable(p), `${p.name}: walkable at ${life.time.toFixed(1)}`);
      assert.ok(segmentClear(before[index], p), `${p.name}: continuous safe movement`);
      assert.ok(distance(before[index], p) <= 4.701, 'speed is bounded, no teleportation');
      if (p.trips > 0 && p.station === p.home && p.mode === 'desk') returned.add(p.id);
      if (p.id === 'priya' && p.station === p.home && !p.path.length) {
        assert.ok(p.y >= 690, 'Priya’s desk stays on the annex floor in front of the cubicle');
      }
      if (p.activityKind) kinds.add(p.activityKind);
      for (const q of life.people.slice(index + 1)) assert.ok(distance(p, q) >= 17, `${p.name} and ${q.name} never overlap`);
    }
    const travelers = life.people.filter(p => p.path.length);
    assert.ok(travelers.length <= 2, 'at most meeting partners travel together');
    if (travelers.length === 2) {
      assert.equal(travelers[0].meetWith, travelers[1].id);
      assert.equal(travelers[1].meetWith, travelers[0].id);
    }
    // Kelvin's vending runs are a scheduled habit outside the two-away leisure limit.
    assert.ok(life.awayCount() <= 2, 'most of the team stays at work');
    const destinations = life.people.map(p => p.destination);
    assert.equal(new Set(destinations).size, destinations.length, 'destinations are reserved');
  }
  for (const p of life.people) {
    assert.ok(p.trips >= 1, `${p.name} completed at least one outing (${p.trips} trips)`);
    assert.ok(returned.has(p.id), `${p.name} returned to their assigned desk`);
  }
  assert.ok(kinds.has('stay'), 'staying at desk remains a valid choice');
  assert.ok([...kinds].some(k => k !== 'stay'), 'other leisure activities occur');
  // Priya stays in front of the cubicle floor edge, not on the painted panel.
  const priya = life.people.find(p => p.id === 'priya');
  assert.equal(priya.home, 'support');
  assert.ok(STATIONS.support.y >= 690, 'Priya’s home is on the annex floor in front of the cubicle');
  if (priya.station === priya.home && !priya.path.length) assert.ok(priya.y >= 690);
});

test('normal schedule keeps most people settled over thirty simulated minutes', () => {
  const life = new OfficeLife({ seed: 7, scheduleMode: 'normal' });
  let maxAway = 0;
  let decisions = 0;
  const previousDue = new Map(life.people.map(p => [p.id, p.due]));
  for (let tick = 0; tick < 18_000; tick++) {
    life.update(.1);
    // Kelvin's vending runs are a scheduled habit outside the leisure limit.
    maxAway = Math.max(maxAway, life.awayCount());
    for (const p of life.people) {
      if (p.due !== previousDue.get(p.id) && p.station === p.home && p.mode === 'desk') {
        decisions++;
        previousDue.set(p.id, p.due);
      }
    }
  }
  assert.ok(maxAway <= 2);
  // With 15–30 minute decisions, half an hour should not produce the old rapid trip loops.
  const totalTrips = life.people.reduce((sum, p) => sum + p.trips, 0);
  assert.ok(totalTrips < 40, `calm schedule stays quiet (trips=${totalTrips})`);
  assert.ok(LIFE_CONFIG.modes.normal.decisionMin >= 900);
  assert.ok(LIFE_CONFIG.modes.demo.decisionMax <= 90);
});

test('conversation freezes one coworker, allows others to move, then resumes the trip', () => {
  const life = new OfficeLife({ seed: 3, scheduleMode: 'demo' }), mike = life.people[0];
  assert.ok(life.go(mike, 'water'));
  for (let i = 0; i < 30; i++) life.update(.1);
  life.select('mike');
  const stopped = position(mike);
  for (let i = 0; i < 900; i++) life.update(.1);
  assert.deepEqual(position(mike), stopped);
  assert.equal(life.activity(mike), 'Talking with you');
  assert.ok(life.people.slice(1).some(p => p.trips > 0), 'others continue while the selected coworker listens');
  life.select(null);
  for (let i = 0; i < 1800 && mike.trips === 0; i++) life.update(.1);
  assert.ok(mike.trips > 0, 'interrupted journey resumes safely');
});

test('pause freezes time and requests keep a coworker at their workstation', () => {
  const life = new OfficeLife({ seed: 11, scheduleMode: 'demo' }), mike = life.people[0];
  assert.ok(life.go(mike, 'water'));
  for (let i = 0; i < 40; i++) life.update(.1);
  life.setTask('mike', 'working');
  for (let i = 0; i < 900; i++) life.update(.1);
  assert.deepEqual(position(mike), position(STATIONS.manager));
  assert.equal(life.activity(mike), 'Working on your request');
  life.paused = true;
  const before = life.people.map(position), time = life.time;
  for (let i = 0; i < 200; i++) life.update(.1);
  assert.deepEqual(life.people.map(position), before);
  assert.equal(life.time, time);
  life.paused = false;
  life.setTask('mike', 'done');
  for (let i = 0; i < 4000; i++) life.update(.1);
  assert.ok(mike.trips >= 1, 'routine returns after the real task finishes');
});

test('seeded schedules are repeatable', () => {
  const a = new OfficeLife({ seed: 99, scheduleMode: 'demo' });
  const b = new OfficeLife({ seed: 99, scheduleMode: 'demo' });
  for (let i = 0; i < 5000; i++) { a.update(.1); b.update(.1); }
  const states = life => life.people.map(p => ({
    id: p.id, home: p.home, row: p.row, x: p.x, y: p.y,
    station: p.station, destination: p.destination, trips: p.trips, activityKind: p.activityKind,
  }));
  assert.deepEqual(states(a), states(b));
});

function quietOffice(seed = 5) {
  const life = new OfficeLife({ seed, scheduleMode: 'demo' });
  for (const p of life.people) { p.due = Infinity; p.habitDue = Infinity; }
  for (const p of life.people) if (p.id !== 'mike' && p.id !== 'evan') p.task = 'working';
  return life;
}

function pairOf(life) {
  return { mike: life.people[0], evan: life.people[1] };
}

test('meeting partners are cancelled cleanly when one is selected', () => {
  const life = quietOffice(5);
  const { mike, evan } = pairOf(life);
  mike.due = 0;
  evan.due = 0;
  assert.ok(life.startMeeting(mike));
  assert.equal(evan.meetWith, 'mike');
  life.update(0.1);
  const spot = mike.destination;
  assert.equal(mike.mode, 'walk');
  assert.ok(spot.startsWith('meet'));
  life.select('mike');
  assert.equal(mike.mode, 'held');
  assert.equal(mike.path.length, 0);
  assert.equal(mike.meetWith, null);
  assert.equal(evan.meetWith, null);
  assert.equal(evan._meetWait, false);
  assert.notEqual(mike.destination, spot);
  assert.equal(life.reservations.get(spot), undefined);
  life.select(null);
  for (let i = 0; i < 8000 && (mike.mode !== 'desk' || evan.mode !== 'desk' || mike.station !== mike.home || evan.station !== evan.home); i++) {
    life.update(0.1);
  }
  assert.equal(mike.mode, 'desk');
  assert.equal(mike.station, mike.home);
  assert.equal(mike.destination, mike.home);
  assert.equal(evan.mode, 'desk');
  assert.equal(evan.station, evan.home);
  assert.equal(evan.destination, evan.home);
  assert.equal(evan._meetWait, false);
  assert.equal(evan.meetWith, null);
  assert.equal(life.reservations.get(spot), undefined);
});

test('theme ids validate and holiday themes declare decorations', () => {
  assert.equal(normalizeThemeId('nope'), 'everyday');
  assert.equal(normalizeThemeId('halloween'), 'halloween');
  for (const id of THEME_IDS) {
    const theme = getTheme(id);
    assert.equal(theme.id, id);
    assert.ok(theme.label);
    if (id === 'everyday') assert.equal(theme.decorations.length, 0);
    else {
      assert.ok(theme.decorations.length >= 3, `${id} has visible decorations`);
      const focal = theme.decorations.filter(d => d.focal);
      assert.ok(focal.some(d => d.w >= 70 || d.h >= 80), `${id} has a prominent focal prop`);
      assert.ok(theme.decorations.some(d => d.footprint), `${id} protects the main-office display`);
      for (const deco of theme.decorations) {
        assert.ok(PROP_FRAMES[deco.sprite] || ART[deco.art], `${deco.id}: painted sprite or drawing exists`);
        assert.ok(['floor', 'wall', 'surface'].includes(deco.layer), deco.id);
        assert.equal(typeof deco.baseline, 'number');
        assert.ok(deco.w > 0 && deco.h > 0);
      }
    }
  }
  assert.ok(fs.existsSync(new URL(`../public${HOLIDAY_ATLAS}`, import.meta.url)));
  assert.ok(fs.existsSync(new URL(`../public${CLEAN_PLATE}`, import.meta.url)));
  const css = fs.readFileSync(new URL('../public/office.css', import.meta.url), 'utf8');
  assert.equal(css.includes('.theme-decorations'), false);
  assert.doesNotMatch(css, /\.theme-deco\s*\{[^}]*min-width/);
  assert.doesNotMatch(css, /\.theme-deco\s*\{[^}]*min-height/);
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const stage = html.slice(html.indexOf('id="stage"'), html.indexOf('</main>'));
  assert.ok(stage.includes('id="notice"'));
  const office = fs.readFileSync(new URL('../public/office.js', import.meta.url), 'utf8');
  assert.equal(office.match(/exitFullscreen/g).length, 1);
  assert.match(office, /Exit presentation/);
  assert.match(office, /Exit fullscreen/);
});

test('decoration depth interleaves with coworkers and scales in world units', () => {
  const tree = getTheme('christmas').decorations.find(d => d.id === 'xm-tree');
  const depth = decorationDepth(tree);
  assert.equal(depth, actorDepth(tree.baseline));
  assert.ok(actorDepth(tree.baseline - 30) < depth, 'a coworker behind the pot is behind the tree');
  assert.ok(actorDepth(tree.baseline + 24) > depth, 'a coworker in front of the pot covers the tree');
  const fitted = worldToScreen(40, 885, WIDTH);
  assert.ok(Math.abs(fitted - 23.05) < 0.2, 'a 40-world-pixel prop is about 23 screen pixels at 885px, with no minimum');
  const treeFit = worldToScreen(tree.w, 885, WIDTH);
  const treeZoom = worldToScreen(tree.w, 1770, WIDTH);
  assert.ok(Math.abs(treeZoom / treeFit - 2) < 0.001);
});

test('seeded demo schedules actually start and finish meetings', () => {
  for (const seed of [42, 5, 11]) {
    const life = new OfficeLife({ seed, scheduleMode: 'demo' });
    let samples = 0;
    let atDesk = 0;
    for (let i = 0; i < 36_000; i++) {
      life.update(0.1);
      if (i % 20 === 0) {
        samples++;
        const away = life.awayCount();
        assert.ok(away <= 2);
        atDesk += life.people.length - away;
        const travelers = life.people.filter(p => p.path.length);
        assert.ok(travelers.length <= 2);
        if (travelers.length === 2) {
          assert.equal(travelers[0].meetWith, travelers[1].id);
          assert.equal(travelers[1].meetWith, travelers[0].id);
        }
      }
    }
    assert.ok(life.meetingStarts >= 1, `seed ${seed} starts a meeting (${life.meetingStarts})`);
    assert.ok(life.meetingCompletes >= 1, `seed ${seed} finishes a meeting (${life.meetingCompletes})`);
    // Route lengths change the interleaving of random decisions. Repeatability
    // of a second conversation is checked explicitly below, not by one seed's count.
    assert.ok(atDesk / (samples * life.people.length) > 0.75, `seed ${seed} keeps most people settled`);
    for (const p of life.people) assert.equal(p._meetWait, false);
  }
});

test('coworkers can finish a conversation, return, and meet again after cooldown', () => {
  const life = quietOffice(42);
  const { mike, evan } = pairOf(life);
  for (let round = 1; round <= 2; round++) {
    assert.ok(life.startMeeting(mike), `conversation ${round} starts`);
    for (let i = 0; i < 8000; i++) {
      life.update(.1);
      for (const p of [mike, evan]) if (p.mode === 'desk') p.due = Infinity;
      if (life.meetingCompletes === round && [mike, evan].every(p =>
        p.mode === 'desk' && p.station === p.home && life.time >= p.meetReadyAt)) break;
    }
    assert.equal(life.meetingCompletes, round);
    for (const p of [mike, evan]) {
      assert.equal(p.mode, 'desk');
      assert.equal(p.station, p.home);
      assert.equal(p.meetWith, null);
    }
    for (const pair of MEET_PAIRS) {
      assert.equal(life.reservations.has(pair.a.id), false);
      assert.equal(life.reservations.has(pair.b.id), false);
    }
  }
});

test('both meeting arrival orders share one deadline and then go home', () => {
  const first = quietOffice(5);
  const a = pairOf(first);
  assert.ok(first.startMeeting(a.mike));
  let leader = null;
  for (let i = 0; i < 8000; i++) {
    first.update(0.1);
    const mikeThere = a.mike.station === a.mike.meetSpot && !a.mike.path.length;
    const evanThere = a.evan.station === a.evan.meetSpot && !a.evan.path.length;
    if (!leader && mikeThere !== evanThere) leader = mikeThere ? 'mike' : 'evan';
    if (mikeThere && evanThere) break;
  }
  assert.ok(leader);
  assert.equal(a.mike._meetWait, false);
  assert.equal(a.evan._meetWait, false);
  assert.equal(a.mike.due, a.evan.due);
  for (let i = 0; i < 8000 && (a.mike.mode !== 'desk' || a.evan.mode !== 'desk'); i++) first.update(0.1);
  assert.equal(a.mike.station, a.mike.home);
  assert.equal(a.evan.station, a.evan.home);
  assert.equal(a.mike.meetWith, null);
  assert.equal(a.evan._meetWait, false);
  assert.ok(first.meetingCompletes >= 1);

  const second = quietOffice(5);
  const b = pairOf(second);
  assert.ok(second.startMeeting(b.mike));
  const dest = destinationOf(b.evan.meetSpot);
  const near = [
    { x: dest.x - 10, y: dest.y },
    { x: dest.x + 10, y: dest.y },
    { x: dest.x, y: dest.y - 10 },
    { x: dest.x, y: dest.y + 10 },
  ].find(point => isWalkable(point) && segmentClear(point, dest));
  assert.ok(near, 'a step away from the meet spot is walkable');
  b.evan.x = near.x;
  b.evan.y = near.y;
  b.evan.path = [{ x: dest.x, y: dest.y }];
  let evanFirst = false;
  for (let i = 0; i < 8000; i++) {
    second.update(0.1);
    const evanThere = b.evan.station === b.evan.meetSpot && !b.evan.path.length;
    const mikeThere = b.mike.station === b.mike.meetSpot && !b.mike.path.length;
    if (evanThere && !mikeThere) { evanFirst = true; break; }
    if (evanThere && mikeThere) break;
  }
  assert.equal(evanFirst, true);
  assert.equal(b.evan._meetWait, true);
  for (let i = 0; i < 8000 && (b.mike.station !== b.mike.meetSpot || b.mike.path.length); i++) second.update(0.1);
  assert.equal(b.mike._meetWait, false);
  assert.equal(b.evan._meetWait, false);
  assert.equal(b.mike.due, b.evan.due);
});

test('a failed partner route does not keep a meeting reservation', () => {
  const life = quietOffice(5);
  const { mike, evan } = pairOf(life);
  evan.x = 4;
  evan.y = 4;
  assert.equal(isWalkable(evan), false);
  assert.equal(life.startMeeting(mike), false);
  assert.equal(mike.meetWith, null);
  assert.equal(evan.meetWith, null);
  assert.equal(mike._meetWait, false);
  assert.equal(evan._meetWait, false);
  for (const pair of MEET_PAIRS) {
    assert.equal(life.reservations.get(pair.a.id), undefined);
    assert.equal(life.reservations.get(pair.b.id), undefined);
  }
  assert.equal(mike.destination, mike.home);
  assert.notEqual(mike.mode, 'walk');
});

test('cancelling after both arrive clears the wait and returns them', () => {
  const life = quietOffice(5);
  const { mike, evan } = pairOf(life);
  assert.ok(life.startMeeting(mike));
  const spot = mike.meetSpot;
  for (let i = 0; i < 8000 && (mike.station !== mike.meetSpot || evan.station !== evan.meetSpot || mike.path.length || evan.path.length); i++) {
    life.update(0.1);
  }
  assert.equal(mike._meetWait, false);
  assert.equal(evan._meetWait, false);
  life.select('mike');
  assert.equal(mike.mode, 'held');
  assert.equal(mike.meetWith, null);
  assert.equal(evan.meetWith, null);
  assert.equal(evan._meetWait, false);
  assert.equal(life.reservations.get(spot), mike.id, 'Mike still occupies the spot he is standing on');
  life.select(null);
  for (let i = 0; i < 8000 && (mike.mode !== 'desk' || evan.mode !== 'desk'); i++) life.update(0.1);
  assert.equal(mike.station, mike.home);
  assert.equal(evan.station, evan.home);
  assert.equal(evan._meetWait, false);
  assert.equal(life.reservations.get(spot), undefined);
});

test('real work drops a pending circuit instead of resuming it', () => {
  const life = new OfficeLife({ seed: 5, scheduleMode: 'demo' });
  for (const p of life.people) { p.due = Infinity; p.habitDue = Infinity; }
  const mike = life.people[0];
  life.random = () => 0.99;
  assert.ok(life.startWalk(mike));
  assert.deepEqual(mike.circuit, ['kitchenHall', 'coffee', 'lounge']);
  let guard = 0;
  while (!mike._pendingCircuit && guard++ < 8000) life.update(0.1);
  assert.equal(mike._pendingCircuit, 'coffee');
  assert.equal(mike.station, 'kitchenHall');
  life.setTask('mike', 'working');
  guard = 0;
  while ((mike.station !== mike.home || mike.mode !== 'desk') && guard++ < 8000) life.update(0.1);
  assert.equal(mike.station, mike.home);
  assert.equal(mike.mode, 'desk');
  assert.equal(mike._pendingCircuit, null);
  assert.equal(mike.circuit, null);
  assert.equal(mike.destination, mike.home);
  life.setTask('mike', 'done');
  const due = mike.due;
  life.update(0.1);
  assert.equal(mike.mode, 'desk');
  assert.equal(mike.destination, mike.home);
  assert.equal(mike.path.length, 0);
  assert.equal(mike._pendingCircuit, null);
  assert.equal(mike.due, due);
  assert.ok(mike.due - life.time >= LIFE_CONFIG.modes.demo.decisionMin - 0.2);
  for (let i = 0; i < 200; i++) life.update(0.1);
  assert.equal(mike.mode, 'desk');
  assert.equal(mike.station, mike.home);
});

test('opening outings are staggered, then normal decisions stay inside 15 to 30 minutes', () => {
  const life = new OfficeLife({ seed: 7 });
  for (const p of life.people) {
    assert.ok(p.due >= 25 + p.index * 100);
    assert.ok(p.due <= 75 + p.index * 100);
  }
  life.setScheduleMode('demo');
  for (const p of life.people) {
    const wait = p.due - life.time;
    assert.ok(wait >= LIFE_CONFIG.modes.demo.decisionMin);
    assert.ok(wait <= LIFE_CONFIG.modes.demo.decisionMax);
  }
  life.setScheduleMode('normal');
  for (const p of life.people) {
    const wait = p.due - life.time;
    assert.ok(wait >= LIFE_CONFIG.modes.normal.decisionMin);
    assert.ok(wait <= LIFE_CONFIG.modes.normal.decisionMax);
  }
  const mike = life.people[0];
  life.setTask('mike', 'working');
  life.setTask('mike', 'done');
  const rest = mike.due - life.time;
  assert.ok(rest >= LIFE_CONFIG.modes.normal.decisionMin);
  assert.ok(rest <= LIFE_CONFIG.modes.normal.decisionMax);
  const before = life.time;
  assert.equal(stepWorld(life, 30, true), false);
  assert.equal(life.time, before);
  stepWorld(life, 30, false);
  assert.ok(life.time - before <= 0.1001);
  assert.equal(mike.mode, 'desk');
  life.people[1].mode = 'break';
  life.people[1].station = 'water';
  life.people[2].mode = 'break';
  life.people[2].station = 'coffee';
  mike.due = life.time;
  life.update(0.1);
  assert.equal(mike.mode, 'desk');
  assert.ok(mike.due - life.time >= LIFE_CONFIG.modes.normal.retryMin - 0.2);
});
