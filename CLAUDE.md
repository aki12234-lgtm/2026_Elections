# Ulai Yitzmach Mize Mashehu (אולי יצמח מזה משהו)

Interactive web piece for Israel's 26th Knesset election: a visitor drops a note into an isometric ballot box and it becomes a flower. Static site on GitHub Pages, live shared counter on Firebase Realtime Database. The owner is a graphic designer; talk to him in Hebrew, keep it short.

## Files
- `index.html`: the whole piece (canvas scene, text, review panel). Plain JS, no build step.
- `config.js`: `goal` (notes until the ground is fully green, 1000), `offset` (50: added to the live count before it is shown, counter and garden alike, so the piece opens partway; the owner chose real + 50 over an honest counter) and the Firebase web config (public values).
- `live.js`: ES module. Finds the database URL (configured one, then the US and Belgium defaults), subscribes to `votes/count`, exposes `window.kalpiVote()` and calls `window.kalpiRemote(count)`.
- `database.rules.json`: paste into Firebase → Realtime Database → Rules. Public read of `votes/count`; writes only as current + 1.
- `paper.jpg`: paper texture exported from Figma, screen-blended over everything.
- `tools/make-preview.py`: one self-contained HTML (texture inlined, no Firebase, review panel on).
- `og.jpg`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`: share image (a close-up of the real scene at 1200×630: box and bouquet at 30 notes, no text, since the owner found the full frame with the headline unreadable as a preview) and icons (the Figma box with a flower out of the slot, cropped so the frame cuts the box). `node tools/make-images.mjs [notes]` regenerates them with headless Edge/Chrome; it serves the page with `fonts/` blocked, so the Tel Aviv files are never loaded.
- `fonts/tel-aviv/`: the Tel Aviv family by Fontef (Brutalist, Modernist, Eclectic) as delivered. Website License #04813, for this domain only, under 10k monthly visitors. The license forbids changing the files (no conversion, subsetting or base64) and any AI processing of them: never open, parse, convert or render-test these files; only reference them from CSS.

## Design source
- Figma file `gRrbKFeDOsnNemajXWTReN`, frame `26:6` (1920×1080). The box paths in `BOX_SVG` are the exact SVG export of node `27:882`. Don't redraw them.
- Everything is laid out in Figma units and scaled by `--s`. Desktop: `s = min(W/1920, H/1080)`. Portrait: `s = min(W/930, H/1700)`, with the box placed between the headline and the counter (see `layout()`).
- Fonts: headline in Tel Aviv Brutalist Bold (`@font-face` rules at the top of the style, files in `fonts/tel-aviv/`). Number and label come from Adobe Fonts kit `nsr0kgo`: number in Narkiss Yair Variable "Regular Mono" (wght 400, `--num-vars: "MONO" 100`; axes verified: wght 200–700, MONO 0–100), label in Narkiss Yair Regular. The kit's Character Set must stay "All Characters" or Hebrew falls back to a system font (Default is Latin only). Levit 1950 is out: its Hagilda license is desktop/print only. The review panel lists the kit faces and the local Tel Aviv faces.
- Palette: bg `#1c7de4`, ink `#101010`, lawn `#93dd6f`. Strokes 2.5. Shadows are solid ink, projected with `V = (1.662, 0.742)` per unit of height (read off the Figma shadow).

## How notes become flowers
- Notes 1–30 (`SLOT_MAX`) grow a bouquet out of the slot. Small grass patches sprout at notes 4, 9, 15, 21, 27.
- From note 31, each note is one flower in a patch. `genGarden()` pre-assigns every note to a flower (`voteFlower[v]`), and a patch's radius grows just enough to hold its released flowers. At `goal` the ground is fully covered. The number of flowers on screen equals the shown count (live + `offset`). The review panel's mode line shows the real server count and the offset.
- The garden (`nGrow`) chases the real count (`target`) one flower at a time: a seed flies from the box to the flower's spot. Jumps larger than 12 bloom in at once.
- One note per page load (`voted`); a refresh allows another, as the owner asked.
- Plants are modelled in 3D (x right, y toward the viewer, z up) and projected with the box's isometric camera, cel-shaded with the light that casts the box's shadow (`SUN`). Every outline is the box's 2.5 stroke on screen, so plants have no per-plant scale.
- The bouquet's 30 flowers bend live: each stem is drawn per frame from the slot, heads and leaves are sprites carried along. Their shadow crosses the lid (clipped to it) and the rest lands on the ground past the box.
- Wind (`sway()`) is a push in world x/y per unit of height: a shared gust plus each plant's own sway, so neighbours don't move as one.
- Performance: garden plants are pre-rendered sprites. Settled shadows and windless plants (grass, clover, bush, fern, sabra) are painted once into static layers; grown flowers are a single image (stem + head).

## Review panel
Add `?review` to the URL. Preset states, a slider, "the whole process" autoplay, wind, fonts. Everything in it is a local simulation; "חזרה לחי" returns to the live count.

## Deploy
GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`. URL: `https://aki12234-lgtm.github.io/2026_Elections/`.

## Open items
- Check that the rules are published in Firebase. (The database is the Belgium one: the live site logs `kalpi: live on https://kalpi-e4081-default-rtdb.europe-west1.firebasedatabase.app`, and a vote went through on 2026-10-26.)
- Test on a real phone (only emulated so far) and with the real kit fonts (never rendered in the cloud session).
- The owner is writing the final copy (headline, counter label).
- The owner picks the final Tel Aviv face in `?review` (Brutalist Bold is only a default chosen by file name).
