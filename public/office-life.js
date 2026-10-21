import {
  CREW, STATIONS, destinationOf, MEET_PAIRS, WALK_CIRCUITS,
  createNavigator, POSE_SUPPORT, seatFor,
} from './world-map.js';

// Ambient scheduling only. Never calls providers or sends agent messages.
export const LIFE_CONFIG = {
  modes: {
    // One window for a normal leisure decision. Retries repeat the same plan, then wait again.
    normal: { decisionMin: 15 * 60, decisionMax: 30 * 60, retryMin: 120, retryMax: 240, meetCooldown: 15 * 60 },
    demo: { decisionMin: 30, decisionMax: 90, retryMin: 8, retryMax: 16, meetCooldown: 45 },
  },
  dwell: {
    amenity: [25, 90],
    kitchen: [45, 150],
    visit: [30, 100],
    meet: [20, 75],
  },
  maxPlanTries: 2,
  meetWait: 45,
  maxAway: 2,
  // Longer outings retain the 15–30 minute clock. Desk posture changes run separately.
  weights: [
    { id: 'stay', weight: 42 },
    { id: 'copy', weight: 10 },
    { id: 'water', weight: 10 },
    { id: 'coffee', weight: 8 },
    { id: 'kitchen', weight: 8 },
    { id: 'meeting', weight: 6 },
    { id: 'lounge', weight: 6 },
    { id: 'meet', weight: 7 },
    { id: 'walk', weight: 3 },
  ],
};

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(choices, random) {
  const total = choices.reduce((sum, c) => sum + c.weight, 0);
  let roll = random() * total;
  for (const choice of choices) {
    roll -= choice.weight;
    if (roll <= 0) return choice.id;
  }
  return choices.at(-1)?.id || 'stay';
}

function range(bounds, random) {
  const [lo, hi] = bounds;
  return lo + random() * (hi - lo);
}

function decisionDelay(random, mode, index, count) {
  const timing = LIFE_CONFIG.modes[mode];
  const span = timing.decisionMax - timing.decisionMin;
  const phase = (index / count) * span;
  const roll = random() * span;
  return timing.decisionMin + ((roll + phase) % span);
}

// Simulation has no DOM or provider calls: ambient life never runs agent tasks.
export class OfficeLife {
  constructor(options = {}) {
    this.navigator = createNavigator();
    this.random = typeof options.random === 'function'
      ? options.random
      : typeof options.seed === 'number' ? mulberry32(options.seed) : Math.random;
    this.scheduleMode = options.scheduleMode === 'demo' ? 'demo' : 'normal';
    this.time = 0;
    this.paused = false;
    this.reservations = new Map();
    this.meetings = new Map();
    this.meetingStarts = 0;
    this.meetingCompletes = 0;
    this.gathering = null;
    const count = CREW.length;
    this.people = CREW.map((member, index) => {
      const home = STATIONS[member.home];
      return {
        ...member,
        index,
        ...home,
        station: member.home,
        destination: member.home,
        path: [],
        mode: 'desk',
        facing: home.facing,
        pose: 'sit',
        seatBlend: 1,
        postureDue: 35 + index * 13,
        selected: false,
        task: 'idle',
        connected: false,
        activityKind: 'stay',
        meetWith: null,
        meetSpot: null,
        meetReadyAt: 0,
        circuit: null,
        circuitStep: 0,
        // Open into a workday already in progress, with staggered first outings.
        // Subsequent normal decisions still use the user's 15–30 minute cadence.
        due: this.scheduleMode === 'normal' ? 25 + index * 100 + this.random() * 50
          : decisionDelay(this.random, this.scheduleMode, index, count),
        wait: 0,
        walkTime: 0,
        trips: 0,
        _planned: this.scheduleMode === 'normal' ? member.routine[index % member.routine.length] : null,
        _planTries: 0,
        _pendingCircuit: null,
        _pendingHome: false,
        _meetWait: false,
        _heldAway: false,
        _occupiedSpot: null,
        event: null,
        eventLabel: '',
        speed: 1,
        _eventTarget: null,
        _crowd: false,
        habitDue: member.habit ? range(member.habit.first, this.random) : Infinity,
      };
    });
    for (const p of this.people) this.reservations.set(p.home, p.id);
  }

