# Run the Merkle demos locally (offline)

The decks load local assets and embedded scene sub-pages, so they must be
**served over `http://`** — browsers block module scripts and iframes when you
open an HTML file directly under `file://`. Once you have this folder the whole
thing runs **100% offline**, no internet required.

---

## Pages

| URL (at :8080) | What it is |
|---|---|
| `/hospitality.html` | Rivage hotel — Elena's connected-guest journey + executive copilot |
| `/retail.html` | Nordhem — Emma's living-customer-graph journey + executive copilot |
| `/demo/hospitality/journey/index.html` | Hospitality journey scene (standalone) |
| `/demo/hospitality/copilot/index.html` | Hospitality copilot scene (standalone) |
| `/demo/retail/journey/index.html` | Retail journey scene (standalone) |
| `/demo/retail/copilot/index.html` | Retail copilot scene (standalone) |

---

## Run it

### Easiest: one double-click

- **Windows:** double-click **`start.bat`**
- **macOS:** double-click **`start.command`**

It starts a local server and opens the deck. Leave the terminal window open
during the talk; close it (or press Ctrl+C) to stop. Requires **Python 3**
(pre-installed on macOS; on Windows get it from https://python.org).

> **macOS note:** if `start.command` does nothing, it lost its executable bit
> (common after a ZIP or Drive download). Fix once in Terminal:
> `chmod +x start.command` — then double-click works. You may also need to
> right-click → Open the first time to clear Gatekeeper.

### Manual (any OS)

From the repo folder:

```
python -m http.server 8080        # or:  npx serve
```

Then open either deck:

```
http://127.0.0.1:8080/hospitality.html
http://127.0.0.1:8080/retail.html
```

### In the deck

Arrow keys, a presenter clicker, **click**, or **scroll** all advance — beats
within a demo scene, then on to the next slide. Press **F** for fullscreen.

---

## Record a vignette

Each scene is a standalone page that drives itself when opened directly (not
embedded). Open it in isolation for a clean, chrome-free capture.

### Steps

1. Start the server (see above).
2. Open the scene URL directly, e.g.:
   ```
   http://127.0.0.1:8080/demo/hospitality/journey/index.html
   ```
3. Press **F11** (Windows) or enter full-screen via the OS — the scene has no
   deck chrome or browser UI, so the capture is clean.
4. Start your screen recorder.
5. Drive with arrow keys: **→** next beat, **←** previous beat. Click and scroll
   also work.
6. Stop the recorder and save.

> **Why standalone?** The deck wraps the playback video inside its own
> `.demo-window` browser-chrome mockup. Recording a scene *without* that chrome
> means the video composites cleanly inside the frame — you won't get
> double-chrome.

### Save locations

Save recordings to the `vignettes/` folder using the naming convention
`<deck>-<scene>.mp4`:

| Scene | Save as |
|---|---|
| Hospitality journey | `vignettes/hospitality-journey.mp4` |
| Hospitality copilot | `vignettes/hospitality-copilot.mp4` |
| Retail journey | `vignettes/retail-journey.mp4` |
| Retail copilot | `vignettes/retail-copilot.mp4` |

`vignettes/*.mp4` and `vignettes/*.mov` are gitignored by default (see
`.gitignore`) — the folder itself is tracked via `vignettes/.gitkeep`.

---

## Swap a slot from live to recorded video

Each demo slot in the deck HTML is a `<section>` with two data attributes:

```html
data-demo-scene="journey|copilot"
data-demo-mode="live"
```

To switch a slot from the live embedded scene to a recorded vignette, make two
small edits in `hospitality.html` or `retail.html`.

### Before (live iframe)

```html
<section class="slide--dark slide-vcenter"
         data-demo-scene="journey"
         data-demo-mode="live">
  <div class="demo-window">
    <div class="demo-window__bar">
      <div class="demo-window__dots">…</div>
      <div class="demo-window__url">rivage.com · The connected guest journey</div>
    </div>
    <div class="demo-window__body">
      <iframe class="demo-frame"
              src="demo/hospitality/journey/index.html"
              title="Rivage — the connected guest journey"></iframe>
    </div>
  </div>
</section>
```

### After (recorded video)

```html
<section class="slide--dark slide-vcenter"
         data-demo-scene="journey"
         data-demo-mode="video">
  <div class="demo-window">
    <div class="demo-window__bar">
      <div class="demo-window__dots">…</div>
      <div class="demo-window__url">rivage.com · The connected guest journey</div>
    </div>
    <div class="demo-window__body">
      <video class="demo-video"
             src="vignettes/hospitality-journey.mp4"
             muted playsinline></video>
    </div>
  </div>
</section>
```

Two changes only:

1. `data-demo-mode="live"` → `data-demo-mode="video"`
2. Replace the `<iframe class="demo-frame" …>` with a `<video class="demo-video" …>`

Keep the `.demo-window` / `.demo-window__bar` wrapper unchanged.

### Playback behaviour in the deck

- The video auto-plays when you navigate to that slide.
- A forward keypress skips to the final frame (so you can pause mid-video and
  still advance cleanly).
- The next forward keypress moves to the next slide.

The swap is per-slot — you can mix live and video slots across the two decks
while you're iterating.
