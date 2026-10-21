import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTINGS } from '../public/office-settings.js';
import { CREW, OFFICE_NAME } from '../public/world-map.js';
import { CAST, fillNames } from '../public/office-show.js';

test('office-settings.js names every coworker and the office', () => {
  assert.equal(OFFICE_NAME, SETTINGS.office.name);
  assert.deepEqual(Object.keys(SETTINGS.coworkers).sort(), CREW.map(p => p.id).sort());
  for (const person of CREW) {
    assert.equal(person.name, SETTINGS.coworkers[person.id].name);
    assert.equal(person.role, SETTINGS.coworkers[person.id].role);
  }
});

test('lines use placeholders, so renamed coworkers never hear their old names', () => {
  const lines = JSON.stringify(CAST);
  for (const name of ['Mitch', 'Tim', 'Dwayne', 'Pat', 'Kaylee', 'Angie', 'Stan', 'Phyllida', 'Kelvin']) assert.ok(!new RegExp(`\b${name}\b`).test(lines), `${name} is written out in a line`);
  assert.equal(fillNames('{office}, this is {june}. {mike}? {unknown}'), `${OFFICE_NAME}, this is ${CREW.find(p => p.id === 'june').name}. ${CREW.find(p => p.id === 'mike').name}? {unknown}`);
});