  timing() {
    return LIFE_CONFIG.modes[this.scheduleMode];
  }

  setObstacles(obstacles) {
    const navigator = createNavigator(obstacles);
    // A theme cannot materialize furniture through a coworker, including one selected by the user.
    if (this.people.some(p => !navigator.isWalkable(p))) return false;
    this.navigator = navigator;
    for (const p of this.people) {
      if (!p.path.length) continue;
      const route = navigator.findPath(p, destinationOf(p.destination), this.people.filter(q => q !== p));
      p.path = route ? route.slice(1) : [];
      p.wait = 0;
    }
    return true;
  }

  scheduleDecision(p) {
    p.due = this.time + decisionDelay(this.random, this.scheduleMode, p.index, this.people.length);
  }

  setScheduleMode(mode) {
    this.scheduleMode = mode === 'demo' ? 'demo' : 'normal';
    for (const p of this.people) if (p.habit) {
      const every = p.habit.every[this.scheduleMode] || p.habit.every.normal;
      p.habitDue = Math.min(p.habitDue, this.time + range(every, this.random));
    }
    for (const p of this.people) {
      if (p.mode === 'desk' && p.station === p.home && !p.selected && p.task !== 'working') {
        p._planned = null;
        p._planTries = 0;
        this.scheduleDecision(p);
      }
    }
  }

  atHome(p) {
    const home = STATIONS[p.home];
    return p.station === p.home && Math.hypot(p.x - home.x, p.y - home.y) < 1.25;
  }

  // Drops a leisure itinerary. Does not itself start a new route.
  clearLeisure(p) {
    p._pendingCircuit = null;
    p._pendingHome = false;
    p._meetWait = false;
    p._planned = null;
    p._planTries = 0;
    p.circuit = null;
    p.circuitStep = 0;
  }

  releaseSpot(id, personId) {
    if (id && this.reservations.get(id) === personId) this.reservations.delete(id);
  }

  select(id) {
    for (const p of this.people) {
      const willSelect = p.id === id;
      if (willSelect && !p.selected) {
        if (p.event) { this.leaveEvent(p); this.freezeSelected(p); }
        else if (p.meetWith || p.activityKind === 'meet' || p.meetSpot) this.cancelMeeting(p, 'selected');
        else if (p.path.length) p.path = [];
      }
      if (p.selected && !willSelect && (p.mode === 'held' || p._heldAway)) {
        // Clear the flag before routing home. sendHome ignores a still-selected person.
        p.selected = false;
        p._heldAway = false;
        if (p.task === 'working') {
          if (!this.atHome(p)) this.go(p, p.home);
          else { p.mode = 'desk'; p.destination = p.home; p.path = []; }
        } else this.sendHome(p);
      }
      p.selected = willSelect;
    }
  }

  setTask(id, status) {
    const p = this.people.find(person => person.id === id);
    if (!p) return;
    p.task = status;
    if (status === 'working') {
      if (p.event) this.leaveEvent(p);
      this.cancelMeeting(p, 'busy');
      this.clearLeisure(p);
      if (p.selected && !this.atHome(p)) {
        this.freezeSelected(p);
        return;
      }
      if (!p.selected && !this.atHome(p)) this.go(p, p.home);
      return;
    }
    // Finished work waits out a full new decision. The old circuit must not resume.
    this.clearLeisure(p);
    if (this.atHome(p) && p.mode !== 'walk') {
      p.mode = 'desk';
      p.path = [];
      p.destination = p.home;
      this.scheduleDecision(p);
    }
  }

