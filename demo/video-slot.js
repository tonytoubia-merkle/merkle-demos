const FORWARD = new Set(['ArrowRight', 'PageDown', ' ', 'Spacebar']);
const BACK = new Set(['ArrowLeft', 'PageUp']);

/**
 * Decide what a keypress does on a video demo slot.
 * @returns {'advance'|'skip'|'reveal'}
 *   'advance' => video already ended, let Reveal go to the next slide
 *   'skip'    => still playing, jump to the final frame (presenter wants to move on)
 *   'reveal'  => let Reveal handle it (back nav / unrelated keys)
 */
export function decideVideoAction({ key, ended }) {
  if (FORWARD.has(key)) return ended ? 'advance' : 'skip';
  if (BACK.has(key)) return 'reveal';
  return 'reveal';
}

/**
 * Wire video demo slots to the deck. A video slot is a `<section data-demo-mode="video">`
 * containing `<video class="demo-video">`. On slide-enter the video restarts; forward
 * keys skip-to-end then advance. Call once after Reveal.initialize().
 */
export function bindRevealVideoSlots(Reveal) {
  const currentVideo = () => {
    const slide = Reveal.getCurrentSlide();
    if (!slide || slide.getAttribute('data-demo-mode') !== 'video') return null;
    return slide.querySelector('video.demo-video');
  };

  const playFromStart = () => {
    const v = currentVideo();
    if (!v) return;
    try { v.currentTime = 0; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  };

  Reveal.on('ready', playFromStart);
  Reveal.on('slidechanged', playFromStart);

  document.addEventListener('keydown', (e) => {
    const v = currentVideo();
    if (!v) return;
    const action = decideVideoAction({ key: e.key, ended: v.ended });
    if (action === 'advance') { e.preventDefault(); e.stopImmediatePropagation(); Reveal.next(); }
    else if (action === 'skip') { e.preventDefault(); e.stopImmediatePropagation(); try { v.currentTime = v.duration || 0; v.pause(); } catch (_) {} }
    // 'reveal' => do nothing, let Reveal handle it
  }, true);
}
