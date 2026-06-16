import { createScenePlayer } from './player.js';

const FORWARD_KEYS = new Set(['ArrowRight', 'PageDown', ' ', 'Spacebar']);
const BACK_KEYS = new Set(['ArrowLeft', 'PageUp']);

/** Pure: map a keyboard key to a scene action in standalone (record) mode. */
export function standaloneKeyAction(key) {
  if (FORWARD_KEYS.has(key)) return 'advance';
  if (BACK_KEYS.has(key)) return 'rewind';
  return null;
}

/** Pure dispatch: apply a parent message to the player. Returns true if handled. */
export function handleSceneMessage(player, data) {
  if (!data || data.target !== 'demo-scene') return false;
  switch (data.type) {
    case 'demo:advance': player.advance(); return true;
    case 'demo:rewind':  player.rewind();  return true;
    case 'demo:reset':   player.reset();   return true;
    default: return false;
  }
}

/**
 * Wire a scene page to the parent deck. Browser-only.
 * @param {object} opts
 * @param {number} opts.total       number of beats
 * @param {(index:number, direction:string) => void} opts.renderBeat  paints the DOM for a beat
 */
export function startSceneRuntime({ total, renderBeat }) {
  const post = (msg) => parent.postMessage({ source: 'demo-scene', ...msg }, '*');
  const player = createScenePlayer({
    total,
    onChange: (st) => {
      renderBeat(st.index, st.direction);
      post({ type: 'demo:state', index: st.index, total: st.total, complete: st.complete, atStart: st.atStart });
    },
  });
  // Only accept commands from our direct parent (the deck).
  window.addEventListener('message', (e) => {
    if (e.source !== parent) return;
    handleSceneMessage(player, e.data);
  });
  // Paint initial state and announce it so the bridge learns `total` immediately.
  const st = player.state();
  renderBeat(st.index, 'reset');
  post({ type: 'demo:state', index: st.index, total: st.total, complete: st.complete, atStart: st.atStart });

  // Standalone (record) mode: when the scene is opened directly (not embedded
  // in the deck), drive it with its own input so it can be screen-recorded
  // full-screen with no deck/browser chrome. Embedded mode is unchanged.
  if (window.parent === window) {
    document.documentElement.setAttribute('data-standalone', '');
    document.addEventListener('keydown', (e) => {
      const action = standaloneKeyAction(e.key);
      if (!action) return;
      e.preventDefault();
      if (action === 'advance') player.advance(); else player.rewind();
    });
    document.addEventListener('click', () => player.advance());
    let lastWheel = 0;
    document.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 6) return;
      const now = Date.now();
      if (now - lastWheel < 380) return;
      lastWheel = now;
      if (e.deltaY > 0) player.advance(); else player.rewind();
    }, { passive: false });
  }

  return player;
}
