import test from 'node:test';
import assert from 'node:assert/strict';
import { decideVideoAction } from './video-slot.js';

test('forward key when video ended advances the deck', () => {
  for (const key of ['ArrowRight', 'PageDown', ' ', 'Spacebar']) {
    assert.equal(decideVideoAction({ key, ended: true }), 'advance');
  }
});

test('forward key while playing skips to the final frame', () => {
  assert.equal(decideVideoAction({ key: 'ArrowRight', ended: false }), 'skip');
});

test('back key always defers to Reveal', () => {
  assert.equal(decideVideoAction({ key: 'ArrowLeft', ended: false }), 'reveal');
  assert.equal(decideVideoAction({ key: 'PageUp', ended: true }), 'reveal');
});

test('unrelated keys defer to Reveal', () => {
  assert.equal(decideVideoAction({ key: 'a', ended: true }), 'reveal');
});
