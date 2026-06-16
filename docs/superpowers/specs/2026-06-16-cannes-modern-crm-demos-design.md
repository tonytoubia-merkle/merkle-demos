# Cannes Modern CRM Demos — Design

**Date:** 2026-06-16
**Repo:** `merkle-demos` (new)
**Deliverable:** Two 12-minute executive demo decks — Hospitality (Elena) and Retail (Emma) — for the Cannes "Modern CRM" pitch. Each replaces the live demo with pre-recorded video vignettes, but the on-screen demos must be operable so the vignettes can be recorded.

## Background

The frame is lifted from `connections-content-26` — the shipped CNX 2026 "agentic luxury" Tachibana deck. That deck is a Reveal.js presentation with a custom in-slide demo harness:

- `demo/player.js` — pure beat-index step player (`index` in `[0, total]`).
- `demo/scene-runtime.js` — wires a scene page to the deck via `postMessage`; the scene implements `renderBeat(index, direction)`.
- `demo/bridge.js` — deck side; intercepts arrow/click/scroll on demo slides and forwards advance/rewind to the embedded scene iframe; hands off to Reveal when a scene is complete/at-start.
- `demo/demo-chrome.css` — the `.demo-window` browser-chrome wrapper that surrounds an embedded scene iframe.
- Scripted scenes (`demo/salesforce/clienteling`, `demo/salesforce/journey`) — single `index.html` + CSS, ~11 files each, realistic UI animated beat-by-beat. This is the fidelity we reuse.

`connections-content-26` stays untouched — a shipped artifact. We copy the frame into a fresh repo.

## Decisions (locked)

1. **New repo `merkle-demos`**, seeded by copying the reusable frame; all Tachibana content left behind. Plural name intentionally leaves room for future demos on the same frame.
2. **Scripted-scene fidelity** (beat-by-beat animated mockups), not a full interactive app. The output is a fixed recorded vignette, so frame-perfect scripted control is what matters.
3. **Dual-mode demo slots** + **full-screen record mode** (see Harness changes).
4. **Visual identity:** keep the Reveal structure / slide layouts / `.demo-window` chrome; reskin tokens into a restrained, brand-agnostic "Modern CRM" identity (drop luxury cream/bronze/gold + Cormorant/Century Gothic luxury treatment + the 信 motif). Tasteful, not over-designed.
5. **Brands:** Hospitality = **Rivage** (fictional Riviera luxury resort; anniversary suites, signature dining). Retail = **Nordhem** (fictional Scandinavian home-furnishings retailer; kitchens & home furnishings, IKEA-like).
6. **Agency/vendor branding kept light:** small Merkle/dentsu mark; Salesforce/Merkury referenced only where the identity-resolution beat makes it meaningful.

## Repo layout

```
merkle-demos/
  hospitality.html            # Elena deck (Rivage)
  retail.html                 # Emma deck (Nordhem)
  vendor/reveal/              # copied from connections-content-26 as-is
  demo/
    bridge.js player.js scene-runtime.js   # reused; small additions (below)
    demo-chrome.css
    *.test.js                 # reused logic tests + new tests for additions
    hospitality/
      journey/  index.html journey.css img/   # Vignette 1 scene
      copilot/  index.html copilot.css        # Vignette 2 scene
    retail/
      journey/  index.html journey.css img/
      copilot/  index.html copilot.css
  vignettes/                  # recorded .mp4s drop here (gitignored or LFS, TBD with user)
  assets/                     # logos, fonts, imagery
  start.bat  start.command  RUN-LOCALLY.md   # copied + relabeled
  docs/superpowers/specs/     # this design + plan
```

## Harness changes (the core requirement)

The frame already does live-embed playback. Two additions:

### A. Full-screen record mode (zero deck chrome)
Each scene `index.html` is already a standalone page meant to live in an iframe; today it only responds to the deck's `postMessage`. Add a standalone driver to `scene-runtime.js`:

- On startup, detect "not embedded" via `window.parent === window`.
- When standalone, attach the scene's own `keydown` (Arrow/Space/PageUp/PageDown), `click`, and throttled `wheel` handlers that call `player.advance() / player.rewind()` directly.
- Embedded behavior (postMessage from the deck bridge) is unchanged.

Result: to record a vignette, open e.g. `demo/hospitality/journey/index.html` directly, press F11 for fullscreen, and drive it with arrow keys — clean, full-bleed, no slide background and no browser-chrome window. Screen-record that.

### B. Dual-mode demo slot
A `data-demo-mode="live|video"` attribute on the deck `<section>` (alongside the existing `data-demo-scene`):

