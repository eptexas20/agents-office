import { CREW, WIDTH, HEIGHT, OFFICE_NAME, OFFICE_TAGLINE } from './world-map.js';
import { OfficeWorld, paintPortrait } from './office-world.js';
import { OfficeCamera, MIN_ZOOM, MAX_ZOOM } from './office-camera.js';
import { THEME_IDS, getTheme, readStoredTheme, storeTheme } from './office-themes.js';
import { ShowDirector, CAST, scenesFor, fillNames } from './office-show.js';
import { HOLIDAYS } from './office-holiday.js';

const $ = selector => document.querySelector(selector);
// The office name and tagline come from office-settings.js. The page's first text node keeps its child tags.
(function showOfficeName() {
  const initial = (OFFICE_NAME.replace(/^the\s+/i, '').match(/\p{L}|\p{N}/u)?.[0] || 'B').toUpperCase();
  document.title = `${OFFICE_NAME} — your agents, at work`;
  for (const node of document.querySelectorAll('[data-office-name]')) node.firstChild.nodeValue = OFFICE_NAME;
  for (const node of document.querySelectorAll('[data-office-initial]')) node.firstChild.nodeValue = initial;
  for (const node of document.querySelectorAll('[data-office-tagline]')) node.textContent = OFFICE_TAGLINE;
  $('.brand')?.setAttribute('aria-label', `${OFFICE_NAME} home`);
})();
const room = $('#room'), chat = $('#chat'), roster = $('#roster');
const bots = $('#bots'), message = $('#message'), send = $('#send');
const connect = $('#connect'), release = $('#release');
const presentationConnect = $('#presentation-connect');
const presentationRelease = $('#presentation-release');
const thread = $('#thread'), log = $('#log');
const stage = $('#stage');
const themeTabs = $('#theme-tabs');
const sessions = new Map(), pending = new Set();
let availableBots = [], selectedId = '', connected = false, loading = false;
let bindings = readBindings(), noticeTimer;
let presentation = false, nativeFullscreen = false, demoActivity = false, choosingAgent = false;
let themeId = readStoredTheme();
let themeRequest = 0;

function readBindings() {
  try {
    const saved = JSON.parse(localStorage.getItem('branch.assignments.v1') || '{}');
    return Object.fromEntries(CREW.filter(p => typeof saved?.[p.id] === 'string').map(p => [p.id, saved[p.id]]));
  } catch { return {}; }
}
function saveBindings() {
  try { localStorage.setItem('branch.assignments.v1', JSON.stringify(bindings)); }
  catch { tell('Assignments will last for this visit; this browser cannot save them.'); }
}
function member(id = selectedId) { return CREW.find(p => p.id === id); }
function boundBot(id = selectedId) { return availableBots.find(bot => bot.id === bindings[id]); }
// Conversations survive a reload, so a coworker remembers what you talked about.
const savedChats = (() => {
  try { return JSON.parse(localStorage.getItem('branch.chats.v1') || '{}') || {}; } catch { return {}; }
})();
function session(botId) {
  if (!sessions.has(botId)) {
    const messages = Array.isArray(savedChats[botId]) ? savedChats[botId].filter(m => m && typeof m.text === 'string') : [];
    sessions.set(botId, { messages, draft: '', status: 'idle' });
  }
  return sessions.get(botId);
}
function saveChats() {
  for (const [botId, data] of sessions) savedChats[botId] = data.messages.filter(m => m.type !== 'error').slice(-40);
  try { localStorage.setItem('branch.chats.v1', JSON.stringify(savedChats)); } catch {}
}
const phone = () => window.matchMedia('(max-width: 720px)').matches;
function element(tag, className, text) {
  const node = document.createElement(tag); if (className) node.className = className;
  if (text != null) node.textContent = text; return node;
}
function tell(text) {
  const notice = $('#notice'); notice.textContent = text; notice.hidden = false;
  clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice.hidden = true; }, 7000);
}

