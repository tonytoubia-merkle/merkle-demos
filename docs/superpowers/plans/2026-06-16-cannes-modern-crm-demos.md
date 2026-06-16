# Cannes Modern CRM Demos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two 12-minute executive demo decks (Hospitality/Rivage/Elena and Retail/Nordhem/Emma) in a new `merkle-demos` repo, reusing the `connections-content-26` demo frame, with a new full-screen record mode and dual-mode (live|video) demo slots.

**Architecture:** Reveal.js single-file decks + a scripted-scene demo harness. Scenes are standalone `index.html` pages animated beat-by-beat by `scene-runtime.js`/`player.js`; the deck `bridge.js` drives an embedded scene via `postMessage`. We add (A) a standalone keyboard/click/wheel driver so a scene can be driven full-screen for recording, and (B) a dual-mode slot so a deck slot can show the live iframe or a recorded `<video>` in the same browser chrome.

**Tech Stack:** Vanilla ES modules, Reveal.js (vendored), HTML/CSS, `node --test` for pure-logic unit tests. 100% offline, served over local `http://`.

**Source paths:** the frame is copied FROM `../connections-content-26/` (sibling dir). All work happens in `merkle-demos/` (the repo root for every command below).

---

## File Structure

**Reused verbatim (copied):** `vendor/reveal/*`, `demo/player.js`, `demo/bridge.js`, `demo/demo-chrome.css`, `demo/package.json`, `demo/*.test.js`, `start.bat`, `start.command`.

**Reused with additions:** `demo/scene-runtime.js` (Task 3 — standalone driver).

**New:**
- `demo/video-slot.js` — dual-mode video handoff logic + controller (Task 5).
- `assets/deck.css` — shared Modern CRM tokens + slide/layout classes (Task 7).
- `hospitality.html`, `retail.html` — the two decks (Tasks 8, 11).
- `demo/hospitality/journey/`, `demo/hospitality/copilot/`, `demo/retail/journey/`, `demo/retail/copilot/` — four scripted scenes (Tasks 9, 10, 12, 13).
- `vignettes/.gitkeep`, `RUN-LOCALLY.md`, `README.md`, `.gitignore`, `.gitattributes`.

**Canonical patterns to mirror (read before authoring):**
- Scripted scene: `../connections-content-26/demo/salesforce/clienteling/index.html` (note the trailing `startSceneRuntime({ total, renderBeat })` and the reversible `renderBeat(index, direction)`).
- Deck shell + Reveal init + bridge wiring: `../connections-content-26/cnx-2026-agentic-luxury.html` lines 1–100 (tokens/CSS) and 1151–1190 (script init).

---

## Phase 0 — Repo seed

### Task 1: Copy the frame and add repo scaffolding

**Files:**
- Create (copy): `vendor/reveal/*`, `demo/player.js`, `demo/scene-runtime.js`, `demo/bridge.js`, `demo/demo-chrome.css`, `demo/package.json`, `demo/player.test.js`, `demo/scene-runtime.test.js`, `demo/bridge.test.js`, `start.bat`, `start.command`
- Create: `.gitignore`, `.gitattributes`, `vignettes/.gitkeep`, `README.md`

- [ ] **Step 1: Copy the frame files**

Run (from `merkle-demos/`):
```bash
SRC="../connections-content-26"
mkdir -p vendor demo vignettes
cp -r "$SRC/vendor/reveal" vendor/
cp "$SRC/demo/player.js" "$SRC/demo/scene-runtime.js" "$SRC/demo/bridge.js" \
   "$SRC/demo/demo-chrome.css" "$SRC/demo/package.json" \
   "$SRC/demo/player.test.js" "$SRC/demo/scene-runtime.test.js" "$SRC/demo/bridge.test.js" demo/
cp "$SRC/start.bat" "$SRC/start.command" .
touch vignettes/.gitkeep
```

- [ ] **Step 2: Add `.gitignore`**

Create `.gitignore`:
```
.DS_Store
node_modules/
.playwright-mcp/
# recorded vignettes are large; keep the folder, ignore the media until we decide on LFS
vignettes/*.mp4
vignettes/*.mov
!vignettes/.gitkeep
```

