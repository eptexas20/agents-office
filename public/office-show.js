import { CREW, EVENT_SPOTS, OFFICE_NAME, seatedPosition } from './world-map.js';

// The comedy layer: speech bubbles, emotes, talking heads and ensemble scenes.
// Visual only. It moves people through OfficeLife and never calls a provider.
export const CAST = {
  mike: {
    lines: ['Conference room in five. Bring snacks.', 'I’m not a boss. I’m a friend who signs your timesheets.',
      'Somebody tell me I’m the best boss. Anybody.', 'Is it Friday? It feels like a Friday.',
      'New policy: fun. Effective immediately.', 'Who wants to hear a joke? …Great, here it goes.', 'I learned that in improv.'],
    camera: ['People say I’m a great boss. Mostly me. I say it.', 'A good manager knows every birthday. I know three.',
      'My mug says World’s Best Boss. I bought it. That still counts.', 'I don’t have favorites. It’s {evan}. Don’t tell {graham}.'],
    emotes: ['☕', '🏆', '🎤'],
  },
  evan: {
    lines: ['Mm-hm.', 'Sure, {mike}.', '{graham}, your stapler looks a little wobbly.', 'Another day, another spreadsheet.'],
    camera: ['I’ve been here eight years. I’ve done some work.', 'So… that happened.', 'I buy Jell-O in bulk now. For reasons.'],
    emotes: ['😏', '👀', '📎'],
  },
  graham: {
    lines: ['FACT: I am the top performer here.', 'Question: who touched my desk?', 'False.',
      'I am fully trained in office security.', 'I could survive in the woods. Easily.', 'My grandfather grew beets. So do I.'],
    camera: ['Some say I’m intense. Those people are weak.', 'I’m assistant… to the branch. Basically the branch.',
      'Rule one of business: trust no one. Rule two: see rule one.'],
    emotes: ['🥋', '📋', '🧐'],
  },
  june: {
    lines: ['{office}, this is {june}.', '{mike}, your two o’clock is here.', 'Has anyone seen my sketchbook?', 'Mm, I’ll forward that.'],
    camera: ['I’m not saying it’s weird here. I’m saying I started journaling.', '{evan} put the stapler in Jell-O again. I helped.'],
    emotes: ['📞', '✏️', '🙂'],
  },
  priya: {
    lines: ['Okay so I have SO much to tell you.', 'Wait, who’s dating who?', 'I am literally so busy right now.',
      'Can we talk about my birthday? It’s in four months.'],
    camera: ['I’m basically the most important person here. Socially.', 'I don’t gossip. I share information quickly.'],
    emotes: ['📱', '💅', '✨'],
  },
  ellie: {
    lines: ['Please don’t touch my desk.', 'That expense report is in the wrong font.',
      'The party committee did NOT approve that.', 'My cat has better manners.'],
    camera: ['I run a tight ship. It is not a cruise.', 'I have a list. You’re on it.'],
    emotes: ['🐈', '📊', '😤'],
  },
  harris: {
    lines: ['I’m doing my crossword.', 'Is it five o’clock yet?', 'Mm-hmm.', 'Wake me up when it’s pretzel day.'],
    camera: ['Eleven years to retirement. I’m counting.', 'Meetings. Every week. Meetings.'],
    emotes: ['📰', '✏️', '💤', '🕔'],
  },
  nora: {
    lines: ['Oh, isn’t that nice.', 'I knitted you something, {mike}.', 'My husband’s picking me up early.', 'Who wants a cookie?'],
    camera: ['I see everything. I just don’t say anything. Mostly.', 'I knit when I’m stressed. I have forty sweaters.'],
    emotes: ['🧶', '🍪', '😊'],
  },
  kelvin: {
    lines: ['Vending machine’s calling my name.', 'I’m not eating. I’m tasting.', 'Numbers are hard. Snacks are easy.',
      'My band plays Saturday. You should come.', 'Is anyone gonna finish that?'],
    camera: ['I’m in accounting. I count things. Mostly snacks.', 'I have a system for the vending machine. It’s called “all of it.”',
      'People underestimate me. That’s their mistake.'],
    emotes: ['🍫', '🍪', '🥁'],
  },
};