const world = new OfficeWorld(room, openAgent, error => {
  if (error) tell(error);
  else updateActivity();
});
let cameraMoves = true, viewBeforeScene = null;
const director = new ShowDirector({
  world, overlay: $('#show-overlay'),
  // The documentary zoom stays out of the way while you chat or steer the camera yourself,
  // and afterwards returns to the view you had.
  focus: (x, y, zoom = 2.6) => {
    if (!cameraMoves || selectedId || performance.now() - camera.lastManual < 8000) return;
    viewBeforeScene ??= { ...camera.viewCenter(), zoom: camera.zoom };
    camera.focusOn(x, y, zoom);
  },
  unfocus: () => {
    if (!viewBeforeScene) return;
    const { x, y, zoom } = viewBeforeScene;
    viewBeforeScene = null;
    if (performance.now() - camera.lastManual >= 1000) camera.focusOn(x, y, zoom, 700);
  },
});
world.director = director;
// ?debug exposes the office for fast-forwarding scenes in tests and previews.
if (new URLSearchParams(location.search).has('debug')) {
  window.branch = { world, director, get camera() { return camera; }, step(seconds) { for (let t = 0; t < seconds; t += .05) { world.life.update(.05); director.tick(.05); } world.render(); } };
}

function buildRoster() {
  roster.replaceChildren();
  $('#crew-count').textContent = String(CREW.length);
  for (const p of CREW) {
    const button = element('button', 'roster-person'); button.type = 'button'; button.dataset.personId = p.id;
    const avatar = document.createElement('canvas'); avatar.width = 96; avatar.height = 128; avatar.setAttribute('aria-hidden', 'true');
    paintPortrait(avatar, p).catch(() => {});
    const copy = element('span', 'roster-copy'); copy.append(element('strong', '', p.name), element('small', '', p.role));
    button.append(avatar, copy, element('span', 'roster-status'));
    button.addEventListener('click', () => openAgent(p.id)); roster.append(button);
  }
  updateRoster();
}
function updateRoster() {
  for (const p of CREW) {
    const button = roster.querySelector(`[data-person-id='${p.id}']`);
    const bot = boundBot(p.id), state = bot ? session(bot.id).status : 'idle';
    button.dataset.connected = String(connected && !!bot); button.dataset.task = state;
    button.querySelector('small').textContent = bot ? `${bot.name}, ${!connected ? 'disconnected' : state === 'working' ? 'working on it' : state === 'done' ? 'reply ready' : state === 'error' ? 'needs attention' : 'ready'}` : p.role;
  }
}