- [ ] **Step 3: Add `.gitattributes`**

Create `.gitattributes`:
```
*.html text eol=lf
*.css  text eol=lf
*.js   text eol=lf
*.md   text eol=lf
```

- [ ] **Step 4: Add `README.md`**

Create `README.md`:
```markdown
# merkle-demos

Executive demo decks built on a shared scripted-scene Reveal.js frame.

- `hospitality.html` — Modern CRM, Hospitality (Rivage / Elena)
- `retail.html` — Modern CRM, Retail (Nordhem / Emma)

See `RUN-LOCALLY.md` to run offline and to record demo vignettes.
Design + plan: `docs/superpowers/`.
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Seed merkle-demos from the connections-content-26 frame"
```

### Task 2: Verify the copied harness tests pass

- [ ] **Step 1: Run the pure-logic tests**

Run (from `merkle-demos/`):
```bash
node --test "demo/*.test.js"
```
Expected: all tests pass (player, scene-runtime dispatch, bridge decision). If `node` reports "no test files found", confirm you are in `merkle-demos/` and the glob is quoted.

---

## Phase 1 — Harness change A: standalone record mode

### Task 3: Add a standalone key→action helper and driver to `scene-runtime.js`

**Files:**
- Modify: `demo/scene-runtime.js`
- Test: `demo/scene-runtime.test.js`

- [ ] **Step 1: Write the failing test**

