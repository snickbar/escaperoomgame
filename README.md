# Escape Room Card Game

A browser game and installable offline web app. Published from `master` to
https://snickbar.github.io/escaperoomgame/.

## Current release: 0.5.0

Story Mode has three complete adventures: **The Last Light**, **The Midnight
Archive**, and **Pip Beyond the Garden**. Choose an adventure above the deck menu,
then select Story and deal.

Each adventure contains ten story-specific combinations, eight puzzles, two
interlude clue cards, an opening and an ending. The table has 54–72 cards;
42 are part of the adventure and the rest are traps. Cards remain strictly
sorted from 0–199 in four columns on every device. Combination numbers are
the actual sum of two different ingredient cards. Items from different pairs
are discovered before their partners, so several discoveries can be pending.

Cryptogram, Number Swap, Shapes and Pipes each appear twice in a Story game,
with a shuffled puzzle bag. Directional clues are optional, capped at two,
and only replace a numbered instruction when the actual sorted layout supports
the direction. The ending requires all adventure cards and puzzles.

All modes have three lives. An incorrect or premature flip costs a life and
does not reveal the card. Open a face-up card to read its full text and play
its puzzle. Table thumbnails show short titles and complete instructions;
longer prose stays in the readable detail view and adventure journal.

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

## Content and artwork

- `story-content.js`: three plots, chapter clues, payoffs and 30 new recipes.
- `adventure-engine.js`: deterministic randomness, progression, validation,
  and exact-cover Shapes hint assistance.
- `index.html`: game interface and puzzle renderers; existing modes remain.
- `app-ui.js`: player controls, replay/report tools and update handling.
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
Run `scripts/build-android.ps1` to produce `dist/EscapeRoom-0.5.0.apk`.

[Download the Android APK](https://github.com/snickbar/escaperoomgame/releases/download/android-v0.5.0/EscapeRoom-0.5.0.apk)
on your phone, open it and choose Install. Android 8.0 or newer is required.
The app works offline; its saved progress is separate from the browser version.