function openAgent(id) {
  const p = member(id); if (!p) return;
  selectedId = id; world.select(id);
  $('#team-view').hidden = true; chat.hidden = false;
  document.body.classList.toggle('chat-open', true);
  const heading = element('div', 'agent-heading');
  const portrait = document.createElement('canvas'); portrait.width = 96; portrait.height = 128; portrait.setAttribute('aria-hidden', 'true');
  paintPortrait(portrait, p).catch(() => {});
  const name = element('div');
  const activity = element('p', 'agent-activity'); activity.id = 'current-activity';
  name.append(element('h2', '', p.name), activity);
  heading.append(portrait, name);
  $('#agent-card').replaceChildren(heading);
  choosingAgent = false;
  const bot = boundBot();
  if (bot && session(bot.id).status === 'done') { session(bot.id).status = 'idle'; world.setTask(id, 'idle'); updateRoster(); }
  renderAssignment(); renderThread(); renderSuggestions(); updateActivity();
  message.value = bot ? session(bot.id).draft : '';
  updateComposer(); growComposer();
  if (connected && bot && !phone()) message.focus({ preventScroll: true });
  fitOffice();
  if (phone()) chat.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeAgent() {
  const oldId = selectedId;
  selectedId = ''; world.select(null); chat.hidden = true; $('#team-view').hidden = false;
  document.body.classList.toggle('chat-open', false);
  (presentation ? room : roster).querySelector(`[data-person-id='${oldId}']`)?.focus({ preventScroll: true });
  fitOffice();
}

function renderAssignment() {
  bots.replaceChildren(new Option('Choose an agent', ''));
  for (const bot of availableBots) {
    const other = CREW.find(p => p.id !== selectedId && bindings[p.id] === bot.id);
    // Taking an agent from another coworker is allowed; that coworker just loses it.
    const option = new Option(other ? `${bot.name} (now with ${other.name})` : bot.name, bot.id);
    option.disabled = !!other && pending.has(bot.id);
    bots.append(option);
  }
  bots.value = bindings[selectedId] || '';
  const bot = boundBot(), p = member();
  const waiting = !!bot && pending.has(bot.id);
  const connectButton = $('#chat-connect');
  connectButton.hidden = connected;
  connectButton.disabled = loading;
  connectButton.firstChild.textContent = loading ? 'Opening your agents… ' : 'Connect my Grok agents ';
  $('#agent-picked').hidden = !connected || !bot || choosingAgent;
  $('#agent-picked-name').textContent = bot ? bot.name : '';
  $('#change-agent').disabled = waiting;
  $('#agent-choose').hidden = !connected || (!!bot && !choosingAgent);
  bots.disabled = waiting;
  $('#assignment-note').textContent = !connected
    ? `${p?.name || 'This coworker'} runs on one of your existing Grok Bot agents. Nothing is created or changed.`
    : !availableBots.length ? 'No agents were found in Grok Bot.'
    : bot ? '' : `Pick the agent ${p?.name || 'this coworker'} should be.`;
}

// Small, safe Markdown subset: paragraphs, bullet/numbered lists, headings, **bold** and `code`.
function richText(text) {
  const root = element('div', 'body');
  const inline = (parent, line) => {
    for (const part of line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)) {
      if (!part) continue;
      if (part.startsWith('**') && part.endsWith('**')) parent.append(element('strong', '', part.slice(2, -2)));
      else if (part.startsWith('`') && part.endsWith('`')) parent.append(element('code', '', part.slice(1, -1)));
      else parent.append(document.createTextNode(part));
    }
  };
  for (const block of text.split(/\n{2,}/)) {
    let list = null, para = null;
    for (const raw of block.split('\n')) {
      const item = raw.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (item) {
        para = null;
        if (!list) { list = element(/^\s*\d/.test(raw) ? 'ol' : 'ul'); root.append(list); }
        const li = element('li'); inline(li, item[1]); list.append(li);
        continue;
      }
      list = null;
      const heading = raw.match(/^#{1,4}\s+(.*)$/);
      if (heading) { para = null; const h = element('p', 'md-heading'); inline(h, heading[1]); root.append(h); continue; }
      if (!para) { para = element('p'); root.append(para); } else para.append(document.createElement('br'));
      inline(para, raw);
    }
  }
  return root;
}

function renderThread() {
  thread.replaceChildren();
  const bot = boundBot(), p = member();
  const data = bot ? session(bot.id) : null;
  if (!data?.messages.length) {
    const empty = element('div', 'thread-empty');
    const line = fillNames(CAST[p.id]?.lines[0] || 'Ready when you are.');
    empty.append(element('strong', '', `“${line}”`), document.createTextNode(bot && connected
      ? `${p.name} is wired to ${bot.name}. Ask anything, or tap an idea below.`
      : bot ? `Reconnect to keep talking with ${bot.name}. Your history is saved.`
      : connected ? 'Pick an agent above to start.' : 'Connect once, and every coworker gets one of your agents.'));
    thread.append(empty);
  } else {
    data.messages.forEach((entry, index) => {
      const line = element('article', `message ${entry.type}`);
      line.append(entry.type === 'assistant' ? richText(entry.text) : element('p', 'body', entry.text));
      const meta = element('div', 'meta');
      meta.append(element('span', '', entry.type === 'user' ? 'You' : entry.type === 'error' ? 'Couldn’t send' : p.name));
      if (entry.at) meta.append(element('time', '', new Date(entry.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })));
      if (entry.type === 'assistant') {
        const copy = element('button', 'link-button', 'Copy'); copy.type = 'button';
        copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(entry.text); copy.textContent = 'Copied'; }
          catch { copy.textContent = 'Copy failed'; }
          setTimeout(() => { copy.textContent = 'Copy'; }, 1500);
        });
        meta.append(copy);
      }
      if (entry.type === 'error' && entry.retry && index === data.messages.length - 1) {
        const retry = element('button', 'link-button', 'Try again'); retry.type = 'button';
        retry.addEventListener('click', () => {
          if (!connected || pending.has(bot.id)) { tell('Reconnect Grok Bot, then try again.'); return; }
          data.messages.pop(); sendText(entry.retry);
        });
        meta.append(retry);
      }
      line.append(meta);
      thread.append(line);
    });
  }
  if (bot && pending.has(bot.id)) {
    const typing = element('div', 'message assistant typing');
    const dots = element('div', 'body'); dots.append(element('i'), element('i'), element('i'));
    typing.append(dots, element('div', 'meta', `${p.name} is on it…`));
    thread.append(typing);
  }
  thread.scrollTop = thread.scrollHeight;
}

