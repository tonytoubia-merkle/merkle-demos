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