export const SCENES = [
  { id: 'meeting', label: 'All-hands meeting', icon: '📣', weight: 3 },
  { id: 'fireDrill', label: 'Fire drill', icon: '🚨', weight: 2 },
  { id: 'party', label: 'Birthday party', icon: '🎂', weight: 2 },
  { id: 'prank', label: 'Stapler in Jell-O', icon: '🟨', weight: 3 },
  { id: 'parkour', label: 'Parkour!', icon: '🤸', weight: 2 },
  { id: 'pretzel', label: 'Pretzel day', icon: '🥨', weight: 2 },
  { id: 'twss', label: 'That’s what she said', icon: '😏', weight: 4 },
  { id: 'talkingHead', label: 'Talking head', icon: '🎥', weight: 5 },
  // Holiday scenes appear only while their theme is on.
  { id: 'secretSanta', label: 'Secret Santa', icon: '🎁', weight: 5, theme: 'christmas' },
  { id: 'snowDay', label: 'Snow day!', icon: '❄️', weight: 4, theme: 'christmas' },
  { id: 'costumes', label: 'Costume contest', icon: '🏆', weight: 5, theme: 'halloween' },
  { id: 'lightsOut', label: 'Lights out', icon: '🔦', weight: 4, theme: 'halloween' },
  { id: 'potluck', label: 'Potluck', icon: '🦃', weight: 5, theme: 'thanksgiving' },
  { id: 'gratitude', label: 'Gratitude circle', icon: '🙏', weight: 4, theme: 'thanksgiving' },
];
// The current holiday's scenes come first so they get the low number keys.
export const scenesFor = theme => [...SCENES.filter(scene => scene.theme && scene.theme === theme), ...SCENES.filter(scene => !scene.theme)];

// Seasonal chatter mixed in with everyday lines while a holiday theme is on.
export const HOLIDAY_LINES = {
  christmas: {
    mike: ['Ho ho ho! That’s a boss laugh.', 'I bought everyone a gift. It’s me. I’m the gift.', 'Who wants to sit on Santa’s lap? …Too far?'],
    evan: ['{graham}’s elf hat is mandatory. I checked.', 'Twelve days of Christmas. Twelve pranks.'],
    graham: ['Elves are highly efficient workers.', 'FACT: Santa’s sleigh has no safety rating.', 'I wrapped my gifts in beet-colored paper.'],
    june: ['I made the snowman. Don’t tell {mike}.', 'Ugly sweater day is Friday. Spread the word.'],
    priya: ['Is this mistletoe? Who’s walking under it?', 'My wish list is laminated.'],
    ellie: ['Tinsel is a fire hazard.', 'Secret Santa budget is ten dollars. TEN.'],
    harris: ['I’ll be here until the 23rd. Then I’m gone.', 'Mm-hmm. Ho. Ho.'],
    nora: ['Who wants eggnog? I made it strong.', 'I knitted the tree skirt.'],
    kelvin: ['Did someone say cookies?', 'I ate the gingerbread house’s door. It was a test.'],
  },
  halloween: {
    mike: ['Boo! Did I scare you? Be honest.', 'My costume is “boss.” Very scary.'],
    evan: ['{graham} asked if horns count as business casual.', 'I’m a cat. Low effort, high reward.'],
    graham: ['I am not afraid of the dark. The dark is afraid of me.', 'Who put a skeleton in the waiting room? Brilliant.'],
    june: ['The cauldron is just dry ice. Probably.', 'Trick or treat? I have the good candy.'],
    priya: ['My cat-ears match my phone case.', 'Okay this is SO spooky.'],
    ellie: ['Candy is for after five.', 'My cat is dressed as a smaller cat.'],
    harris: ['I’m dressed as someone leaving at five.', 'Not getting up for trick-or-treaters.'],
    nora: ['I made bat cookies. They look like blobs.', 'The skeleton has better posture than you, {mike}.'],
    kelvin: ['I’m a pumpkin. It’s a whole thing.', 'Is the candy bowl for everyone or for me?'],
  },
  thanksgiving: {
    mike: ['Gobble gobble, everybody!', 'I’m thankful for… me. And you guys. Mostly me.'],
    evan: ['{mike}’s turkey hat is load-bearing.', 'Leftovers in the fridge. Label them or lose them.'],
    graham: ['I brought twelve dishes. All beets.', 'FACT: the scarecrow works harder than {evan}.'],
    june: ['Who signed up for napkins? Just me?', 'The cornucopia is real fruit. Don’t eat it.'],
    priya: ['Pie or pie? Both. Obviously.', 'Friendsgiving is a whole vibe.'],
    ellie: ['The potluck sign-up sheet is not optional.', 'Gravy is a beverage to some people. Not me.'],
    harris: ['Turkey, nap, home. That’s the plan.', 'I’m thankful it’s a short week.'],
    nora: ['I made my famous casserole.', 'Save me a slice of pumpkin pie.'],
    kelvin: ['I’m thankful for gravy.', 'My famous chili is coming. Clear a path.'],
  },
};