const IDEAS = {
  mike: ['Write a pep talk for my team', 'Plan my week in 5 bullets'],
  evan: ['Explain this to me simply:', 'Help me solve a tricky problem:'],
  graham: ['Find the holes in my plan:', 'Fact-check this:'],
  june: ['Draft a polite email about', 'Organize this to-do list:'],
  priya: ['Make this sound friendlier:', 'Write a reply to this customer:'],
  ellie: ['Proofread this:', 'Turn this into a step-by-step plan:'],
  harris: ['Shorten this to 3 bullets:', 'Write a closing pitch for'],
  nora: ['Make a checklist for', 'Plan the logistics for'],
  kelvin: ['Double-check these numbers:', 'Make a budget for'],
};
function renderSuggestions() {
  const box = $('#suggestions'); box.replaceChildren();
  const bot = boundBot();
  box.hidden = !connected || !bot || session(bot.id).messages.length > 0 || pending.has(bot.id);
  if (box.hidden) return;
  for (const idea of [...(IDEAS[selectedId] || []), '3 TikTok hook ideas about']) {
    const chip = element('button', 'chip', idea); chip.type = 'button';
    chip.addEventListener('click', () => {
      message.value = `${idea} `; message.focus(); message.setSelectionRange(message.value.length, message.value.length);
      session(bot.id).draft = message.value; updateComposer(); growComposer();
    });
    box.append(chip);
  }
}

function growComposer() {
  message.style.height = 'auto';
  message.style.height = `${Math.min(message.scrollHeight, 180)}px`;
}

function updateComposer() {
  const bot = boundBot(), name = member()?.name;
  const waiting = !!bot && pending.has(bot.id);
  message.disabled = !connected || !bot || waiting;
  send.disabled = !connected || !bot || waiting || !message.value.trim();
  message.placeholder = !connected ? 'Connect to start chatting' : !bot ? 'Pick an agent first' : waiting ? `${name} is working on it…` : `Message ${name}…`;
  $('#clear-chat').hidden = !bot || !session(bot.id).messages.length || waiting;
}

// The connect button carries the connection state; the presentation bar mirrors it.
function syncConnectionChrome() {
  connect.classList.toggle('connected', connected);
  presentationConnect.classList.toggle('connected', connected);
  presentationConnect.textContent = connect.textContent;
  presentationConnect.disabled = connect.disabled;
  presentationRelease.hidden = release.hidden;
  presentationRelease.disabled = release.disabled;
}

function updateActivity() {
  if (!world) return;
  if (selectedId) {
    const node = $('#current-activity'); if (node) node.textContent = world.activity(selectedId);
  }
}

async function loadBots({ quiet = false } = {}) {
  if (loading || pending.size) return;
  loading = true;
  if (selectedId) renderAssignment();
  connect.disabled = release.disabled = presentationConnect.disabled = presentationRelease.disabled = true;
  connect.textContent = 'Connecting…';
  syncConnectionChrome();
  const result = await request('/api/bots');
  addLog(result.logs);
  // Shown even after a failed connect: a hidden Grok Bot stuck on sign-in still needs handing back.
  loading = false; connect.disabled = release.disabled = false; release.hidden = false;
  if (!result.ok || !Array.isArray(result.bots)) {
    connected = false;
    connect.textContent = 'Try connecting again';
    if (!quiet) tell(result.error || 'Could not read your bots. Your office is still available.');
  } else {
    availableBots = result.bots.filter(bot => typeof bot.id === 'string' && typeof bot.name === 'string');
    connected = true;
    const known = new Set(availableBots.map(bot => bot.id));
    for (const p of CREW) if (bindings[p.id] && !known.has(bindings[p.id])) bindings[p.id] = '';
    const used = new Set(Object.values(bindings).filter(Boolean));
    const free = availableBots.filter(bot => !used.has(bot.id));
    for (const p of CREW) if (!(p.id in bindings) && free.length) bindings[p.id] = free.shift().id;
    saveBindings();
    connect.textContent = `${availableBots.length} agents connected`;
    connect.title = 'Refresh the list of agents';
    if (!quiet || !availableBots.length) tell(!availableBots.length ? 'No existing bots were found in Grok Bot.'
      : selectedId ? `Connected. ${member().name} is ready.` : 'Your agents are connected. Pick a coworker to begin.');
  }
  syncConnectionChrome();
  updateRoster();
  if (selectedId) {
    renderAssignment(); renderThread(); renderSuggestions();
    message.value = boundBot() ? session(boundBot().id).draft : ''; updateComposer();
    if (boundBot() && !phone()) message.focus({ preventScroll: true });
  }
}

