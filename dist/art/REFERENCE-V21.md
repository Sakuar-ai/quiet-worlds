# Ocean reference translation — v21

The approved board is the user's “海洋主题波浪音效风格指南.png”.
The same calm background plate remains visible at every intensity: pale clouds,
three small bird marks, a distant boat at x≈72%, and a horizon fixed at 50% of the
scene area. Only the three translucent water strips evolve.

Runtime assets:
- [Calm background plate](ocean-reference-v21-base.webp)
- [Three simultaneous water depth strips](ocean-reference-v21-waves.webp)
- [Shell slider](ocean-shell.svg), unchanged from the approved shell identity.

These are TWO illustration assets, not five scene-state frames. The atlas rows
are rear/middle/foreground depth layers; they are present together. The app's
existing RAF integrates the motion phase, smooths target intensity, scales wave
height and blends foam-bearing water gradually. The sky/boat never swap.

Generated with the built-in image_gen tool (not CLI), using the approved board
as the visual reference. The atlas received one targeted edit to round and
gently turn the crests, retaining its texture and alpha. WebP delivery encoding
preserves the atlas transparency and substantially reduces downloads. Source
PNG originals remain in the project workspace and the generated-images folder.

Ocean title/subtitle use bundled Kalam Regular from the official Google Fonts
repository, with its [SIL Open Font License](../fonts/Kalam-OFL.txt).
Other worlds' typography is unchanged.

## Final prompt set

### Calm background plate

Use case: illustration-story. Asset type: portrait background plate for a live illustrated ambient Ocean app. Input image 1 is the APPROVED design guide, not an image to place inside the output. Translate ONLY the FIRST phone's main scenery (Calm sea), very faithfully, into a standalone full-bleed illustration WITHOUT any phone, status bar, UI, icons, letters or text. Clean neutral white textured drawing paper (#FBFBFB), extremely faint peach pencil warmth locally in the lower sky, still reading WHITE. Horizon is horizontal at EXACTLY 50% of the illustration height. Sky occupies upper half: three small pale-blue rough colored-pencil clouds (one left about y23%, one right about y34%, one small bottom-left at y43%), and three tiny blue bird marks, sparse. One tiny distant sailboat, white triangular sails and small tan hull, x72%, sails rising above horizon, hull touching horizon. Boat should be very small (about 8% width), exactly like approved board. Lower half is a flat calm sea, light muted blue with irregular visible colored-pencil / wax crayon strokes, short broken blue horizontal ripples and scattered WHITE reflective strokes, gentle white reflection lane near x48%; no yellow/gold glare. Preserve hand-drawn pigment, rough uneven strokes, soft paper grain; no flat vector fills, no glossy realism, no watercolor. Water fills entire lower half from horizon to bottom, with the last 4% fading to white pencil paper at the very bottom. No large wave heads yet, no foam crests, no land, no extra objects. White upper margin, roomy sky, calm healing cute slightly childlike mood. Main purpose: this image stays the same behind continuously moving wave layers; horizon, boat and clouds must remain fixed. Prefer portrait 1024 by 1536 composition.

### Layer atlas generation

Use case: illustration-story. Asset type: ONE transparent game-style layer atlas for the illustrated Ocean app, not a UI mockup and not five state images. Input image 1 is the APPROVED visual guide. Closely match the WAVES inside phone 4 and phone 5: rounded blue wave masses, softly curling heads, rich but low-saturation blues, WHITE scalloped foam curling along crests, irregular blue crayon flow lines and visible colored-pencil grain. Avoid perfect vector edges, spirals, sharp triangle tips, realism, storm imagery or dense spray. Create exactly THREE separate horizontal WATER BANDS arranged in three rows, each band about 3.5 times wider than tall, with generous completely TRANSPARENT spacing between rows and transparent upper silhouettes. Each band must extend fully across the width with a blue water body under its crest contours; irregular gently broken lower pencil edge. Top row = rear band, flatter small rounded waves, light pale blue; middle row = middle band, two rounded rolling crests with distinct widths and foam lengths, muted medium blue; bottom row = foreground band, two to three broad cute curling crests of varied heights with readable white scalloped foam, slightly deeper soft blue. Wave curls are open and soft, not closed spirals. Do not use identical stamped crests. Same colored-pencil / crayon illustration style as the reference board, pencil texture substantial enough to see at mobile size. EXACTLY 3 rows of wave strips, independent transparent silhouettes, no rectangular panel backgrounds, no sky, no boat, no birds, no text, no grid, no phone borders, no numbers. All WHITE foam must be opaque white, not transparent. This is an asset sheet of 3 simultaneous depth layers for smooth live animation, not sequential animation frames.

### Final targeted crest edit

Use case: precise-object-edit. Image 1 is the transparent 3-row water-layer atlas to edit. Image 2 is the approved Ocean board and is the source of truth for crest SHAPE. Keep Image 1's transparent background, EXACTLY three horizontal water bands in their same three rows, all existing pencil/crayon pigment, blues, and width. Change ONLY the large wave heads in rows 2 and 3: round and broaden them, and make the foam-capped crest gently lean and turn to the right with a little overhanging lip like the waves in phone 4 and 5 of Image 2. Make the head shape read as a soft curled breaking wave, not a symmetric mountain/triangle or an upright arched mound. No closed spiral. Keep irregular short white foam scallops and hand-drawn blue flow strokes. Rear row remains small flatter waves. Mid and front heads vary in width and height and must not all have the same shape. Keep the total wave heights restrained; calm and healing, not stormy or aggressive. Preserve overall atlas bounds and row locations. No sky, boat, text, UI, particles, grid or panel backgrounds. Preserve actual alpha; white foam stays opaque white.