const TIMING = {
  normal: { quirk: [9, 20], scene: [75, 150] },
  demo: { quirk: [4, 9], scene: [30, 60] },
};
// Body language that only makes sense inside a scene.
const SCENE_FLAGS = ['hop', 'panic', 'shake'];
const role = id => CREW.find(p => p.id === id)?.role || '';
const nameOf = id => CREW.find(p => p.id === id)?.name || id;
// Lines name people by id ({mike}, {evan}, …) and the office as {office}, so renames in office-settings.js reach every line.
export const fillNames = text => text.replace(/\{(\w+)\}/g, (token, key) => key === 'office' ? OFFICE_NAME : CREW.some(p => p.id === key) ? nameOf(key) : token);
const wait = seconds => seconds;
const until = (test, timeout) => ({ until: test, timeout });

export class ShowDirector {
  constructor({ world, overlay, focus, unfocus, random = Math.random }) {
    this.world = world; this.life = world.life; this.overlay = overlay;
    this.focus = focus; this.unfocus = unfocus; this.random = random;
    this.auto = true; this.mode = 'normal';
    this.clock = 0; this.bubbles = new Map(); this.flags = [];
    this.scene = null; this.sceneId = null;
    this.nextQuirk = 4; this.nextScene = 40;
    this.listeners = new Set();
    // Kelvin narrates his vending machine runs.
    this.life.onHabit = (p, phase) => {
      if (p.selected) return;
      if (phase === 'leave') { this.say(p.id, this.pick(['Vending machine time.', 'Snack o’clock.', 'Be right back. Snacks.', 'Don’t judge me.']), 3); this.emote(p.id, '🍫', 2.5); }
      else { this.emote(p.id, this.pick(['🍫', '🍬', '🥨', '🍪']), 3); this.say(p.id, this.pick(['Come on, come on…', 'B4. No, B5. B4!', 'It ate my dollar.', 'Two bags. It’s a two-bag day.']), 3.5); }
    };
  }

  pick(list) { return list[Math.floor(this.random() * list.length)]; }
  between([lo, hi]) { return lo + this.random() * (hi - lo); }
  person(id) { return this.life.people.find(p => p.id === id); }
  onChange(listener) { this.listeners.add(listener); }
  notify() { for (const listener of this.listeners) listener(this.sceneId); }

  setMode(mode) {
    this.mode = mode === 'demo' ? 'demo' : 'normal';
    this.nextQuirk = Math.min(this.nextQuirk, this.clock + this.between(TIMING[this.mode].quirk));
    this.nextScene = Math.min(this.nextScene, this.clock + this.between(TIMING[this.mode].scene));
  }

  // Free to clown around: not talking with you, not working, not in a scene.
  free(p) { return p && !p.selected && p.task !== 'working' && !p.event && p.mode !== 'walk'; }

  say(id, text, seconds) {
    text = fillNames(text); seconds ??= 2.4 + text.length * .055;
    const node = this.world.nodes.get(id); if (!node) return;
    this.clearBubble(id);
    const bubble = document.createElement('span');
    bubble.className = 'bubble'; bubble.textContent = text;
    // Keep bubbles near the walls inside the map.
    const p = this.person(id);
    if (p?.x < 170) bubble.classList.add('edge-left');
    else if (p?.x > 1366) bubble.classList.add('edge-right');
    node.button.append(bubble);
    this.bubbles.set(id, { node: bubble, until: this.clock + seconds });
  }

  emote(id, icon, seconds = 2.6) {
    const node = this.world.nodes.get(id); if (!node) return;
    const emote = document.createElement('span');
    emote.className = 'emote'; emote.textContent = icon; emote.setAttribute('aria-hidden', 'true');
    node.button.append(emote);
    this.flags.push({ until: this.clock + seconds, remove: () => emote.remove() });
  }

