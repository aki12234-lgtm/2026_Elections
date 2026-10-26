# Ulai Yitzmach Mize Mashehu (אולי יצמח מזה משהו)

Interactive web piece for Israel's 26th Knesset election: a visitor drops a note into an isometric ballot box and it becomes a flower. Static site on GitHub Pages, live shared counter on Firebase Realtime Database. The owner is a graphic designer; talk to him in Hebrew, keep it short.

## Files
- `index.html`: the whole piece (canvas scene, text, review panel). Plain JS, no build step.
- `config.js`: `goal` (notes until the ground is fully green, 60), `sprout` (the note from which islands sprout, 6), `offset` (added to the live count before it is shown; 0 since the owner moved to goal 60, it was 50 at goal 1000) and the Firebase web config (public values).
- `live.js`: ES module. Probes the configured, US and Belgium database URLs at once (first answer wins, and its REST answer is shown as the count right away), loads the SDK in parallel (also `modulepreload`ed in the head), subscribes to `votes/count`, exposes `window.kalpiVote()` and calls `window.kalpiRemote(count)`; on failure `window.kalpiLocal()`.
- `database.rules.json`: paste into Firebase → Realtime Database → Rules. Public read of `votes/count`; writes only as current + 1.
- `paper.jpg`: paper texture exported from Figma, screen-blended over everything.
- `tools/make-preview.py`: one self-contained HTML (texture inlined, no Firebase, review panel on).
- `og.jpg`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`: share image (a close-up of the real scene at 1200×630: box and bouquet at 30 notes, no text, since the owner found the full frame with the headline unreadable as a preview) and icons (the Figma box with a flower out of the slot, cropped so the frame cuts the box). `node tools/make-images.mjs [notes]` regenerates them with headless Edge/Chrome; it serves the page with `fonts/` blocked, so the Tel Aviv files are never loaded.
- `fonts/tel-aviv/`: the Tel Aviv family by Fontef (Brutalist, Modernist, Eclectic) as delivered. Website License #04813, for this domain only, under 10k monthly visitors. The license forbids changing the files (no conversion, subsetting or base64) and any AI processing of them: never open, parse, convert or render-test these files; only reference them from CSS.

## Design source
- Figma file `gRrbKFeDOsnNemajXWTReN`, frame `26:6` (1920×1080). The box paths in `BOX_SVG` are the exact SVG export of node `27:882`. Don't redraw them.
- Everything is laid out in Figma units. The text UI (headline, counter, share) scales by `s` (`--s`). Desktop: `s = min(W/1920, H/1080)`. Portrait: `s = min(W/930, H/1700)`.
- The box and the garden scale by `sc = s · SCENE_K` (0.72; the owner found the frame's box too big). On desktop the box shrinks around its own middle (`HULL_C`); in portrait it's centred on the screen (horizontally always, vertically as long as the bouquet clears the measured headline and the box clears the bottom row). `LINE_K = s/sc` keeps every outline at 2.5 on screen. Phone plants: `PLANT_K` 1.15.
- Fonts: headline in Tel Aviv Brutalist Bold (`@font-face` rules at the top of the style, files in `fonts/tel-aviv/`). Number and label come from Adobe Fonts kit `nsr0kgo`: number in Narkiss Yair Variable "Regular Mono" (wght 400, `--num-vars: "MONO" 100`; axes verified: wght 200–700, MONO 0–100), label in Narkiss Yair Regular. The kit's Character Set must stay "All Characters" or Hebrew falls back to a system font (Default is Latin only). Levit 1950 is out: its Hagilda license is desktop/print only. The review panel lists the kit faces and the local Tel Aviv faces.
- Palette: bg `#1c7de4`, ink `#101010`, lawn `#93dd6f`. Strokes 2.5. Shadows are solid ink, projected with `V = (1.662, 0.742)` per unit of height (read off the Figma shadow).