Append to `demo/scene-runtime.test.js`:
```js
import { standaloneKeyAction } from './scene-runtime.js';

test('standaloneKeyAction maps forward keys to advance', () => {
  for (const k of ['ArrowRight', 'PageDown', ' ', 'Spacebar']) {
    assert.equal(standaloneKeyAction(k), 'advance');
  }
});

test('standaloneKeyAction maps back keys to rewind', () => {
  for (const k of ['ArrowLeft', 'PageUp']) {
    assert.equal(standaloneKeyAction(k), 'rewind');
  }
});

test('standaloneKeyAction ignores other keys', () => {
  assert.equal(standaloneKeyAction('a'), null);
  assert.equal(standaloneKeyAction('Enter'), null);
});
```
(If the existing file lacks `import test/assert`, mirror the imports already at the top of that file — `node:test` and `node:assert`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test "demo/scene-runtime.test.js"`
Expected: FAIL — `standaloneKeyAction is not a function` / not exported.

- [ ] **Step 3: Implement the helper**

In `demo/scene-runtime.js`, add near the top (after the import):
```js
const FORWARD_KEYS = new Set(['ArrowRight', 'PageDown', ' ', 'Spacebar']);
const BACK_KEYS = new Set(['ArrowLeft', 'PageUp']);

/** Pure: map a keyboard key to a scene action in standalone (record) mode. */
export function standaloneKeyAction(key) {
  if (FORWARD_KEYS.has(key)) return 'advance';
  if (BACK_KEYS.has(key)) return 'rewind';
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test "demo/scene-runtime.test.js"`
Expected: PASS.

- [ ] **Step 5: Wire the standalone driver into `startSceneRuntime`**

In `demo/scene-runtime.js`, inside `startSceneRuntime`, AFTER the existing initial paint/announce (`post({ type: 'demo:state', ... })`) and BEFORE `return player;`, add:
```js
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
```

- [ ] **Step 6: Run the full suite**

Run: `node --test "demo/*.test.js"`
Expected: PASS (no regressions; the browser-only block is not exercised by node).

- [ ] **Step 7: Commit**

```bash
git add demo/scene-runtime.js demo/scene-runtime.test.js
git commit -m "scene-runtime: standalone record-mode driver (key/click/wheel)"
```

> Manual browser verification happens in Task 9 once a real scene exists (open the scene `index.html` directly, F11, drive with arrows).

---

## Phase 2 — Harness change B: dual-mode video slot

### Task 4: Create `video-slot.js` decision logic (TDD)

**Files:**
- Create: `demo/video-slot.js`
- Test: `demo/video-slot.test.js`

- [ ] **Step 1: Write the failing test**

Create `demo/video-slot.test.js`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test "demo/video-slot.test.js"`
Expected: FAIL — cannot find `./video-slot.js`.

- [ ] **Step 3: Implement the logic**

Create `demo/video-slot.js`:
```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test "demo/video-slot.test.js"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add demo/video-slot.js demo/video-slot.test.js
git commit -m "video-slot: dual-mode video handoff decision logic"
```

### Task 5: Add the browser controller to `video-slot.js`

**Files:**
- Modify: `demo/video-slot.js`

- [ ] **Step 1: Append the controller (browser-only, not unit-tested)**

Add to `demo/video-slot.js`:
```js
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
```

- [ ] **Step 2: Commit**

```bash
git add demo/video-slot.js
git commit -m "video-slot: browser controller (autoplay on enter, skip/advance handoff)"
```

### Task 6: Add the `.demo-video` style to `demo-chrome.css`

**Files:**
- Modify: `demo/demo-chrome.css`

- [ ] **Step 1: Add the video rule**

Append to `demo/demo-chrome.css` (so a `<video>` fills the `.demo-window__body` exactly like the iframe does):
```css
/* Recorded vignette playing inside the same browser-chrome wrapper as the live scene. */
video.demo-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  object-fit: cover;
  background: #fff;
}
.reveal .slides section video.demo-video { max-width: none; max-height: none; }
```

- [ ] **Step 2: Commit**

```bash
git add demo/demo-chrome.css
git commit -m "demo-chrome: style for .demo-video inside the browser-chrome wrapper"
```

---

## Phase 3 — Shared Modern CRM identity

### Task 7: Extract `assets/deck.css` with retokened Modern CRM identity

**Files:**
- Create: `assets/deck.css`

This is an authoring task. Read `../connections-content-26/cnx-2026-agentic-luxury.html` lines 14–345 (the inline `<style>`) as the source of slide/layout classes to reuse, and adapt.

- [ ] **Step 1: Build the shared stylesheet**

Create `assets/deck.css` containing:
1. `@import` of `../vendor/reveal/reveal.css` and `../vendor/reveal/black.css` is NOT used here — those stay `<link>`ed in each deck. `deck.css` holds only our tokens + classes.
2. A `:root` block with the **Modern CRM** palette and type (restrained, brand-agnostic — NOT the luxury cream/bronze/gold). Define at minimum:
   - `--mc-ink` (near-black text), `--mc-paper` (off-white slide bg), `--mc-blue` + `--mc-blue-deep` (primary), `--mc-accent` (single restrained accent), `--mc-muted` (secondary text), `--mc-line` (hairlines).
   - `--font-display` and `--font-body`: a single clean sans (system stack is fine: `system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`); `--font-mono` for the `.demo-window__url`. Do NOT carry Cormorant Garamond / Century Gothic.
3. The reusable slide/layout classes adapted from the source, renamed off the luxury vocabulary: keep `slide--dark` / `slide--paper` (rename `slide--cream`→`slide--paper`), `slide-vcenter`, `slide-with-image`, `.label`, `.subtitle`, two-column and stack/list layouts, and the `.from-to` framework layout. Remove the `demo-break::after` 信 glyph and all bronze/gold rules.
4. Reveal sizing assumptions stay (1920×1080); keep the `.reveal .slides section[data-demo-scene]` padding rules already provided by `demo/demo-chrome.css` (do not duplicate them here).

Acceptance: `assets/deck.css` has no references to `lux-`, `sf-gold`, `bronze`, `cream`, `信`, Cormorant, or Century Gothic.

- [ ] **Step 2: Commit**

```bash
git add assets/deck.css
git commit -m "Shared Modern CRM deck stylesheet (retokened from the luxury frame)"
```

> The palette/type values are deliberately chosen here and locked for both decks. If you want to preview before authoring decks, open a scratch HTML linking `assets/deck.css`; do not add it to the repo.

---

## Phase 4 — Hospitality deck (Rivage / Elena)

### Task 8: Build `hospitality.html` shell (all slides, demo slots in `live` mode)

**Files:**
- Create: `hospitality.html`

Authoring task. Mirror the deck-shell structure of `../connections-content-26/cnx-2026-agentic-luxury.html` (head `<link>`s, `.reveal > .slides > section` slides, the bottom `<script src="vendor/reveal/reveal.js">` + `<script type="module">` init). Content comes from the **Hospitality script** in the design doc / source brief.

- [ ] **Step 1: Author the head + sections**

Create `hospitality.html` with:
1. Head: `<link rel="stylesheet" href="vendor/reveal/reveal.css">`, `<link rel="stylesheet" href="vendor/reveal/black.css" id="theme">`, `<link rel="stylesheet" href="assets/deck.css">`, `<link rel="stylesheet" href="demo/demo-chrome.css">`.
2. Sections, in order, using `assets/deck.css` classes (copy exact VO/bullet text from the script):
   - **Intro (Min 1):** title slide + the two David VO lines ("campaign factory…", "sense, decide, act as one").
   - **Guest journey (Min 2–6):** (a) Elena profile card slide (7 profile bullets); (b) "Without Modern CRM" contrast list (5 items); (c) "Contrast that with how we do it now" lead-in; (d) the **journey demo slot** (see Step 2).
   - **Executive copilot (Min 5–8):** CMO question slide ("increase repeat-booking rate among new loyalty members without overspending on media") + the **copilot demo slot** (see Step 2).
   - **Business Impact (Min 9–12):** the "Modern CRM Growth Engine" From→To framework (Identity/Signals/Decisions/Orchestration/Measurement) using a `.from-to` layout.
   - **Summary:** final VO statement.
3. Demo slots — both in `live` mode for now, wrapped in `.demo-window` chrome exactly like the source deck (lines 699–751), e.g.:
```html
<section class="slide--dark slide-vcenter" data-demo-scene="journey" data-demo-mode="live">
  <div class="demo-window">
    <div class="demo-window__bar">
      <div class="demo-window__dots"><span class="demo-window__dot demo-window__dot--r"></span><span class="demo-window__dot demo-window__dot--y"></span><span class="demo-window__dot demo-window__dot--g"></span></div>
      <div class="demo-window__url">rivage.com &nbsp;·&nbsp; The connected guest journey</div>
    </div>
    <div class="demo-window__body">
      <iframe class="demo-frame" src="demo/hospitality/journey/index.html" title="Rivage — the connected guest journey"></iframe>
    </div>
  </div>
</section>
```
(Second slot: `data-demo-scene="copilot"`, url label "rivage.com · Executive copilot", src `demo/hospitality/copilot/index.html`.)

- [ ] **Step 2: Add the init script**

At the end of `hospitality.html`, before `</body>`:
```html
<script src="vendor/reveal/reveal.js"></script>
<script type="module">
  import { bindRevealDemoSlides } from './demo/bridge.js';
  import { bindRevealVideoSlots } from './demo/video-slot.js';
  if (typeof Reveal === 'undefined') throw new Error('Reveal.js global not found – check script load order');
  Reveal.initialize({
    width: 1920, height: 1080, margin: 0.04, minScale: 0.2, maxScale: 2.0,
    hash: true, history: true, controls: true, progress: true, center: false,
    transition: 'slide', backgroundTransition: 'fade',
  });
  bindRevealDemoSlides(Reveal);
  bindRevealVideoSlots(Reveal);
</script>
```

- [ ] **Step 3: Verify it serves and navigates**

Run (from `merkle-demos/`): `python -m http.server 8080`
Open `http://127.0.0.1:8080/hospitality.html`. Verify: all non-demo slides render with the Modern CRM identity; arrow keys/click/scroll navigate; the two demo slots show their (currently stub) scene iframes inside browser chrome. The journey/copilot scenes may be empty until Task 9–10 — that is expected.

- [ ] **Step 4: Commit**

```bash
git add hospitality.html
git commit -m "Hospitality deck shell (Rivage/Elena): all sections, demo slots in live mode"
```

### Task 9: Build the Hospitality journey scene (operable, multi-beat)

**Files:**
- Create: `demo/hospitality/journey/index.html`, `demo/hospitality/journey/journey.css`
- Create (as needed): `demo/hospitality/journey/img/`

Authoring task. Mirror `../connections-content-26/demo/salesforce/clienteling/index.html`: a standalone page that imports `startSceneRuntime` from the correct relative path and implements a fully reversible `renderBeat(index, direction)`.

- [ ] **Step 1: Author the scene**

Create the scene with `startSceneRuntime({ total: 7, renderBeat })` and these beats (the script's "with Modern CRM" bullet order; visual metaphor = a GPS route updating, owned+paid touchpoints lighting on one route around a central persistent profile):
0. Anonymous first touch — creator Reel of the anniversary suite at sunset (social card).
1. Identity resolves → one persistent privacy-safe profile (profile card fills: preferences, value, loyalty, milestone-anniversary signal).
2. Meet the advisor (AI concierge appears, same advisor across surfaces).
3. Signals on-property — recognized on arrival, 10th-anniversary logged, stay composes (room/view, dinner, surprise amenity).
4. Decisions on site/app — storefront never re-asks; next best action/offer/content/channel; frictionless booking.
5. Orchestration — pre-arrival note → in-stay nudge → post-stay thank-you/review/next reason; owned first, paid to extend/suppress.
6. Measurement in the loop — results feed back, adapts, incremental impact proven.

Import path from `demo/hospitality/journey/index.html` is `../../scene-runtime.js`:
```html
<script type="module">
import { startSceneRuntime } from '../../scene-runtime.js';
function renderBeat(index, direction) {
  // toggle DOM state for beats 0..6; must be reversible for any target in any order
}
startSceneRuntime({ total: 7, renderBeat });
</script>
```
Keep it offline (inline SVG / local `img/`), no network. `renderBeat` must paint correctly when jumped to any index (mirror the clienteling pattern's reversibility note).

- [ ] **Step 2: Verify record mode (standalone, full-screen)**

With the server running, open `http://127.0.0.1:8080/demo/hospitality/journey/index.html` directly. Press F11 (full-screen). Verify: ArrowRight advances through all 7 beats, ArrowLeft rewinds, click advances, scroll advances/rewinds — with NO deck chrome and NO `.demo-window` frame (clean full-bleed for recording). Confirm `document.documentElement` has the `data-standalone` attribute (DevTools).

- [ ] **Step 3: Verify embedded mode (in the deck)**

Open `http://127.0.0.1:8080/hospitality.html`, navigate to the journey slot. Verify the deck's arrow/click/scroll drives the beats inside the browser-chrome window, and that after the last beat a forward key advances to the next slide (bridge handoff).

- [ ] **Step 4: Commit**

```bash
git add demo/hospitality/journey
git commit -m "Hospitality journey scene (Rivage/Elena): 7-beat connected-journey vignette"
```

### Task 10: Build the Hospitality copilot scene (operable, multi-beat)

**Files:**
- Create: `demo/hospitality/copilot/index.html`, `demo/hospitality/copilot/copilot.css`

Authoring task. Same pattern (`../../scene-runtime.js`). A conversational copilot UI.

- [ ] **Step 1: Author the scene**

`startSceneRuntime({ total: 5, renderBeat })`, beats following the script's CMO-view bullets:
0. CMO types the question ("increase repeat-booking rate among new loyalty members without overspending on media").
1. Identify opportunity + assemble audience (known members, high-intent prospects, lookalikes).
2. Plan interventions across owned + paid (owned first; paid to re-engage/extend/cut waste).
3. Agentic execution — launches/runs the play across CRM, loyalty, site/app, paid; adapts spend/sequencing.
4. Estimate impact up front, then prove it in one feedback loop (carry the goal across first repeat booking → stay → next trip).

- [ ] **Step 2: Verify record + embedded modes**

Repeat Task 9 Steps 2–3 for `demo/hospitality/copilot/index.html` and the copilot slot in `hospitality.html`.

- [ ] **Step 3: Commit**

```bash
git add demo/hospitality/copilot
git commit -m "Hospitality copilot scene (Rivage/Elena): 5-beat executive-copilot vignette"
```

---

## Phase 5 — Retail deck (Nordhem / Emma)

### Task 11: Build `retail.html` shell (mirror Task 8, retail content + script fix)

**Files:**
- Create: `retail.html`

- [ ] **Step 1: Author the deck**

Mirror Task 8 exactly (same head links, same init script with `bindRevealDemoSlides` + `bindRevealVideoSlots`, same `.demo-window` slot markup but `src="demo/retail/journey/index.html"` and `demo/retail/copilot/index.html`, url labels "nordhem.com · …"). Content from the **Retail script**:
   - Intro VO (retailers/customers variant).
   - Emma profile (7 bullets), "Without Modern CRM" (5 items), journey demo slot.
   - CMO question: "increase visits and purchases among high-intent shoppers while improving media efficiency"; copilot demo slot.
   - Business Impact: the **6-row From→To table** (Campaigns→always-on journeys; Segments→real-time audiences; Channels→cross-channel from one trigger; Separate owned/paid→planned together; Manual optimization→continuous; Market-by-market→every market).
   - Summary VO (retailers variant).
- **Apply the script fix:** the Retail Loyalty bullet must use Emma/Nordhem retail language (loyalty join at the high-intent moment — member pricing, points on this order, members-only offer on her next purchase), NOT the stray hospitality copy ("invites Elena… mid-stay… next visit").

- [ ] **Step 2: Verify it serves and navigates**

`python -m http.server 8080`; open `http://127.0.0.1:8080/retail.html`. Same checks as Task 8 Step 3.

- [ ] **Step 3: Commit**

```bash
git add retail.html
git commit -m "Retail deck shell (Nordhem/Emma): sections + From/To table; fix stray hospitality loyalty copy"
```

### Task 12: Build the Retail journey scene

**Files:**
- Create: `demo/retail/journey/index.html`, `demo/retail/journey/journey.css`, `demo/retail/journey/img/`

- [ ] **Step 1: Author the scene**

Same pattern as Task 9. Visual metaphor = a *living customer graph* (signals flow into one profile, activate across owned+paid simultaneously). `startSceneRuntime({ total: 8, renderBeat })`, beats from the retail "with Modern CRM" bullets:
0. Social first touch — influencer apartment-transformation Reel featuring Nordhem products.
1. Identity resolves → one persistent profile (product interests, purchase intent, household signals, new-home lifecycle).
2. Meet the advisor (AI retail advisor connecting inspiration→planning→purchase→loyalty).
3. Signals — browses kitchens, saves products, builds a shopping list, visits a store, abandons a cart; profile updates real-time.
4. Decisions — next best audience/offer/content/channel: inspire / convert / cross-sell / suppress.
5. Loyalty (retail) — join at the high-intent moment: member pricing, points on this order, members-only next-purchase offer.
6. Orchestration — personalized content across email/app/site/media; cart-abandon recovery; existing purchasers suppressed from acquisition.
7. Measurement in the loop — performance/effectiveness/outcomes feed back, improve future decisions.

- [ ] **Step 2: Verify record + embedded modes** (as Task 9 Steps 2–3, retail paths).

- [ ] **Step 3: Commit**

```bash
git add demo/retail/journey
git commit -m "Retail journey scene (Nordhem/Emma): 8-beat living-customer-graph vignette"
```

### Task 13: Build the Retail copilot scene

**Files:**
- Create: `demo/retail/copilot/index.html`, `demo/retail/copilot/copilot.css`

- [ ] **Step 1: Author the scene**

Same pattern as Task 10. `startSceneRuntime({ total: 6, renderBeat })`, beats from retail CMO-view bullets:
0. CMO question typed ("increase visits and purchases among high-intent shoppers while improving media efficiency").
1. Identify opportunity + assemble audience (existing customers, high-intent shoppers, cart-abandoners, lookalikes).
2. Plan owned + paid (owned-first where permitted; paid to extend reach + acquire).
3. Activate audiences into destinations (Meta, DV360, Google Customer Match, email, app, future journey channels).
4. Agentic execution — launch + optimize across media/CRM/loyalty/ecommerce/store.
5. Measure attribution + incrementality continuously; estimate up front, prove via closed-loop.

- [ ] **Step 2: Verify record + embedded modes** (as Task 9 Steps 2–3, retail paths).

- [ ] **Step 3: Commit**

```bash
git add demo/retail/copilot
git commit -m "Retail copilot scene (Nordhem/Emma): 6-beat executive-copilot vignette"
```

---

## Phase 6 — Workflow docs + final verification

### Task 14: Write `RUN-LOCALLY.md` (run + record-and-swap workflow)

**Files:**
- Create: `RUN-LOCALLY.md`

- [ ] **Step 1: Author the doc**

Adapt `../connections-content-26/RUN-LOCALLY.md`. Must cover:
1. Running offline (`start.bat` / `start.command` / `python -m http.server 8080`), then open `hospitality.html` or `retail.html`.
2. **Recording a vignette:** open the scene `index.html` directly (list the 4 paths), press F11, screen-record while driving with arrow keys; save as `vignettes/<deck>-<scene>.mp4` (e.g. `vignettes/hospitality-journey.mp4`).
3. **Swapping to video:** in the deck, change the slot's `data-demo-mode="live"` to `data-demo-mode="video"` and replace the `<iframe class="demo-frame" …>` with `<video class="demo-video" src="vignettes/hospitality-journey.mp4" muted playsinline></video>` inside the same `.demo-window__body`. Note that the `.demo-window` chrome is preserved, so record scenes full-bleed (no chrome).
4. The dual-mode toggle is per-slot, so you can mix live + video while iterating.

- [ ] **Step 2: Commit**

```bash
git add RUN-LOCALLY.md
git commit -m "RUN-LOCALLY: offline run + record-and-swap vignette workflow"
```

### Task 15: Final full-suite verification

- [ ] **Step 1: Run all logic tests**

Run: `node --test "demo/*.test.js"`
Expected: PASS (player, scene-runtime + standaloneKeyAction, bridge, video-slot).

- [ ] **Step 2: Manual smoke of both decks**

`python -m http.server 8080`. For BOTH `hospitality.html` and `retail.html`: walk every slide; for each of the 4 scenes confirm (a) embedded drive + end-of-scene slide handoff, (b) standalone full-screen record mode. Then in ONE slot, temporarily switch to `video` mode pointing at any local mp4 to confirm autoplay-on-enter and forward-key handoff; revert to `live`.

- [ ] **Step 3: Confirm no Tachibana/luxury residue**

Run:
```bash
grep -ril "tachibana\|cormorant\|century gothic\|信\|lux-\|sf-gold\|bronze\|cream" --include=*.html --include=*.css . || echo "clean"
```
Expected: `clean` (or only intentional matches you can justify). Fix any leftovers.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "Final verification fixes for both Cannes Modern CRM decks"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** repo seed (T1–2) ✓; harness A standalone record mode (T3) ✓; harness B dual-mode video slot (T4–6) ✓; restrained Modern CRM reskin (T7) ✓; 2 vignettes/deck — journey + copilot (T9–10, T12–13) ✓; 5-section structure both decks (T8, T11) ✓; brands Rivage/Nordhem ✓; retail loyalty script fix (T11, T12 beat 5) ✓; vignette storage = gitignore + .gitkeep (T1) ✓; offline-only / no backend ✓; connections-content-26 untouched (all work in merkle-demos) ✓.

**Placeholders:** none — pure-logic steps include full code; authoring tasks (decks/scenes) specify exact files, the canonical pattern file to mirror, beat-by-beat content sourced from the scripts, and concrete browser/command verification.

**Type/name consistency:** `standaloneKeyAction` (T3) used consistently; `decideVideoAction({key, ended})` → `'advance'|'skip'|'reveal'` (T4) matches the controller (T5); `bindRevealVideoSlots` / `bindRevealDemoSlides` imports match the deck init (T8, T11); `data-demo-mode="live|video"`, `iframe.demo-frame`, `video.demo-video`, `.demo-window` used consistently across T5/T6/T8/T11/T14.
