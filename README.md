# Escape Room Card Game

A browser game and installable offline web app. Published from `master` to
https://snickbar.github.io/escaperoomgame/.

## Current release: 0.6.1 — the active table

Choose **The Last Light**, **The Midnight Archive**, or **Pip Beyond the
Garden**, then **Begin adventure**. The opening goes into your discoveries;
just two leads start on the table. Typical play holds two or three active
cards instead of a full spread.

- Inspect cards to read clues and play puzzles. Story rewards have a **Take cards**
  button and are also collected when you close the card. Table previews hide
  next-card instructions. **Enter code** draws answers found in completed puzzles.
  Wrong or premature codes cost a life; repeated discoveries do not.
- **Drag one item onto another** to combine them. Matching items draw their
  result directly; no addition or sum-code entry is needed. **Combine…**
  provides a keyboard/tap item picker as an alternative. Unrelated item pairs
  cost a life. Dropping outside an item or cancelling a drag does not.
- Items waiting for later partners stay active. Cards whose instructions and
  recipe uses are all complete leave the table for **Discards** and remain
  readable there. Discovery state survives discarding. A crafted item needed
  again stays active; clue-only results hand you the next cards when dismissed.

Each story has ten combinations, eight puzzles, two interludes, an opening
and an ending. All 42 progression cards must be discovered. Cryptogram,
Number Swap, Shapes and Pipes each appear twice. The changing table uses
numbered codes from 0–199 rather than positional neighbor clues. The deck
counter shows undiscovered story cards, not trap guesses.

There are three lives, plus an ending with time, errors and completion/records.
The home screen's **Quick play & puzzle workshop** contains the original
Easy/Medium/Hard grid modes, mini-games and the art gallery. They keep their
original flip/sum rules.

The paper, teal and brass interface has three painted story covers, a new
lantern/oil/result illustration set, matching puzzle stamps and 90 restyled
vector item drawings. Original painted recipe sets are retained.

## Testing and reporting problems

The footer shows the app version and has **Testing tools**. Story game codes
look like `ER2-lighthouse-12345678`. Copy the code to replay the same board,
items and generated puzzles. ER2 codes refer to this generation schema; a
future change to generation should increment the schema rather than silently
changing old codes.

The panel can validate a game and generate a report containing the code,
version, revealed cards, mistakes, viewport and current puzzle state. Nothing
is sent anywhere automatically. Developer answer/solve controls are hidden
until explicitly enabled. These are local tools, not an authenticated admin
system. Answer reveals and developer solves mark the run as practice and
exclude it from completion and best-time records.

An available app update waits for the player to select **Update app (restarts
game)**. It never automatically reloads an active adventure. Normal reopening
and offline play use a consistent cached release. Active in-progress games
are not persisted across reloads; completion and best times are saved per
adventure on the same browser/device.

## Automated review

Development tooling requires Node and Playwright:

```text
npm install
npx playwright install chromium
npm test
```

If using an existing Playwright installation, set `PLAYWRIGHT_MODULE` to its
module path and, if needed, `PLAYWRIGHT_BROWSERS_PATH` to its browser folder.
The game itself has no runtime package dependencies or build step.

The tests serve the real app locally and cover 450 seeded adventures, exact
replay, balanced number bands, puzzle gating, ending eligibility, 150 Shapes
hint continuations, phone/desktop overflow, puzzle controls, all older decks,
game-over input blocking, real mobile touch dragging, the gallery, an offline
reopen, and a waiting service-worker update. Screenshots and results go in the
ignored `.qa-output/` folder.

The active-table suite also completes 60 adventures across all three themes
with different reward orders. It checks the small active-card limit, code
gating, real mouse and touch combinations, cancelled drags, wrong pairs,
discards, clue-to-code buttons, restart cleanup and all six new assets offline.

## Content and artwork

- `story-content.js`: three plots, chapter clues, payoffs and 30 new recipes.
- `adventure-engine.js`: deterministic randomness, progression, validation,
  and exact-cover Shapes hint assistance.
- `index.html`: game interface and puzzle renderers; existing modes remain.
- `app-ui.js`: player controls, replay/report tools and update handling.
- `tabletop.js` / `tabletop.css`: active-table adventures, codes, drag/drop,
  discards and the warm interface. `tabletopEnabled=false` exists only for
  regression coverage of the former Story grid.
- `art/scenes/`: six generated illustrations, all bundled for offline play.
- `art/items/`: original 48 illustrated item images (16 recipes).
- `art/story/`: 90 editable SVG item illustrations and three story covers.
- `scripts/make-story-art.cjs`: regenerates story illustrations and the offline
  artwork list. Run `npm run art` after changing story artwork/content.
- `gallery.html`: compares every original and new combination triad.
- `sw.js`: offline cache. Increment its cache version when shipping changes.

See `ART_REVIEW.md` for the visual review and the remaining art direction work.
Source image exports in the repository root remain untracked and untouched.

Changes should be committed and pushed together after verification, per the
project owner's standing preference.

## Installable Android version

The game can also be packaged as an offline Android APK. See
[`android/README.md`](android/README.md) for building, signing and installation.
Run `scripts/build-android.ps1` to produce `dist/EscapeRoom-0.6.1.apk`.

[Download the Android APK](https://github.com/snickbar/escaperoomgame/releases/download/android-v0.6.1/EscapeRoom-0.6.1.apk)
on your phone, open it and choose Install. Android 8.0 or newer is required.
The app works offline; its saved progress is separate from the browser version.

In the classic grid, revealed cards dim once all their uses are complete: every instructed/reward
card has been opened, their puzzle is solved, and every recipe needing the
item has been revealed. Waiting ingredients remain bright, including reused
items and crafted items needed again later. Dimmed cards remain tappable for
reference; the ending stays bright. The same tracking applies to all decks.
