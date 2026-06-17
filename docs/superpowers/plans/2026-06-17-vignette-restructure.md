# Vignette Restructure — Plan

**Date:** 2026-06-17 · **Branch:** `restructure-vignettes`

**Goal:** Fuse the up-front explainer content into the demo vignettes, restructure each deck around a 3-beat agenda, rebuild the customer-experience vignette as a realistic "website + explainer panel," and add a new Marketing-Ops timeline vignette.

## Reference pattern (from connections-content-26)
The `salesforce/journey` scene = two-pane: a realistic surface (left) + an explainer panel (right) with numbered steps, channel/owned-paid tags, status indicators, progress bar, closing through-line. The Tachibana beat layered a Merkury recognition toast on a real homepage then stepped into the Bantō advisor narrating its actions. Emulate: *real interface + a panel saying what she's doing and what the AI is doing.*

## Decisions (approved)
- Agenda cards link to each beat's slide **in-deck** (anchors); standalone scene pages kept for recording.
- Marketing-Ops vignette = **one generic, brand-agnostic** scene reused by both decks.
- The new two-pane customer-experience scene **replaces** the abstract journey scene (rebuilt in place at `demo/<deck>/journey/`).

## Work

### 1. Marketing-Ops vignette (NEW, generic, shared) — `demo/marketing-ops/`
Horizontal plan-to-launch timeline. Phases in weeks: **Strategy(3) · Creative(4) · Review(2) · Build(3) · Launch(2)** = ~14 wks "before". Beats:
- 0: full timeline today (~14 wks).
- 1–5: per phase, AI bullets animate in and the phase segment shrinks (Strategy→faster insights/sharper messaging; Creative→generative on-brand variants; Review→automated checks/fewer rounds; Build→auto-assembled audiences+journeys; Launch→one-trigger cross-channel, every market).
- 6: before-vs-after timelines stacked + impact line (~14 wks → ~5 wks, ~Xx faster, same team).
Neutral palette + blue "AI/after" accent. Import `../scene-runtime.js`. `total: 6`.

### 2. Customer-experience vignette (REBUILD, per deck) — `demo/<deck>/journey/`
Two-pane: **left** = the brand's real surface (Rivage property site / Nordhem storefront) that changes per beat (browse, save, recognition toast, advisor bubble, personalized offer, inbox handoff); **right** = explainer panel that FUSES the front matter — a "what we know" profile card that fills in (identity, intent signals, life moment, channels) + numbered steps with head/subhead (*what she's doing* + *what the AI is doing*), owned/paid tags, progress bar. Beats (10, total 9): anonymous arrival → recognized (Merkury-style toast) → profile enriches → meet advisor → signals/she acts → decisions/next-best → orchestration (owned+paid) → agentic execution → governed by design → measurement. Keep each deck's own brand palette (not Merkle). Import `../../scene-runtime.js`.

### 3. Deck restructure (both `hospitality.html` + `retail.html`) + deck.css agenda styles
- Condense front matter: Title → ONE setup/VO slide → **3-beat agenda slide** (cards w/ head+subhead linking to each beat's slide id). REMOVE standalone "We follow…", profile, "Without Modern CRM", and "Contrast…" slides (content now lives in the vignette).
- Beats: (1) customer-experience vignette; (2) CMO question + copilot vignette; (3) short intro + marketing-ops vignette (`demo/marketing-ops/index.html`).
- Keep Business-Impact From→To framework + summary.
- Add `.agenda` / `.beat-card` component to deck.css (Merkle tokens, radius scale).

### 4. Landing `index.html`
Update scene links to the new set (customer-experience, copilot per deck + shared marketing-ops).

## Verify
Tests green; all pages + scenes serve 200; beat counts correct; final screenshot QA pass (saved for the end).
