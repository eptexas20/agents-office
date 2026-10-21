import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { snapshotWindowState, restoreWindowState } from '../src/providers/grok-bot.js';

const good = JSON.stringify({ version: 1, normalBounds: { x: 248, y: 28, width: 1056, height: 768 }, isMaximized: false });
const hidden = JSON.stringify({ version: 1, normalBounds: { x: -25593, y: -25600, width: 0, height: 0 }, isMaximized: false });

function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grok-window-state-'));
  return path.join(dir, 'window-state.json');
}

test('restores the window position saved before the hidden session', () => {
  const file = tempFile();
  fs.writeFileSync(file, good);
  const saved = snapshotWindowState(file);
  fs.writeFileSync(file, hidden);
  restoreWindowState(file, saved);
  assert.equal(fs.readFileSync(file, 'utf8'), good);
});

test('removes the hidden-desktop position when there was no file before', () => {
  const file = tempFile();
  const saved = snapshotWindowState(file);
  assert.equal(saved, null);
  fs.writeFileSync(file, hidden);
  restoreWindowState(file, saved);
  assert.equal(fs.existsSync(file), false);
});

test('does not restore a snapshot that was already off-screen', () => {
  const file = tempFile();
  fs.writeFileSync(file, hidden);
  const saved = snapshotWindowState(file);
  restoreWindowState(file, saved);
  assert.equal(fs.existsSync(file), false);
});