  activity(p) {
    if (p.task === 'working') return p.mode === 'walk' && !p.selected ? 'Returning to work' : 'Working on your request';
    if (p.selected) return 'Talking with you';
    if (p.event) return p.mode === 'walk' ? `On the way · ${p.eventLabel.toLowerCase()}` : p.eventLabel;
    if (p.activityKind === 'meet' && p.mode !== 'walk') return 'Catching up with a coworker';
    if (p.mode === 'walk') {
      const dest = destinationOf(p.destination);
      if (p.destination === p.home) return 'Heading back to their desk';
      return `On the way · ${(dest?.label || 'around the office').toLowerCase()}`;
    }
    if (this.atHome(p) && p.pose === 'stand') return 'Stretching beside their desk';
    if (p.pose === 'sit' && this.atHome(p)) return 'Seated at their desk';
    return destinationOf(p.station)?.label || STATIONS[p.station]?.label || 'At the office';
  }

  releaseDestination(p, destination = p.destination) {
    if (destination !== p.home && this.reservations.get(destination) === p.id) {
      this.reservations.delete(destination);
    }
  }

  go(p, destination) {
    const target = destinationOf(destination);
    if (!target) return false;
    const owner = this.reservations.get(destination);
    if (owner && owner !== p.id) return false;
    // One traveler at a time, except coordinated meeting partners who may walk together.
    // Crowds (gatherings and the walk back from one) move together.
    const traveler = this.people.find(q => q.id !== p.id && q.path.length && !q._crowd);
    const paired = traveler && p.meetWith && traveler.meetWith === p.id;
    if (traveler && !paired && !p._crowd) return false;
    // Crowd routes ignore other walkers; movement still waits for them, then squeezes past.
    const path = this.navigator.findPath(p, target, p._crowd ? [] : this.people.filter(q => q.id !== p.id));
    if (!path) return false;
    if (p._occupiedSpot && p._occupiedSpot !== destination) {
      this.releaseSpot(p._occupiedSpot, p.id);
      p._occupiedSpot = null;
    }
    this.releaseDestination(p);
    this.reservations.set(destination, p.id);
    p.destination = destination;
    p.path = path.slice(1);
    p.mode = 'walk';
    p.pose = 'stand';
    p.wait = 0;
    return true;
  }

  // Leisure outings away from desks. A personal habit runs on its own schedule and does not count.
  awayCount() {
    return this.people.filter(q => (q.mode !== 'desk' || q.station !== q.home) && q.activityKind !== 'habit').length;
  }

  defer(p, choice) {
    p._planTries = (p._planTries || 0) + 1;
    if (p._planTries > LIFE_CONFIG.maxPlanTries) {
      p._planned = null;
      p._planTries = 0;
      p.activityKind = 'stay';
      this.scheduleDecision(p);
      return;
    }
    p._planned = choice;
    const timing = this.timing();
    p.due = this.time + range([timing.retryMin, timing.retryMax], this.random);
  }

  // Stop treating a canceled route as live. A selected coworker stays where they are.
  freezeSelected(p) {
    this.clearLeisure(p);
    p.activityKind = 'stay';
    p.meetWith = null;
    p._meetWait = false;
    if (p.destination && p.destination !== p.station && p.station !== p.destination) {
      this.releaseSpot(p.destination, p.id);
    }
    p.path = [];
    p.mode = 'held';
    p.destination = p.station;
    p._heldAway = !this.atHome(p);
  }

  sendHome(p) {
    if (!p || p.selected) return false;
    this.clearLeisure(p);
    if (p.activityKind === 'meet') p.activityKind = 'stay';
    if (this.atHome(p)) {
      p.mode = 'desk';
      p.path = [];
      p.destination = p.home;
      p.station = p.home;
      if (p.meetSpot && p.meetSpot !== p.home) this.releaseSpot(p.meetSpot, p.id);
      p.meetSpot = null;
      p.meetWith = null;
      if (p.task !== 'working') this.scheduleDecision(p);
      return true;
    }
    const leaving = p.destination;
    const ok = this.go(p, p.home);
    if (!ok) {
      const standing = leaving && p.station === leaving && leaving !== p.home;
      if (standing) p._occupiedSpot = leaving;
      else if (leaving && leaving !== p.home) this.releaseSpot(leaving, p.id);
      p.path = [];
      p.destination = p.home;
      p.mode = 'return';
      p.due = this.time + 0.4;
    }
    return ok;
  }