// Reattach after a page reload when the hidden Grok Bot is still open. Never launches it.
async function resumeConnection() {
  const status = await request('/api/status');
  if (status.ok && status.session === 'open') loadBots({ quiet: true });
}

function sendMessage(event) {
  event?.preventDefault();
  sendText(message.value.trim());
}

async function sendText(text) {
  const person = member(), bot = boundBot();
  if (!person || !bot || !text || !connected || pending.has(bot.id)) return;
  const data = session(bot.id);
  data.messages.push({ type: 'user', text, at: Date.now() }); data.draft = ''; data.status = 'working';
  pending.add(bot.id); world.setTask(person.id, 'working'); director.taskChanged(person.id, 'working');
  message.value = ''; growComposer(); saveChats();
  connect.disabled = release.disabled = presentationConnect.disabled = presentationRelease.disabled = true;
  syncConnectionChrome();
  renderThread(); renderSuggestions(); renderAssignment(); updateComposer(); updateRoster();
  const result = await request('/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'grok-bot', botId: bot.id, text }),
  });
  addLog(result.logs); pending.delete(bot.id);
  connect.disabled = release.disabled = pending.size > 0;
  syncConnectionChrome();
  if (result.ok && result.reply) {
    data.messages.push({ type: 'assistant', text: result.reply, at: Date.now() }); data.status = 'done';
  } else {
    data.messages.push({ type: 'error', text: result.error || 'No reply was captured. Check the connection activity before retrying.', retry: text, at: Date.now() });
    data.status = 'error';
  }
  saveChats();
  world.setTask(person.id, data.status); director.taskChanged(person.id, data.status, result.reply); updateRoster();
  if (selectedId === person.id) { renderThread(); updateComposer(); renderAssignment(); message.focus({ preventScroll: true }); }
  else tell(`${person.name}: ${data.status === 'done' ? 'your reply is ready.' : 'the connection needs attention.'}`);
}