- `live` → operable `<iframe class="demo-frame" src="demo/.../index.html">` (rehearse/record from inside the deck too).
- `video` → `<video class="demo-video" src="vignettes/....mp4" muted playsinline>`.
- **Both wrapped in the same `.demo-window` chrome**, so vignettes are recorded *without* chrome (crisp vector chrome on playback, not video-compressed) and shipping is a one-attribute flip.
- Small deck JS: on slide-enter in `video` mode, play from start; when the video `ended`, the next forward key advances the slide (mirrors how `bridge.js` hands off when a scene is `complete`). `bridge.js`'s demo-slide detection stays keyed on `iframe.demo-frame`, so `video` slides are simply normal Reveal slides plus this small controller.

Both additions ship with unit tests in the existing `node --test "demo/*.test.js"` style for the pure logic (standalone-input decision, video handoff decision).

## Scene inventory — 2 vignettes per deck

Mapped to the 5-section script (Intro · Customer journey · Executive copilot · Automation · Summary):

| Section | Slides | Demo |
|---|---|---|
| 1. Intro (Min 1) | VO/text: "campaign factory + separate acquisition engine" → "sense, decide, act as one" | — |
| 2. Customer/Guest journey (Min 2–6) | profile card; "without Modern CRM" contrast list; "with Modern CRM" lead-in → **journey scene** | **Vignette 1** |
| 3. Executive copilot (Min 5–8) | CMO question slide → **copilot scene** | **Vignette 2** |
| 4. Automation / Business Impact (Min 9–12) | From→To framework | — |
| 5. Summary | final VO statement | — |

### Vignette 1 — "The connected journey"
Multi-beat scene built on each script's own visual metaphor: Hospitality = *a GPS route updating as signals arrive*; Retail = *a living customer graph*. A central persistent profile fills in while surface cards (social Reel → site/app → on-property / in-store → inbox) animate in, owned + paid lighting up as one route. Beats follow the script bullet order: social first touch → identity resolution → meet the advisor → signals → decisions → orchestration → (retail) loyalty join → measurement-in-the-loop.

- Hospitality (Rivage / Elena): milestone 10th-anniversary stay; anniversary suite at sunset Reel; on-property recognition; pre-arrival note → in-stay nudge → post-stay thank-you.
- Retail (Nordhem / Emma): new-apartment furnishing; influencer apartment-transformation Reel; browse kitchens / save / shopping list / cart; cart-abandon recovery; suppression of existing purchasers.

### Vignette 2 — "The executive copilot"
A conversational copilot UI. The CMO types the question (Hospitality: "increase repeat-booking rate among new loyalty members without overspending on media"; Retail: "increase visits and purchases among high-intent shoppers while improving media efficiency"). The system streams the play: identify opportunity → assemble audience (members / high-intent / lookalikes; retail adds cart-abandoners) → plan owned-first + paid-to-extend → agentic execution across CRM/loyalty/site-app/paid (retail names destinations: Meta, DV360, Google Customer Match) → estimate impact up front → prove via one feedback loop.

## Content notes / script fixes

- **Retail Loyalty bullet bug:** the source script's retail Loyalty bullet accidentally carries hospitality copy ("invites **Elena**… mid-**stay**… next **visit**"). Rewrite for Emma/Nordhem: loyalty join at the high-intent moment — member pricing, points on this order, a members-only offer on her next purchase — surfaced in the same connected experience.
- Slide copy comes largely verbatim from the scripts (the VO and on-screen bullets are the copy). The "From → To" frameworks differ between the two scripts and are reproduced per deck (hospitality = the 5-part "Modern CRM Growth Engine"; retail = the 6-row From/To table).

## Non-goals (YAGNI)

- No full e-commerce/booking app builds.
- No live backend, data, or network — 100% offline, served over local `http://` like the original.
- No automated video capture pipeline — recording is a manual screen-record of full-screen record mode.
- No changes to `connections-content-26`.

## Build sequence (high level; detailed plan follows in writing-plans)

1. Seed repo: copy frame (`vendor/reveal`, `demo/` harness + tests, start scripts), strip Tachibana content, retoken to Modern CRM identity.
2. Harness additions A + B with tests.
3. Hospitality deck shell + 5 sections (no scenes yet) → verify it runs.
4. Hospitality journey scene + copilot scene (operable) → verify record mode + live embed.
5. Retail deck shell + sections, retail journey + copilot scenes.
6. Wire dual-mode slots; document the record-and-swap workflow in RUN-LOCALLY.md.

## Open questions for the build phase

- `vignettes/` storage: gitignore the mp4s, commit them, or Git LFS? (default: gitignore + a `.gitkeep`, decide when first mp4 exists.)
- Exact Modern CRM palette/type tokens — settle during the reskin step.