  cancelMeeting(p, reason = 'cancel') {
    const partner = p.meetWith ? this.people.find(q => q.id === p.meetWith) : null;
    for (const person of [p, partner].filter(Boolean)) {
      this.meetings.delete(person.id);
      person._meetWait = false;
      if (person.activityKind === 'meet') person.activityKind = 'stay';
      person.circuit = null;
      const standing = person.meetSpot && person.station === person.meetSpot && !person.path.length && person.mode !== 'walk';
      if (person.meetSpot && !standing) this.releaseSpot(person.meetSpot, person.id);
      if (standing) person._occupiedSpot = person.meetSpot;
      if (!standing) person.meetSpot = null;
      person.meetWith = null;
    }
    if (reason === 'selected') {
      this.freezeSelected(p);
      if (partner) this.sendHome(partner);
      return;
    }
    this.clearLeisure(p);
    if (partner) this.sendHome(partner);
    if (reason === 'busy') return;
    if (!p.selected && p.task !== 'working') this.sendHome(p);
  }

  beginDwell(a, b) {
    a._meetWait = false;
    b._meetWait = false;
    const deadline = this.time + this.dwellFor('meet');
    a.due = deadline;
    b.due = deadline;
    const face = person => {
      const dest = destinationOf(person.station);
      if (dest?.facing) person.facing = dest.facing;
    };
    face(a);
    face(b);
  }

  finishMeeting(p) {
    const partner = p.meetWith ? this.people.find(q => q.id === p.meetWith) : null;
    p._meetWait = false;
    p.activityKind = 'stay';
    if (p.station === p.meetSpot) p.destination = p.meetSpot;
    if (partner) {
      partner._meetWait = false;
      partner.activityKind = 'stay';
      if (partner.station === partner.meetSpot) partner.destination = partner.meetSpot;
    }
    // Keep meetWith so the pair may walk home together; arrive() clears it.
    if (partner && !partner.selected && partner.task !== 'working') this.go(partner, partner.home);
    if (!p.selected && p.task !== 'working') this.go(p, p.home);
    const ready = this.time + this.timing().meetCooldown;
    p.meetReadyAt = ready;
    if (partner) partner.meetReadyAt = ready;
    this.meetingCompletes++;
  }

  startMeeting(p) {
    if (!POSE_SUPPORT.stand) return false;
    if ((p.meetReadyAt || 0) > this.time) return false;
    const candidates = this.people.filter(q =>
      q.id !== p.id && !q.selected && q.task !== 'working' && q.mode === 'desk' &&
      q.station === q.home && !q.meetWith && (q.meetReadyAt || 0) <= this.time);
    if (!candidates.length) return false;
    const partner = candidates[Math.floor(this.random() * candidates.length)];
    const openPairs = MEET_PAIRS.filter(pair =>
      !this.reservations.has(pair.a.id) && !this.reservations.has(pair.b.id));
    if (!openPairs.length) return false;
    if (this.awayCount() > LIFE_CONFIG.maxAway - 2) return false;
    const pair = openPairs[Math.floor(this.random() * openPairs.length)];
    this.reservations.set(pair.a.id, p.id);
    this.reservations.set(pair.b.id, partner.id);
    p.meetWith = partner.id;
    partner.meetWith = p.id;
    p.meetSpot = pair.a.id;
    partner.meetSpot = pair.b.id;
    p.activityKind = 'meet';
    partner.activityKind = 'meet';
    p._planned = null;
    partner._planned = null;
    p._planTries = 0;
    partner._planTries = 0;
    p._meetWait = false;
    partner._meetWait = false;
    this.meetings.set(p.id, partner.id);
    this.meetings.set(partner.id, p.id);
    const firstOk = this.go(p, pair.a.id);
    const secondOk = firstOk && this.go(partner, pair.b.id);
    if (!firstOk || !secondOk) {
      this.cancelMeeting(p, 'route');
      return false;
    }
    const ready = this.time + this.timing().meetCooldown;
    p.meetReadyAt = ready;
    partner.meetReadyAt = ready;
    this.meetingStarts++;
    return true;
  }

