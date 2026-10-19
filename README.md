# Escape Room Card Game

A browser game and installable offline web app. Published from `master` to
https://snickbar.github.io/escaperoomgame/.

## Current release: 0.9.0 — a calmer table and fresh puzzle art

- Story Mode has one anchored top bar: **Home**, lives and **Hint** on the left,
  **Settings** on the right (story progress, journal, sound, testing tools).
  The slots leave room for more buttons.
- Every solved story puzzle closes into its own success pop-up: what you did,
  a line of story, and a **Take cards** button. Dismissing it also takes them.
  Hidden-number pictures open a code box and celebrate a correct number.
- Every crafted result now leads somewhere; none is a dead end in Discards.
  The last combination waits until every other lead is finished, so the
  finale really comes last. Trying it early costs no life.
- Logic puzzles use four places, three settings per story (never repeated in one
  run) and more kinds of notes: next to, not next to, somewhere left of, at an
  end, and between.
- New medium-detail artwork: four Picture Puzzle scenes and four Shapes
  documents per story, plus four hidden-number scenes per story.
  Regenerate with `node scripts/make-puzzle-pictures.cjs`.


Story selection uses visible illustrated buttons. Product UI should not use dropdown menus.
Puzzle workspaces use most of the phone screen and adapt to orientation changes.
Android APKs are signed release builds; “Test Mode” means the mini-game workshop, not a debug build.

- **Rusty Pipes** fills with animated water; **Electric Switchboard** carries light
  through glass tubes. Both are in the mini-game workshop and each story includes
  one of each. Source and destination stay fixed; only a connected path carries flow.
- **Picture Puzzle** replaces visible numbers with fragments of story artwork.
  The larger 4×4 board uses sixteen fragments. Tap two to swap; a reference is available.
- **Shapes** restores an illustrated document for the selected story. Fragments
  can be tried anywhere they fit; finish by lining up the document. Hints recover
  a correct layout even after experimental placements. Pieces vary in size and
  count, with at most two of any silhouette (including rotated/reflected copies).
  Board sizes still vary from 20 to 30 cells, with two safe hints.
- **Cryptogram** uses notebook paper with clear printed letters and a reveal animation. Matching
  letters still fill together. Correct letters cannot be erased or overwritten;
  mistakes remain editable. Motion respects the device's reduced-motion setting.

Future art directions: a shattered painted plate or stained-glass panel for Shapes,
a restored photograph that becomes an inventory item, and a charcoal rubbing
variant for the cryptogram. Artwork alone never changes story reward rules.

Choose **The Last Light**, **The Midnight Archive**, or **Pip Beyond the
Garden**, then **Begin adventure**. The opening goes into your discoveries;
six leads start on the table: three items, two puzzles, and a story clue.
Several branches can be investigated in different orders, with six to eight
active cards in the verified playthroughs. Early items may find partners later.

- Inspect cards to read clues and play puzzles. Story and solved-puzzle rewards have a **Take cards**
  button and are also collected when you close the card. Table previews hide
  next-card instructions. **Enter code** remains an optional way to draw a known code;
  only the two hidden-number picture clues require entering their discovered numbers.
  Wrong or premature codes cost a life; repeated discoveries do not.
- **Drag one item onto another** to combine them. Matching items draw their
  result directly; no addition or sum-code entry is needed. **Combine…**
  provides a keyboard/tap item picker as an alternative. Unrelated item pairs
  cost a life. Dropping outside an item or cancelling a drag does not.
- Items waiting for later partners stay active. Cards whose instructions and
  recipe uses are all complete leave the table for **Discards** and remain
  readable there. Discovery state survives discarding. A crafted item needed
  again stays active; clue-only results hand you the next cards when dismissed.

Each story has ten combinations, eight existing puzzles, two logic deductions,
two hidden-number picture clues, two story interludes, an opening and an ending. All 46 progression cards must be discovered. Cryptogram,
Picture Puzzle, Shapes and Pipes each appear twice. Logic: Four Places adds
uniquely solvable witness-note deductions, with two hints. Checking a wrong
deduction costs a life in Story Mode; workshop practice has no penalty.

Picture clues contain one number worked into an illustration. Their targets
stay undiscovered until the player inspects the picture and submits its number
through **I found a number** / **Enter code**. Closing a picture awards nothing.
Ordinary story and solved-puzzle cards still use automatic Take rewards.
The changing table uses
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
look like `ER3-lighthouse-12345678`. Copy the code to replay the same board,
items and generated puzzles. ER3 codes refer to this generation schema; a
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
Run `scripts/build-android.ps1` to produce `dist/EscapeRoom-0.9.0.apk`.

[Download the Android APK](https://github.com/snickbar/escaperoomgame/releases/download/android-v0.9.0/EscapeRoom-0.9.0.apk)
on your phone, open it and choose Install. Android 8.0 or newer is required.
The app works offline; its saved progress is separate from the browser version.

In the classic grid, revealed cards dim once all their uses are complete: every instructed/reward
card has been opened, their puzzle is solved, and every recipe needing the
item has been revealed. Waiting ingredients remain bright, including reused
items and crafted items needed again later. Dimmed cards remain tappable for
reference; the ending stays bright. The same tracking applies to all decks.