async function releaseGrok() {
  if (loading || pending.size) return;
  loading = true;
  connect.disabled = release.disabled = presentationConnect.disabled = presentationRelease.disabled = true;
  syncConnectionChrome();
  const result = await request('/api/release', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  addLog(result.logs);
  loading = false; connect.disabled = release.disabled = false;
  if (!result.ok) { syncConnectionChrome(); tell(result.error || 'Could not close the hidden Grok Bot.'); return; }
  connected = false; release.hidden = true;
  connect.textContent = 'Connect my agents'; connect.title = '';
  syncConnectionChrome();
  tell('Grok Bot is yours again. Open it from your desktop, and quit it before connecting the office again.');
  updateRoster();
  if (selectedId) { renderAssignment(); renderThread(); renderSuggestions(); updateComposer(); }
}

async function request(url, options) {
  try {
    const response = await fetch(url, options);
    const payload = await response.json();
    if (!response.ok && payload.ok !== false) return { ok: false, error: `Request failed (${response.status}).`, logs: [] };
    return payload;
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Request failed.', logs: [] }; }
}
function addLog(lines) {
  if (!lines?.length) return;
  log.textContent += `${log.textContent ? '\n' : ''}${lines.join('\n')}`; log.scrollTop = log.scrollHeight;
}

const camera = new OfficeCamera($('#office-viewport'), room, {
  width: WIDTH, height: HEIGHT,
  onChange: zoom => {
    $('#zoom-level').textContent = `${Math.round(zoom * 100)}%`;
    $('#zoom-out').disabled = zoom <= MIN_ZOOM;
    $('#zoom-in').disabled = zoom >= MAX_ZOOM;
  },
});
function fitOffice() { camera.resize(); }

const defaultHeading = { title: $('#office-title').textContent };
function applyThemeVars(theme) {
  const root = document.documentElement;
  for (const key of ['--theme-accent', '--theme-header', '--theme-controls']) root.style.removeProperty(key);
  for (const [key, value] of Object.entries(theme.ui || {})) root.style.setProperty(key, value);
  document.body.dataset.theme = theme.id;
  const heading = HOLIDAYS[theme.id]?.heading || defaultHeading;
  $('#office-title').textContent = heading.title;
  director.theme = theme.id;
  buildScenes();
  for (const tab of themeTabs.children) tab.setAttribute('aria-pressed', String(tab.dataset.theme === theme.id));
}

// Folder tabs switch the holiday theme.
function buildThemeTabs() {
  for (const id of THEME_IDS) {
    const tab = element('button', 'folder-tab', getTheme(id).label); tab.type = 'button'; tab.dataset.theme = id;
    tab.setAttribute('aria-pressed', 'false');
    tab.addEventListener('click', () => applyTheme(id));
    themeTabs.append(tab);
  }
}

async function applyTheme(id, { persist = true } = {}) {
  const requestId = ++themeRequest;
  const requested = THEME_IDS.includes(id) ? id : 'everyday';
  stage.setAttribute('aria-busy', 'true');
  try {
    const theme = await world.setTheme(requested);
    if (requestId !== themeRequest || !theme) return;
    themeId = theme.id;
    if (persist) storeTheme(themeId);
    applyThemeVars(theme);
    return theme;
  } catch (error) {
    if (requestId !== themeRequest) return;
    applyThemeVars(getTheme(world.themeId));
    tell(error.message || 'The holiday artwork could not load. Please try again.');
  } finally {
    if (requestId === themeRequest) stage.removeAttribute('aria-busy');
  }
}

function syncPresentationChrome() {
  const native = document.fullscreenElement === stage;
  nativeFullscreen = native;
  document.body.classList.toggle('presentation', presentation);
  document.body.classList.toggle('native-fullscreen', native);
  $('#presentation-bar').hidden = !presentation;
  const exit = $('#exit-presentation');
  const exitLabel = native ? 'Exit fullscreen' : 'Exit presentation';
  exit.textContent = exitLabel;
  exit.setAttribute('aria-label', exitLabel);
  const fullscreenButton = $('#fullscreen');
  fullscreenButton.hidden = presentation;
  fullscreenButton.setAttribute('aria-pressed', String(presentation));
  fullscreenButton.textContent = 'Fullscreen';
  syncConnectionChrome();
}

function refitAfterLayout() {
  requestAnimationFrame(() => { fitOffice(); requestAnimationFrame(fitOffice); });
}

async function exitPresentation() {
  if (document.fullscreenElement === stage) {
    try { await document.exitFullscreen(); }
    catch {
      presentation = true;
      syncPresentationChrome();
      tell('The browser could not exit fullscreen. Try the exit button again.');
      return;
    }
  }
  presentation = false;
  syncPresentationChrome();
  refitAfterLayout();
}

async function enterPresentation() {
  presentation = true;
  syncPresentationChrome();
  if (typeof stage.requestFullscreen !== 'function') {
    tell('This browser cannot enter fullscreen. Showing the in-page presentation layout.');
    refitAfterLayout();
    return;
  }
  try {
    await stage.requestFullscreen();
  } catch {
    tell('Browser fullscreen was blocked. Using an in-page presentation layout instead.');
  }
  refitAfterLayout();
}

async function toggleFullscreen() {
  if (presentation || document.fullscreenElement) await exitPresentation();
  else await enterPresentation();
}

function onFullscreenChange() {
  const native = document.fullscreenElement === stage;
  if (native) presentation = true;
  else if (nativeFullscreen) presentation = false;
  syncPresentationChrome();
  refitAfterLayout();
}

function setDemoActivity(enabled) {
  demoActivity = enabled;
  world.setDemoActivity(enabled);
  director.setMode(enabled ? 'demo' : 'normal');
  $('#demo-activity').setAttribute('aria-pressed', String(enabled));
  document.body.classList.toggle('demo-activity', enabled);
  updateActivity();
  if (enabled) tell(world.life.paused
    ? 'Lively mode is on. Choose Resume office to see coworkers move.'
    : 'Lively mode: more walking, more chatter, a scene every minute or so.');
}

connect.addEventListener('click', loadBots);
presentationConnect.addEventListener('click', loadBots);
release.addEventListener('click', releaseGrok);
presentationRelease.addEventListener('click', releaseGrok);
$('#close-chat').addEventListener('click', closeAgent);
$('#composer').addEventListener('submit', sendMessage);
message.addEventListener('input', () => { const bot = boundBot(); if (bot) session(bot.id).draft = message.value; updateComposer(); growComposer(); });
message.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) sendMessage(e); });
bots.addEventListener('change', () => {
  if (!selectedId) return;
  // One agent per coworker: picking a taken agent moves it here.
  for (const p of CREW) if (p.id !== selectedId && bots.value && bindings[p.id] === bots.value) {
    bindings[p.id] = ''; world.setTask(p.id, 'idle');
  }
  bindings[selectedId] = bots.value; saveBindings();
  choosingAgent = false;
  world.setTask(selectedId, boundBot() ? session(boundBot().id).status : 'idle');
  message.value = boundBot() ? session(boundBot().id).draft : '';
  renderAssignment(); renderThread(); renderSuggestions(); updateComposer(); updateRoster();
  if (boundBot() && !phone()) message.focus({ preventScroll: true });
});
$('#chat-connect').addEventListener('click', () => loadBots());
$('#change-agent').addEventListener('click', () => { choosingAgent = true; renderAssignment(); bots.focus(); });
$('#clear-chat').addEventListener('click', () => {
  const bot = boundBot(); if (!bot || pending.has(bot.id)) return;
  session(bot.id).messages = []; session(bot.id).status = 'idle';
  saveChats(); world.setTask(selectedId, 'idle');
  renderThread(); renderSuggestions(); updateComposer(); updateRoster();
});