  // Ensemble moments: everyone listed walks to a spot together and stays until dismissed.
  // People who are talking with you or working on a request are never pulled in.
  gather(id, assignments, { label = 'At an office event', speed = 1 } = {}) {
    if (this.gathering) this.dismiss(this.gathering.id);
    const joined = [];
    for (const { personId, spot } of assignments) {
      const p = this.people.find(person => person.id === personId);
      if (!p || p.selected || p.task === 'working' || !destinationOf(spot)) continue;
      if (p.meetWith || p.meetSpot) this.cancelMeeting(p, 'busy');
      this.clearLeisure(p);
      p.event = id; p.eventLabel = label; p.activityKind = 'event';
      p._eventTarget = spot; p._crowd = true; p.speed = speed;
      joined.push(p);
    }
    if (!joined.length) return [];
    this.gathering = { id, label, people: joined.map(p => p.id) };
    for (const p of joined) if (!this.go(p, p._eventTarget)) { p.destination = p._eventTarget; p.mode = 'walk'; p.path = []; }
    return joined.map(p => p.id);
  }

  leaveEvent(p) {
    if (p._eventTarget) this.releaseSpot(p._eventTarget, p.id);
    p.event = null; p.eventLabel = ''; p._eventTarget = null;
    if (p.activityKind === 'event') p.activityKind = 'stay';
    if (p.mode === 'event') p.mode = 'break';
    if (p.destination !== p.home && !p.path.length) p.destination = p.station;
  }

  dismiss(id) {
    if (!this.gathering || this.gathering.id !== id) return;
    this.gathering = null;
    for (const p of this.people) {
      if (p.event !== id) continue;
      const walking = p.path.length > 0;
      this.leaveEvent(p);
      if (walking) p.path = [];
      if (!p.selected && p.task !== 'working') this.sendHome(p);
    }
  }

  // People at a gathering spot, ready for the scene to start.
  gathered(id) {
    return this.people.filter(p => p.event === id && p.mode === 'event');
  }

  startWalk(p) {
    const circuit = WALK_CIRCUITS[Math.floor(this.random() * WALK_CIRCUITS.length)];
    const start = circuit[0];
    if (this.reservations.has(start) && this.reservations.get(start) !== p.id) return false;
    p.circuit = circuit;
    p.circuitStep = 0;
    p.activityKind = 'walk';
    p._pendingCircuit = null;
    p._pendingHome = false;
    return this.go(p, start);
  }

  chooseActivity(p) {
    const choice = p._planned || pickWeighted(LIFE_CONFIG.weights, this.random);
    if (choice === 'stay') {
      p._planned = null;
      p._planTries = 0;
      p.activityKind = 'stay';
      this.scheduleDecision(p);
      return;
    }
    if (this.awayCount() >= LIFE_CONFIG.maxAway) {
      this.defer(p, choice);
      return;
    }
    if (choice === 'meet') {
      if ((p.meetReadyAt || 0) > this.time || !this.startMeeting(p)) this.defer(p, 'meet');
      else { p._planned = null; p._planTries = 0; }
      return;
    }
    if (choice === 'walk') {
      if (this.startWalk(p)) { p._planned = null; p._planTries = 0; return; }
      this.defer(p, 'walk');
      return;
    }
    if (this.reservations.has(choice) && this.reservations.get(choice) !== p.id) {
      this.defer(p, choice);
      return;
    }
    p.activityKind = choice;
    p.circuit = null;
    p._pendingCircuit = null;
    p._pendingHome = false;
    if (this.go(p, choice)) { p._planned = null; p._planTries = 0; }
    else this.defer(p, choice);
  }

