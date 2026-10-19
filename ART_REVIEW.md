# Visual and graphics review — release 0.5.0

## Scope and evidence

Reviewed the original 16 illustrated triads, all 30 new story triads and three
cover illustrations in the in-app gallery, plus home, table, story detail,
ending and Shapes screens in Chromium. Automated layout checks used widths
320, 390, 768 and 1280. Touch interaction was tested in a mobile browser
context; physical-device testing is still useful for finger occlusion,
screen brightness and platform-specific installation behaviour.

## Existing illustrated item collection

The hand-painted look, simple backgrounds and large isolated objects are the
strongest existing visual assets. Preserve them. The artwork is already
recognizable when enlarged and has more texture and character than the new
vector collection.

Problems to address in a later illustration pass:

- Blue/yellow/green borders are baked into many images. They should eventually
  be drawn by the interface, so we can change the frame without repainting.
- Some triads need a semantic cleanup as well as nicer art: hook + fishing
  line does not add bait, seeds + a pot needs growth/time, birdseed + a cage
  needs an actual bird, and a blank scroll becoming a stone-looking rune
  tablet changes the underlying material. Choose clear recipes before
  commissioning their final paintings.
- Original crops have different amounts of padding, lighting and ornament.
  Use a shared safe area and consistent object scale in replacement assets.
- Important differences must survive thumbnail size. Empty/full cameras and
  small filled vials need stronger silhouettes or enlarged state details.

## New story collection

Added 30 thematic recipes (90 SVG item pictures) and three cover scenes. Each
adventure uses its own accent, a common dark background and a shared drawing
language. The new collection is deliberately a separate, coherent vector art
direction, not a claim that the original painted images have been upgraded.

Results show visible state changes: open containers, repaired joins, working
lights, a filled bowl, an open drain and a supported rescue ramp. Item names
remain available in the detail header and gallery; recognition must not depend
on colour alone. Keeping the source SVG generator makes composition, scale
and contrast inexpensive to revise.

The vector pictures are a functional first art pass. They are simpler than the
original paintings. Before replacing the painted collection, compare two or
three finished examples side by side with the owner and choose one long-term
style. The gallery deliberately keeps both collections available for that
decision. No original illustrations or untracked source exports were removed.

## Interface changes made

- Long plot paragraphs moved out of cramped table thumbnails into scrollable
  story details and the journal. Thumbnails retain a short title, number and
  full instruction. Container sizing plus a measured text-fit pass prevents
  clipping on tested widths.
- Increased number contrast, retained non-selectable card text, preserved
  four-column geometry and strict numerical order.
- Item art uses `contain` so the full object is visible rather than cropped.
- Enlarged Shapes tray pieces and letter keyboard touch targets. Cryptogram
  words stay grouped on small screens. Added pointer capture/cancellation
  cleanup so dragging does not leave a ghost behind on navigation.
- Story details and congratulations panels scroll on short screens; the close
  control remains available. The ending includes the actual plot resolution,
  duration and wrong-card recap.
- Added a visible version, sound toggle, explicit update control and reduced-
  motion support. Updates do not interrupt an active game.

## Recommended next graphics work

1. Pick the final item-art style using a small comparison set: lantern + oil,
   drain cover + handle, and desk lamp + battery. These test light, metal,
   texture and result readability without repainting everything first.
2. Commission one environment scene and two chapter illustrations per story.
   Narrative illustrations should not share the item-card crop. Design any
   hidden numbers into deliberate readable locations and test them at phone
   size; do not rely on accidental marks in generated artwork.
3. Add water travelling through the pipes, a brief piece-settling animation
   for Shapes, and tile-swap motion. Keep transitions short and respect
   reduced motion. Avoid animation that obscures the next actionable clue.
4. Revisit the home screen's legacy emoji deck icons after the story covers
   and item direction are approved. Give puzzle types a matching icon family.

## Known product limits

The three adventures now have authored plots and connected chapter payoffs,
but recipe order is intentionally authored; random seeds vary numbers,
traps, puzzle instances and puzzle-type order. There is no authenticated
account system or cross-device save. Active games do not resume after reload.
Full painted replacements, illustrated environment scenes, hidden-number
artwork and advanced puzzle animations remain a later art pass.
