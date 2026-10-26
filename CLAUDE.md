# Kalpi Porachat (קלפי פורחת)

Interactive web piece for Israel's 26th Knesset election: a visitor drops a note into an isometric ballot box and it becomes a flower. Static site on GitHub Pages, live shared counter on Firebase Realtime Database. The owner is a graphic designer; talk to him in Hebrew, keep it short.

## Files
- `index.html`: the whole piece (canvas scene, text, review panel). Plain JS, no build step.
- `config.js`: `goal` (notes until the ground is fully green, 1000) and the Firebase web config (public values).
- `live.js`: ES module. Finds the database URL (configured one, then the US and Belgium defaults), subscribes to `votes/count`, exposes `window.kalpiVote()` and calls `window.kalpiRemote(count)`.
- `database.rules.json`: paste into Firebase → Realtime Database → Rules. Public read of `votes/count`; writes only as current + 1.
- `paper.jpg`: paper texture exported from Figma, screen-blended over everything.
- `tools/make-preview.py`: one self-contained HTML (texture inlined, no Firebase, review panel on).

## Design source
- Figma file `gRrbKFeDOsnNemajXWTReN`, frame `26:6` (1920×1080). The box paths in `BOX_SVG` are the exact SVG export of node `27:882`. Don't redraw them.
- Everything is laid out in Figma units. The text UI (headline, counter, share) scales by `s` (`--s`). Desktop: `s = min(W/1920, H/1080)`. Portrait: `s = min(W/930, H/1700)`.
- The box and the garden scale by `sc = s · SCENE_K` (0.72; the owner found the frame's box too big). On desktop the box shrinks around its own middle (`HULL_C`); in portrait it's centred on the screen (horizontally always, vertically as long as the bouquet clears the measured headline and the box clears the bottom row). The box strokes stay 2.5 on screen (`LINE_K`). Phone plants: `PLANT_K` 1.15.
- Fonts come from Adobe Fonts kit `nsr0kgo`: headline in Levit 1950 Black Extended; number in Narkiss Yair Variable "Bold Mono" (`--num-vars: "MONO" 1`; the axis tag is a guess, not verified); label in Narkiss Yair Regular. The review panel reads the kit at runtime and lists every face.
- Palette: bg `#1c7de4`, ink `#101010`, lawn `#93dd6f`. Strokes 2.5. Shadows are solid ink, projected with `V = (1.662, 0.742)` per unit of height (read off the Figma shadow).

## How notes become flowers
- Notes 1–30 (`SLOT_MAX`) grow a bouquet out of the slot. Small grass patches sprout at notes 4, 9, 15, 21, 27.
- From note 31, each note is one flower in a patch. `genGarden()` pre-assigns every note to a flower (`voteFlower[v]`), and a patch's radius grows just enough to hold its released flowers. At `goal` the ground is fully covered. The number of flowers on screen equals the count.
- The garden (`nGrow`) chases the real count (`target`) one flower at a time: a seed flies from the box to the flower's spot. Jumps larger than 12 bloom in at once.
- One note per page load (`voted`); a refresh allows another, as the owner asked.
- Performance: plants are pre-rendered sprites. Settled shadows and windless plants (grass, clover, bush, fern, sabra) are painted once into static layers; grown flowers are a single image (stem + head). The lawn has its own layer, repainted only when a patch moves.
- Wind needs every flower redrawn every frame. `watchSpeed()` turns it off (`STILL`) when the median frame is over 24 ms; then every plant goes into the static layers and the canvas repaints only while something moves (note, seed, ring, growing plant, lawn spring). Measured on a 4×-throttled phone emulation: 4 fps at 300 notes before, 60 fps idle after.
- Resize regrows the garden only on a width change or a height change over 20% (phone toolbars and keyboards don't).

## Share
Bottom-right button, the counter's box mirrored with the box's solid shadow. `navigator.share` (phones), otherwise copies the link (without `?review`) and shows "הקישור הועתק". The arrow nudges after the visitor's note goes in. Open Graph tags are in the head; there's no `og:image` yet (a 1200×630 export from Figma would make WhatsApp previews much better).

## Review panel
Add `?review` to the URL. Preset states, a slider, "the whole process" autoplay, wind, fonts. Everything in it is a local simulation; "חזרה לחי" returns to the live count.

## Deploy
GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `(root)`. URL: `https://aki12234-lgtm.github.io/2026_Elections/`.

## Open items
- Push to `aki12234-lgtm/2026_Elections` and turn on Pages.
- Confirm which region the database was created in. The owner said only the USA option worked, but the config URL is the Belgium one; `live.js` falls back either way. Check the browser console for `kalpi: live on …`.
- Check that the rules are published in Firebase.
- Test on a real phone (only emulated so far) and with the real kit fonts (never rendered in the cloud session).
- The owner is writing the final copy (headline, counter label, share button).
- `og:image` for link previews.