  // A personal habit (Kelvin's vending machine run) on its own clock, apart from leisure decisions.
  startHabit(p) {
    const habit = p.habit;
    const every = habit.every[this.scheduleMode] || habit.every.normal;
    if (!this.go(p, habit.to)) { p.habitDue = this.time + 5; return false; }
    this.clearLeisure(p);
    p.activityKind = 'habit';
    p.habitDue = this.time + range(every, this.random);
    this.onHabit?.(p, 'leave');
    return true;
  }

  dwellFor(kind) {
    if (kind === 'kitchen') return range(LIFE_CONFIG.dwell.kitchen, this.random);
    if (kind === 'meet') return range(LIFE_CONFIG.dwell.meet, this.random);
    if (kind === 'meeting' || kind === 'lounge') return range(LIFE_CONFIG.dwell.visit, this.random);
    return range(LIFE_CONFIG.dwell.amenity, this.random);
  }

  arrive(p) {
    const dest = destinationOf(p.destination);
    p.station = p.destination;
    p.facing = dest?.facing || p.facing;
    p.pose = seatFor(p) ? 'sit' : 'stand';
    p.postureDue = this.time + 75 + this.random() * 90;
    if (p.event && p.destination === p._eventTarget) {
      p.mode = 'event';
      p.trips++;
      return;
    }
    if (p.destination === p.home) {
      p._crowd = false;
      p.speed = 1;
      p.mode = 'desk';
      p.activityKind = 'stay';
      this.clearLeisure(p);
      p.meetWith = null;
      if (p.meetSpot) { this.releaseSpot(p.meetSpot, p.id); p.meetSpot = null; }
      if (p._occupiedSpot) { this.releaseSpot(p._occupiedSpot, p.id); p._occupiedSpot = null; }
      this.meetings.delete(p.id);
      if (p.task !== 'working') this.scheduleDecision(p);
      p.trips++;
      return;
    }
    if (p.task === 'working') {
      this.clearLeisure(p);
      p.trips++;
      this.go(p, p.home);
      return;
    }
    if (p.circuit && p.activityKind === 'walk') {
      p.circuitStep++;
      if (p.circuitStep < p.circuit.length) {
        const next = p.circuit[p.circuitStep];
        p.mode = 'break';
        p.due = this.time + 1.5;
        p._pendingCircuit = next;
        p.trips++;
        return;
      }
      p.circuit = null;
      p._pendingCircuit = null;
      p.mode = 'break';
      p.due = this.time + 2;
      p._pendingHome = true;
      p.trips++;
      return;
    }
    if (p.activityKind === 'meet') {
      p.mode = 'break';
      const partner = this.people.find(q => q.id === p.meetWith);
      if (partner && partner.station === partner.meetSpot && !partner.path.length) this.beginDwell(p, partner);
      else {
        p.due = this.time + LIFE_CONFIG.meetWait;
        p._meetWait = true;
      }
      p.trips++;
      return;
    }
    p.mode = 'break';
    p.due = this.time + (p.activityKind === 'habit' ? range(p.habit.stay, this.random) : this.dwellFor(p.activityKind));
    if (p.activityKind === 'habit') this.onHabit?.(p, 'arrive');
    p.trips++;
  }