function rollScene(id) {
  if (world.life.paused) $('#pause').click();
  if (!director.run(id)) tell('Everyone is busy right now. Try another scene.');
}
// Every scene is a sticky note under the map: the holiday's own scenes first, then the everyday ones.
// Number keys follow the same order.
function buildScenes() {
  const box = $('#scene-stickies');
  box.replaceChildren();
  scenesFor(director.theme).forEach((scene, index) => {
    const note = element('button', 'sticky', scene.label); note.type = 'button'; note.dataset.scene = scene.id;
    if (index < 9) { note.title = `Press ${index + 1}`; note.append(element('span', 'sticky-key', String(index + 1))); }
    note.classList.toggle('running', director.sceneId === scene.id);
    note.addEventListener('click', () => rollScene(scene.id));
    box.append(note);
  });
}
function watchScenes() {
  director.onChange(id => {
    for (const note of $('#scene-stickies').children) note.classList.toggle('running', note.dataset.scene === id);
  });
}
$('#auto-scenes').addEventListener('change', e => { director.auto = e.target.checked; });
$('#camera-moves').addEventListener('change', e => { cameraMoves = e.target.checked; if (!cameraMoves) director.unfocus(); });
$('#pause').addEventListener('click', () => {
  world.setPaused(!world.life.paused);
  $('#pause').setAttribute('aria-pressed', String(world.life.paused));
  $('#pause').textContent = world.life.paused ? 'Resume office' : 'Pause office'; updateActivity();
});
$('#names').addEventListener('click', () => {
  const hidden = room.classList.toggle('hide-names'); $('#names').setAttribute('aria-pressed', String(!hidden));
});
$('#demo-activity').addEventListener('click', () => setDemoActivity(!demoActivity));
$('#zoom-in').addEventListener('click', () => camera.setZoom(camera.zoom * 1.25));
$('#zoom-out').addEventListener('click', () => camera.setZoom(camera.zoom / 1.25));
$('#zoom-fit').addEventListener('click', () => camera.setZoom(1));
$('#fullscreen').addEventListener('click', toggleFullscreen);
$('#exit-presentation').addEventListener('click', () => toggleFullscreen());
document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('keydown', event => {
  // Number keys roll scenes while filming, so the menu never has to be on screen.
  const typing = event.target.closest?.('input, textarea, select, [contenteditable]');
  const number = Number(event.key), scenes = scenesFor(director.theme);
  if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey && number >= 1 && number <= Math.min(9, scenes.length)) {
    event.preventDefault(); rollScene(scenes[number - 1].id); return;
  }
  if (event.key !== 'Escape') return;
  // Do not fight native fullscreen exit. If chat is open outside fullscreen, Esc closes it.
  if (document.fullscreenElement) return;
  if (selectedId) closeAgent();
  else if (presentation) exitPresentation();
});
new ResizeObserver(fitOffice).observe($('#office-viewport'));
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  world.setPaused(true); $('#pause').setAttribute('aria-pressed', 'true'); $('#pause').textContent = 'Resume office';
}
buildThemeTabs();
applyTheme(themeId, { persist: true });
buildRoster(); buildScenes(); watchScenes(); fitOffice(); updateActivity(); syncConnectionChrome();
// Only reattaches to an already-open session: looking at the office never launches Grok Bot.
resumeConnection();