## How notes become flowers
- Notes 1–30 (`SLOT_MAX`) grow a bouquet out of the slot, one flower each.
- From note `sprout` (6) islands sprout around the box (4 at once, the rest opening until ~88% of the way to `goal`), and every note also releases a batch of flowers (`FIELD` = 900 spread over the notes up to `goal`, ~16 each) into open islands by the room they have left. `genGarden()` pre-assigns them (`voteFlower[v]` is the note's batch); a patch's radius grows just enough to hold its released flowers. At `goal` (60) the ground is fully covered. (Until 2026-10-26 it was one note = one flower with `goal` 1000; the owner asked for islands from 6 notes and a full garden at 60.)
- The garden (`nGrow`) chases the count (`target`) one note at a time: a seed flies from the box to the batch's first flower and the batch pops up in a quick cascade. Jumps larger than 12 bloom in at once. Counted flowers never sit behind the box (`hidden()`).
- The note (DOM `#note`, class `note-paper`) is the paper itself: same size (`PAPER_T` 0.1–0.9 of the slot × `PAPER_H` 200) and the same perspective as in the slot (skewY 30°, no rotation or scaling), as the owner asked. It follows the mouse with a little lag; only a click on the box throws it (anywhere else it shakes). On touch it waits beside the lid's left corner: tap it, tap the box, or drag it in. It flies to the slot, then the canvas paper drops in with the same message printed on it. Messages (`MESSAGES`): hope/growth/peace words, no party names (avoid e.g. "תקווה חדשה", "יש עתיד").
- The counter is hidden (`.waiting`) until the first real count; a returning visitor sees the last count from `localStorage` at once. A note cast before Firebase is ready waits for `kalpiVote` (up to 8 s).
- One note per page load (`voted`); a refresh allows another, as the owner asked.
- Plants are modelled in 3D (x right, y toward the viewer, z up) and projected with the box's isometric camera, cel-shaded with the light that casts the box's shadow (`SUN`). Every outline is the box's 2.5 stroke on screen, so plants have no per-plant scale.
- The bouquet's 30 flowers bend live: each stem is drawn per frame from the slot, heads and leaves are sprites carried along. Their shadow crosses the lid (clipped to it) and the rest lands on the ground past the box.
- Wind (`sway()`) is a push in world x/y per unit of height: a shared gust plus each plant's own sway, so neighbours don't move as one.
- Performance: garden plants are pre-rendered sprites. Settled shadows and windless plants (grass, clover, bush, fern, sabra) are painted once into static layers; grown flowers are a single image (stem + head). The lawn has its own layer, repainted only when a patch moves.
- Wind needs every flower (and the bouquet) redrawn every frame. `watchSpeed()` turns it off (`STILL`) when the median frame is over 24 ms; then every plant goes into the static layers and the canvas repaints only while something moves (note, seed, ring, growing plant, lawn spring). 4×-throttled phone emulation: idle 60 fps at every count.
- Resize regrows the garden only on a width change or a height change over 20% (phone toolbars and keyboards don't).

## Share
Wide screens: top-left, level with the headline. Portrait: bottom row with the counter (no room beside the headline). The counter's box with the box's solid shadow. `navigator.share` (phones), otherwise copies the link (without `?review`) and shows "הקישור הועתק". The arrow nudges after the visitor's note goes in.

## Review panel
Add `?review` to the URL. Preset states, a slider, "the whole process" autoplay, wind, fonts. Everything in it is a local simulation; "חזרה לחי" returns to the live count.

## Deploy
GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`. URL: `https://aki12234-lgtm.github.io/2026_Elections/`.

## Open items
- Check that the rules are published in Firebase. (The database is the Belgium one: the live site logs `kalpi: live on https://kalpi-e4081-default-rtdb.europe-west1.firebasedatabase.app`, and a vote went through on 2026-10-26.)
- Test on a real phone (only emulated so far) and with the real kit fonts (never rendered in the cloud session).
- The owner is writing the final copy (headline, counter label, share button, the note messages).
- `og.jpg` still shows the frame-size box; regenerate with `tools/make-images.mjs` if the owner wants it to match.
- The owner picks the final Tel Aviv face in `?review` (Brutalist Bold is only a default chosen by file name).