  flag(id, className, seconds) {
    const node = this.world.nodes.get(id); if (!node) return;
    this.clearFlag(id, className);
    node.button.classList.add(className);
    this.flags.push({ id, className, until: this.clock + seconds, remove: () => node.button.classList.remove(className) });
  }

  look(id, seconds = 2.2) {
    const p = this.person(id); if (!p) return;
    p.lookUntil = this.life.time + seconds;
  }

  clearBubble(id) {
    const bubble = this.bubbles.get(id);
    if (bubble) { bubble.node.remove(); this.bubbles.delete(id); }
  }

  // Coworker status from real agent requests, shown right in the office.
  taskChanged(id, status, text = '') {
    if (status === 'working') { this.say(id, this.pick(['On it!', 'Leave it with me.', 'Give me a sec…', 'Typing furiously…']), 3); this.flag(id, 'typing', 3600); }
    else {
      this.clearFlag(id, 'typing');
      if (status === 'done') {
        const plain = (text || '').replace(/[*`#>_]/g, '').replace(/\s+/g, ' ').trim();
        this.say(id, plain ? `“${plain.slice(0, 70)}${plain.length > 70 ? '…' : ''}”` : 'Done!', 7); this.emote(id, '💬', 4);
      }
      if (status === 'error') { this.say(id, 'Uh… I can’t reach Grok.', 5); this.emote(id, '😬', 4); }
    }
  }

  clearFlag(id, className) {
    const node = this.world.nodes.get(id); node?.button.classList.remove(className);
    this.flags = this.flags.filter(f => !(f.className === className && f.id === id));
  }

  overlayNode(className, text) {
    const node = document.createElement('div'); node.className = className;
    if (text != null) node.textContent = text;
    this.overlay.append(node); return node;
  }

  lowerThird(id, quote, seconds = 5) {
    this.overlay.querySelector('.lower-third')?.remove();
    const card = this.overlayNode('lower-third');
    const name = document.createElement('strong'); name.textContent = nameOf(id);
    const job = document.createElement('small'); job.textContent = role(id);
    const line = document.createElement('p'); line.textContent = fillNames(quote);
    card.append(name, job, line);
    this.flags.push({ until: this.clock + seconds, remove: () => card.remove() });
  }

  confetti(seconds = 5) {
    const layer = this.overlayNode('confetti');
    const colors = ['#e9bf69', '#ef6f6c', '#5fb49c', '#7aa5e8', '#c78be5'];
    for (let i = 0; i < 70; i++) {
      const bit = document.createElement('i');
      bit.style.left = `${this.random() * 100}%`;
      bit.style.background = this.pick(colors);
      bit.style.animationDelay = `${this.random() * 1.2}s`;
      bit.style.animationDuration = `${2.2 + this.random() * 1.8}s`;
      layer.append(bit);
    }
    this.flags.push({ until: this.clock + seconds, remove: () => layer.remove() });
  }

  banner(text, seconds = 5, className = '') {
    const node = this.overlayNode(`show-banner ${className}`.trim(), text);
    this.flags.push({ until: this.clock + seconds, remove: () => node.remove() });
    return node;
  }

  run(id) {
    this.stop();
    const script = this[`scene_${id}`]?.();
    if (!script) return false;
    this.scene = { script, waiting: 0, until: null, deadline: 0 };
    this.sceneId = id;
    this.notify();
    this.advance();
    // Every scene yields at least once, so one that already finished found nobody free.
    return !!this.scene;
  }

  stop() {
    if (!this.scene) return;
    this.scene = null;
    if (this.life.gathering) this.life.dismiss(this.life.gathering.id);
    this.unfocus?.();
    this.overlay.querySelectorAll('.alarm, .blackout').forEach(node => node.remove());
    for (const p of this.life.people) for (const className of SCENE_FLAGS) this.clearFlag(p.id, className);
    this.sceneId = null;
    this.notify();
  }

  advance() {
    while (this.scene) {
      const { value, done } = this.scene.script.next();
      if (done) {
        if (this.life.gathering) this.life.dismiss(this.life.gathering.id);
        this.scene = null; this.sceneId = null; this.notify();
        this.nextScene = this.clock + this.between(TIMING[this.mode].scene);
        return;
      }
      if (typeof value === 'number') { this.scene.waiting = value; return; }
      if (value?.until) { this.scene.until = value.until; this.scene.deadline = this.clock + value.timeout; return; }
    }
  }

  tick(dt) {
    this.clock += dt;
    for (const [id, bubble] of this.bubbles) if (this.clock >= bubble.until) this.clearBubble(id);
    this.flags = this.flags.filter(flag => { if (this.clock < flag.until) return true; flag.remove(); return false; });
    if (this.scene) {
      if (this.scene.until) {
        if (this.scene.until() || this.clock >= this.scene.deadline) { this.scene.until = null; this.advance(); }
      } else if ((this.scene.waiting -= dt) <= 0) this.advance();
      return;
    }
    if (this.auto && this.clock >= this.nextScene) {
      const choice = this.weightedScene();
      if (!this.run(choice)) this.nextScene = this.clock + 10;
      return;
    }
    if (this.clock >= this.nextQuirk) {
      this.nextQuirk = this.clock + this.between(TIMING[this.mode].quirk);
      this.quirk();
    }
  }

  weightedScene() {
    const scenes = scenesFor(this.theme);
    const total = scenes.reduce((sum, s) => sum + s.weight, 0);
    let roll = this.random() * total;
    for (const scene of scenes) { roll -= scene.weight; if (roll <= 0) return scene.id; }
    return 'talkingHead';
  }

  // A short run of lines from whoever is present, one after another.
  *lines(joined, script, gap = 2.6) {
    for (const [id, text, emote] of script) {
      if (!joined.includes(id)) continue;
      this.say(id, text, gap + .6); if (emote) this.emote(id, emote, gap);
      yield wait(gap);
    }
  }

  quirk() {
    const candidates = this.life.people.filter(p => this.free(p) && !this.bubbles.has(p.id));
    if (!candidates.length || this.bubbles.size >= 3) return;
    const p = this.pick(candidates), cast = CAST[p.id], seasonal = HOLIDAY_LINES[this.theme]?.[p.id];
    const roll = this.random();
    if (roll < .55) this.say(p.id, this.pick(seasonal && this.random() < .6 ? seasonal : cast.lines));
    else if (roll < .9) { this.emote(p.id, this.pick(cast.emotes), 3); this.flag(p.id, 'fidget', 1.2); }
    else { this.look(p.id, 1.8); this.emote(p.id, '👀', 1.8); }
  }

  // Everyone free, in a shuffled order, with the named lead first.
  crew(lead, limit = 8) {
    const rest = this.life.people.filter(p => p.id !== lead && !p.selected && p.task !== 'working');
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(this.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    const leadPerson = this.person(lead);
    return [...(leadPerson && !leadPerson.selected && leadPerson.task !== 'working' ? [leadPerson] : []), ...rest].slice(0, limit);
  }

  gather(id, group, people, options) {
    const spots = EVENT_SPOTS[group];
    const joined = this.life.gather(id, people.slice(0, spots.length).map((p, i) => ({ personId: p.id, spot: spots[i].id })), options);
    return joined;
  }

  arrived(id, joined, share = 1) {
    return until(() => this.life.gathered(id).length >= Math.ceil(joined.length * share), 35);
  }

  talkHead(id, quote) {
    const p = this.person(id); if (!p) return 0;
    this.look(id, 5);
    this.lowerThird(id, quote, 5);
    const visual = seatedPosition(p);
    this.focus?.(visual.x, visual.y - 30);
    return 5;
  }

  *scene_talkingHead() {
    const candidates = this.life.people.filter(p => this.free(p));
    if (!candidates.length) return;
    const p = this.pick(candidates);
    yield wait(this.talkHead(p.id, this.pick(CAST[p.id].camera)));
    this.unfocus?.();
  }

  *scene_twss() {
    const mike = this.person('mike');
    const setups = [['graham', 'Why is this so hard?'], ['ellie', 'That is way too big.'], ['harris', 'It just keeps going and going.'],
      ['priya', 'Just put it in, it’ll fit.'], ['nora', 'I can’t believe how long that took.']];
    const options = setups.filter(([id]) => this.free(this.person(id)));
    if (!options.length || !mike || mike.selected || mike.task === 'working') return;
    const [id, line] = this.pick(options);
    this.say(id, line, 3);
    yield wait(1.8);
    this.say('mike', 'That’s what she said!', 3); this.emote('mike', '😆'); this.flag('mike', 'fidget', 1.2);
    yield wait(2.2);
    const reactor = this.free(this.person('evan')) ? 'evan' : 'june';
    this.look(reactor, 3); this.emote(reactor, '😐', 3);
    const p = this.person(reactor);
    if (p) this.focus?.(p.x, p.y - 30, 3.2);
    yield wait(3);
    this.unfocus?.();
  }

  *scene_meeting() {
    this.say('mike', 'Conference room. Five minutes!', 3); this.emote('mike', '📣');
    yield wait(1.5);
    const joined = this.gather('meeting', 'meeting', this.crew('mike'), { label: 'In the all-hands meeting', speed: 1.5 });
    if (!joined.length) return;
    yield this.arrived('meeting', joined, .85);
    const lead = joined.includes('mike') ? 'mike' : joined[0];
    this.say(lead, this.pick(['Okay team, big news. …I got a new chair.', 'Today’s topic: why does everyone keep looking at that camera?',
      'I called this meeting because I was lonely.']), 4);
    yield wait(3.6);
    if (joined.includes('graham')) { this.say('graham', 'Question!', 2); this.emote('graham', '✋'); yield wait(1.4); this.say(lead, 'Not now, {graham}.', 2); yield wait(2); }
    if (joined.includes('harris')) { this.say('harris', 'Mm-hmm.', 2); this.emote('harris', '🙄'); yield wait(1.8); }
    if (joined.includes('evan')) { this.look('evan', 2.6); this.emote('evan', '👀', 2.6); yield wait(2.6); }
    this.say(lead, 'Meeting adjourned! Great talk, everybody.', 3);
    yield wait(2);
  }

  *scene_fireDrill() {
    const lead = this.free(this.person('graham')) ? 'graham' : this.crew('graham')[0]?.id;
    if (!lead) return;
    this.say(lead, 'FIRE! Everybody out! This is NOT a drill!', 3); this.emote(lead, '🔥'); this.flag(lead, 'shake', 2);
    const alarm = this.overlayNode('alarm');
    yield wait(1);
    const joined = this.gather('fireDrill', 'lobby', this.crew(lead), { label: 'Escaping the fire drill', speed: 2.6 });
    for (const id of joined) { this.emote(id, this.pick(['😱', '🔥', '🏃']), 4); this.flag(id, 'panic', 30); }
    yield wait(2);
    if (joined.includes('mike')) this.say('mike', 'Save yourselves! I mean— stay calm!', 3);
    yield this.arrived('fireDrill', joined, .85);
    alarm.remove();
    for (const id of joined) this.clearFlag(id, 'panic');
    this.say(lead, 'It was a drill. Most of you would be dead.', 4);
    yield wait(3.5);
    const victim = joined.find(id => id === 'priya' || id === 'ellie' || id === 'nora');
    if (victim) { this.say(victim, victim === 'priya' ? 'I broke a nail. I’m suing.' : victim === 'ellie' ? 'I’m filing a complaint.' : 'Oh dear.', 3); yield wait(3); }
  }

  *scene_party() {
    const guests = this.life.people.filter(p => p.id !== 'mike' && !p.selected && p.task !== 'working');
    if (!guests.length) return;
    const guest = this.pick(guests).id;
    this.banner(`🎂 Happy birthday, ${nameOf(guest)}!`, 14, 'party');
    this.say('mike', 'Cake in the kitchen! Everybody!', 3); this.emote('mike', '🎉');
    yield wait(1.4);
    const people = this.crew(guest);
    const joined = this.gather('party', 'kitchen', people, { label: 'At the birthday party', speed: 1.4 });
    if (!joined.length) return;
    yield this.arrived('party', joined, .75);
    this.confetti(5);
    for (const id of joined) this.emote(id, this.pick(['🎉', '🎂', '🥳']), 3);
    if (joined.includes('ellie')) { this.say('ellie', 'The committee approved this cake. Barely.', 3.5); yield wait(3); }
    if (joined.includes('mike')) { this.say('mike', 'Speech! Speech! …Fine, I’ll do it.', 3.5); yield wait(3); }
    this.say(guest, this.pick(['You guys remembered!', 'It’s not actually my birthday.', 'Is this gluten free?']), 3);
    yield wait(3);
    if (joined.includes('nora')) { this.say('nora', 'Oh, isn’t that nice.', 2.5); yield wait(2.5); }
  }

  *scene_prank() {
    const prankster = this.person('evan'), victim = this.person('graham');
    if (!prankster || !victim) return;
    if (this.free(prankster)) { this.say('evan', 'Watch this.', 2); this.emote('evan', '😏'); }
    yield wait(1.6);
    const jello = document.createElement('span'); jello.className = 'jello'; jello.setAttribute('aria-hidden', 'true');
    jello.style.left = `${555 / 15.36}%`; jello.style.top = `${505 / 10.24}%`;
    this.world.root.append(jello);
    this.flags.push({ until: this.clock + 14, remove: () => jello.remove() });
    yield wait(1.2);
    if (!victim.selected && victim.task !== 'working') { this.say('graham', 'TIM!!!', 2.5); this.emote('graham', '😡'); this.flag('graham', 'shake', 1.6); }
    yield wait(2.4);
    if (!prankster.selected) yield wait(this.talkHead('evan', 'I have no idea what he’s talking about.') - 1);
    this.unfocus?.();
  }

  *scene_parkour() {
    const crew = ['mike', 'graham', 'evan'].map(id => this.person(id)).filter(p => p && !p.selected && p.task !== 'working');
    if (!crew.length) return;
    this.say(crew[0].id, 'PARKOUR!', 2.5);
    yield wait(.8);
    const joined = this.gather('parkour', 'lobby', crew, { label: 'Doing parkour', speed: 2.4 });
    for (const id of joined) { this.flag(id, 'hop', 25); this.emote(id, '🤸', 2); }
    yield wait(1.5);
    for (const id of joined.slice(1)) { this.say(id, this.pick(['PARKOUR!', 'Hup!', 'Parkour!!']), 2); yield wait(1); }
    yield this.arrived('parkour', joined);
    for (const id of joined) this.clearFlag(id, 'hop');
    this.say(joined[0], 'Okay. My knee hurts.', 3);
    yield wait(3);
  }

  *scene_secretSanta() {
    this.banner('🎁 Secret Santa', 14);
    this.say('mike', 'Secret Santa! Kitchen! Bring your gifts!', 3); this.emote('mike', '🎅');
    yield wait(1.4);
    const joined = this.gather('secretSanta', 'kitchen', this.crew('mike'), { label: 'At the Secret Santa swap', speed: 1.4 });
    if (!joined.length) return;
    yield this.arrived('secretSanta', joined, .75);
    for (const id of joined) this.emote(id, '🎁', 3);
    yield wait(1.5);
    yield* this.lines(joined, [
      ['mike', 'I got myself something. That counts, right?', '🤷'],
      ['ellie', 'Ten dollar limit. Someone spent eleven.', '😤'],
      ['graham', 'A beet calendar. Whoever you are: thank you.', '🥹'],
      ['harris', 'A gift card. Perfect. Don’t talk to me.'],
      ['priya', 'Wait, can we swap? I’m swapping.', '🔄'],
    ]);
    this.confetti(4);
  }

  *scene_snowDay() {
    const lead = this.free(this.person('mike')) ? 'mike' : this.crew('mike')[0]?.id;
    if (!lead) return;
    this.say(lead, 'IT’S SNOWING! Everybody to the lobby!', 3); this.emote(lead, '❄️');
    this.world.holiday?.burst(20);
    yield wait(1.2);
    const joined = this.gather('snowDay', 'lobby', this.crew(lead), { label: 'Watching the snow', speed: 1.8 });
    for (const id of joined) this.flag(id, 'hop', 6);
    yield this.arrived('snowDay', joined, .8);
    for (const id of joined) this.emote(id, this.pick(['❄️', '⛄', '😍']), 3);
    yield* this.lines(joined, [
      ['priya', 'Snow selfie! Everyone squeeze in!', '📸'],
      ['graham', 'Snow is just frozen weakness.'],
      ['harris', 'If the roads close, I’m going home. Now.'],
      ['nora', 'I’ll make cocoa.', '☕'],
    ]);
  }

  *scene_costumes() {
    this.banner('🎃 Costume contest', 16);
    this.say('mike', 'Costume contest! Winner gets half a day off. Half.', 3.5); this.emote('mike', '🏆');
    yield wait(1.5);
    const joined = this.gather('costumes', 'meeting', this.crew('mike'), { label: 'At the costume contest', speed: 1.5 });
    if (!joined.length) return;
    yield this.arrived('costumes', joined, .85);
    yield* this.lines(joined, [
      ['graham', 'I am a demon. Of sales.', '😈'],
      ['june', 'Witch. I sewed the hat myself.', '🧹'],
      ['evan', 'I’m a cat. I wore ears. That’s the costume.', '🐱'],
      ['harris', 'These are horns. I’m done.'],
    ]);
    const entrants = joined.filter(id => id !== 'mike');
    const winner = this.pick(entrants.length ? entrants : joined);
    this.banner(`🏆 Best costume: ${nameOf(winner)}`, 6, 'party');
    this.confetti(4); this.emote(winner, '🏆', 4); this.flag(winner, 'hop', 3);
    this.say(winner, 'I’d like to thank… my hat.', 3);
    yield wait(3.5);
  }

  *scene_lightsOut() {
    const dark = this.overlayNode('blackout');
    for (const p of this.life.people) if (!p.selected) this.emote(p.id, '😱', 3);
    this.say('mike', 'WHO TURNED OFF THE LIGHTS?!', 3);
    yield wait(1.2);
    this.say('priya', 'AAAAH!', 2); this.say('ellie', 'Nobody touch me.', 2.5);
    for (const id of ['priya', 'evan', 'nora']) this.flag(id, 'shake', 2);
    yield wait(2.4);
    this.say('graham', 'Relax. I was testing the backup generator.', 3.5);
    yield wait(2.2);
    dark.remove();
    this.say('evan', 'He was not testing the backup generator.', 3); this.look('evan', 2.5);
    yield wait(2.6);
  }

  *scene_potluck() {
    this.banner('🦃 Office potluck', 16);
    this.say('nora', 'Potluck’s ready! Grab a plate!', 3); this.emote('nora', '🍽️');
    yield wait(1.4);
    const joined = this.gather('potluck', 'kitchen', this.crew('nora'), { label: 'At the potluck', speed: 1.4 });
    if (!joined.length) return;
    yield this.arrived('potluck', joined, .75);
    for (const id of joined) this.emote(id, this.pick(['🦃', '🥧', '🌽']), 3);
    yield* this.lines(joined, [
      ['nora', 'My famous casserole. Don’t ask what’s in it.'],
      ['graham', 'I brought beets. Twelve dishes of beets.', '🥗'],
      ['harris', 'Store-bought pie. Don’t ask.'],
      ['mike', 'I’ll carve! …Why is everyone backing away?', '🔪'],
      ['evan', 'Somebody take the knife from {mike}.', '👀'],
    ]);
  }

  *scene_gratitude() {
    this.say('mike', 'Gratitude circle! Conference room!', 3); this.emote('mike', '🙏');
    yield wait(1.4);
    const joined = this.gather('gratitude', 'meeting', this.crew('mike'), { label: 'In the gratitude circle', speed: 1.4 });
    if (!joined.length) return;
    yield this.arrived('gratitude', joined, .85);
    yield* this.lines(joined, [
      ['mike', 'Let’s go around and say what we’re thankful for. I’ll start: me.'],
      ['harris', 'Thankful it’s a four-day week.'],
      ['graham', 'Thankful for my beets. And my rivals. Mostly beets.'],
      ['june', 'Thankful for all of you. Even {mike}.', '💛'],
      ['evan', 'Thankful for this camera.', '👀'],
    ], 2.8);
    if (joined.includes('evan')) this.look('evan', 2.5);
    yield wait(1.5);
  }

  *scene_pretzel() {
    const harris = this.person('harris');
    const people = this.crew('harris', 3);
    if (!people.length) return;
    this.banner('🥨 Free pretzel day', 10);
    if (harris && !harris.selected) { this.say('harris', 'It’s. Pretzel. Day.', 2.5); this.emote('harris', '🥨'); }
    yield wait(1.5);
    const joined = this.gather('pretzel', 'kitchen', people, { label: 'Getting a free pretzel', speed: 1.3 });
    yield this.arrived('pretzel', joined, .67);
    for (const id of joined) this.emote(id, '🥨', 4);
    if (joined.includes('harris')) this.say('harris', 'Best day of the year.', 3.5);
    yield wait(6);
  }
}
