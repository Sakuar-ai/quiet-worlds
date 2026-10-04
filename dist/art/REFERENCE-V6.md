# Fireplace reference artwork — v6

Created with the built-in image generation tool, using the user's attached `壁炉余烬冥想界面.png` as visual reference. This is a scene asset, not a screenshot background.

Asset: [fireplace-reference-v6.png](fireplace-reference-v6.png) (1536×1024 RGBA). Transparent outer pixels preserve the app's neutral white paper. No flames, sparks or animated glow are baked into the image. The same asset supplies masonry, rear logs and a precisely aligned foreground-log cutout; live SVG layers supply fire, ember light, wood-edge illumination and sparks. One image is decoded and reused, not an animation frame sequence.

After clarification the user explicitly chose 40–45% of usable scene width. Masonry bounds x=136..1414 are mapped to 42.5%; loose pencil marks extend slightly beyond the masonry. The Rain scene container and controls are unchanged.

## Final generation prompt

Use case: illustration-story.
Asset type: ONE static transparent PNG illustration layer for an interactive ambient app, not a UI mockup.
Input image 1 is the user's visual reference for the exact fireplace shape, hand-drawn medium, colors and texture. Recreate ONLY its fireplace illustration, without its phone screen, words, controls, icons, background paper, or flames.
Subject: the same traditional wide open arched brick/stone fireplace, irregular pale terracotta and brown brick blocks, a thick simple stone hearth plinth in slight perspective, dark charcoal-brown scribbled firebox interior, and three naturally stacked short brown logs entirely INSIDE the low center of the opening. Match the reference's low broad arch, block proportions, visible broken colored-pencil/crayon strokes, imperfect outlines, pale paper flecks inside colored material, and restrained loose pencil shading immediately around the hearth. This is a warm detailed pencil drawing, NOT the previous thin flat vector icon.
Composition: a single front-facing fireplace, centered and fully visible, landscape 3:2 canvas. Masonry occupies about 84% canvas width and 70% height, with modest transparent margins. Small loose terracotta pencil strokes taper to actual transparency at the perimeter. Fireplace top near y=16%, hearth bottom near y=89%. Keep the log pile low, around the lower quarter of the firebox, so there is ample unobstructed dark firebox above it for live flame animation. Two rear logs and one diagonal foreground log, recognizable oval cut ends and broken bark strokes. Logs rest on the firebox floor, never float in front of the hearth.
IMPORTANT animation-layer constraints: NO drawn flame, NO fire tongues, NO sparks, NO glowing embers, NO orange light bloom baked into this static layer. A later live animation will supply all fire, glow, embers, and sparks. The firebox remains dark charcoal-brown above and between the logs. The wood should have muted ochre edge strokes but no luminous burning sections.
Background: genuinely transparent alpha outside the illustration, not beige/cream paper, not a checkerboard painted into the art. The final app puts this over neutral #FBFBFB paper. Pale flecks may show through the pencil texture.
Do not add any room, walls beyond the fireplace, chimney pipe, furniture, cat, plants, books, rug, tools, decorations, Christmas items or other objects. No text, no logo, no watermark, no frame. No polished SVG look, glossy gradients, watercolor, photorealism or 3D. Preserve the reference's crayon/colored-pencil character and exact traditional fireplace concept.