  update(dt) {
    if (this.paused) return;
    dt = Math.max(0, Math.min(dt, 0.1));
    this.time += dt;
    for (const p of this.people) {
      if (p.selected || p.mode === 'held') continue;
      // Stand on clear floor for brief, staggered stretches between longer trips.
      // No task calls, route changes, or chair collisions are involved.
      const seat = seatFor(p);
      if (p.path.length) p.pose = 'stand';
      else if (seat && p.task === 'working') p.pose = 'sit';
      else if (seat && p.mode === 'desk' && this.time >= p.postureDue) {
        p.pose = p.pose === 'sit' ? 'stand' : 'sit';
        p.postureDue = this.time + (p.pose === 'stand' ? 12 + this.random() * 12 : 75 + this.random() * 90);
      }
      const targetBlend = seat && p.pose === 'sit' ? 1 : 0;
      const change = dt / 1.5;
      p.seatBlend = targetBlend > p.seatBlend ? Math.min(1, p.seatBlend + change) : Math.max(0, p.seatBlend - change);
      // Finish standing up at the reserved approach before starting the floor route.
      if (p.path.length && p.seatBlend > 0) continue;
      if (p.task === 'working') this.clearLeisure(p);
      if (p.task === 'working' && !this.atHome(p) && (p.destination !== p.home || !p.path.length)) {
        const previous = p.destination;
        if (!this.go(p, p.home)) {
          if (previous && previous !== p.home && p.station !== previous) this.releaseSpot(previous, p.id);
          p.path = [];
          p.destination = p.home;
          p.mode = 'return';
          p.due = this.time + 0.4;
        }
        continue;
      }
      if (p.mode === 'return') {
        if (this.time >= p.due) this.sendHome(p);
        continue;
      }
      // station is the last arrival, not the current coordinates. Interrupted return
      // trips can have station === destination while still halfway across the room.
      if (p.mode === 'walk' && !p.path.length && !this.go(p, p.destination)) continue;
      if (p.path.length) {
        const target = p.path[0];
        const dx = target.x - p.x, dy = target.y - p.y;
        const distance = Math.hypot(dx, dy);
        const step = Math.min(distance, (43 + p.index % 3 * 2) * (p.speed || 1) * dt);
        const next = distance < 0.01 ? target : { x: p.x + dx / distance * step, y: p.y + dy / distance * step };
        // A crowd squeezes past after a short wait so doorways never deadlock.
        if (p._crowd && p.wait > .6) p._squeezeUntil = this.time + 1.5;
        const blocked = !(p._crowd && this.time < (p._squeezeUntil || 0))
          && this.people.some(q => q !== p && Math.hypot(q.x - next.x, q.y - next.y) < 17);
        if (blocked || !this.navigator.segmentClear(p, next)) {
          p.wait += dt;
          if (p.wait > 1 && !p._crowd) {
            const route = this.navigator.findPath(p, destinationOf(p.destination), this.people.filter(q => q !== p));
            if (route) p.path = route.slice(1);
            p.wait = 0;
          }
          continue;
        }
        p.wait = 0;
        p.x = next.x; p.y = next.y; p.walkTime += dt;
        p.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'west' : 'east') : (dy < 0 ? 'north' : 'south');
        if (distance <= step + 0.01) p.path.shift();
        if (!p.path.length) this.arrive(p);
        continue;
      }
      if (p.task === 'working') continue;
      if (p.mode === 'event') continue;
      if ((p._pendingCircuit || p._pendingHome) && this.time < p.due) continue;
      if (p._pendingCircuit) {
        const next = p._pendingCircuit;
        p._pendingCircuit = null;
        if (!this.go(p, next)) {
          p.circuit = null;
          this.sendHome(p);
        }
        continue;
      }
      if (p._pendingHome) {
        p._pendingHome = false;
        this.sendHome(p);
        continue;
      }
      if (p.habit && this.time >= p.habitDue && p.mode === 'desk' && this.atHome(p) && !this.gathering && !p.meetWith) {
        this.startHabit(p);
        continue;
      }
      if (this.time < p.due) continue;
      if (this.gathering && p.station === p.home && p.mode === 'desk') { p.due = this.time + 5; continue; }
      if (p.activityKind === 'meet' && p.meetWith && p.station === p.meetSpot) {
        const partner = this.people.find(q => q.id === p.meetWith);
        if (p._meetWait || partner?._meetWait) {
          if (partner && partner.station === partner.meetSpot && !partner.path.length) {
            this.beginDwell(p, partner);
            continue;
          }
          if (this.time >= p.due) this.cancelMeeting(p, 'timeout');
          continue;
        }
        if (this.time >= p.due) this.finishMeeting(p);
        continue;
      }
      if (p.station !== p.home || p.destination !== p.home) {
        if (!this.go(p, p.home)) p.due = this.time + 1;
        continue;
      }
      this.chooseActivity(p);
    }
  }
}
