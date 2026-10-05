# Rain field recordings

“Rain, Moderate, A.wav” and “Rain, Moderate, C.wav” by InspectorJ
(https://www.jshaw.co.uk/) of Freesound.org.

- `rain-witley.mp3`: https://freesound.org/people/InspectorJ/sounds/401277/
- `rain-callahan.mp3`: https://freesound.org/people/InspectorJ/sounds/401275/
- License: Creative Commons Attribution 4.0, https://creativecommons.org/licenses/by/4.0/
- Public HQ MP3 versions downloaded on 2026-10-03; files are unmodified.
- Playback modifications: 36-second excerpts, loop crossfade, level matching,
  soft peak limiting and gentle high/low-pass filtering. No synthesized rain.
- Attribution and license links are also available in the app’s settings.

## Fireplace — fireplace-14, approved visionear regions

- Same user-approved visionear CC0 source linked below, retaining prior local peak handling. No new EQ, normalization, compression, synthetic fire or extracted events.
- `fireplace-visionear-low-v2.flac`: source 460–500 s, 40 s; user-specified 7:40 low-fire reference. The user accepted this bounded revision and authorized publication on 2026-10-06. No EQ or noise reduction added.
- `fireplace-visionear-medium-v1.flac`: source 40–120 s, 80 s. The user identified original ~60 s as their comfortable medium-fire reference, so default playback cues at source 60 s.
- Independent region loops have a four-second baked tail/head edit and jump to buffer 4 s; periods are 36 / 76 s. The original timeline cannot move playback into another intensity class.
- One active region at rest; only the adjacent pair overlaps during a four-second equal-power change. Rapid reversal reuses that pair. No constant layering. Playback uses unity gain; no separate louder/fake high-fire state is claimed.
- The user approved the low-fire revision and authorized release; the manifest gate is APPROVED. Future changed recordings or regions require fresh listening approval.
- Reproduce with `scripts/prepare-fire-regions.py`; full source coordinates and hashes are in `fireplace-visionear-regions-v2.json`. Medium asset is byte-identical to v1.

## Fireplace — previous approved-sounding visionear long-bed prototype, now inactive

- “Aachen_Burning Fireplace Crackling Fire Sounds.wav” by visionear: https://freesound.org/people/visionear/sounds/501417/
- CC0: https://creativecommons.org/publicdomain/zero/1.0/ (verified 2026-10-05).
- User-supplied 714-second, stereo 48 kHz / 24-bit WAV. Original remains untouched.
- Select source 20–516 seconds (8:16). Omit the user-identified initial scraping and its tail.
- Eleven individually documented outlier peaks receive short raised-cosine clip-gain edits. No compressor, EQ, denoise, normalization, global boost, short-event extraction or scheduling.
- Delivery is lossless stereo 48 kHz / 24-bit FLAC. A six-second tail/head edit is pre-baked into one buffer; one source loops to buffer 6 seconds, a period of 8:10. Playback has a 350 ms fade-in and unity reference gain at 50%, bypassing the other scenes' compressor. All intensities share the reference gain for this audition pass.
- Historical prototype: source scanning marked signal anomalies, not verified audible tool noises. It was later superseded by the user-approved independent regions above; this intermediate long asset is not deployed.
- Reproduce using `scripts/prepare-visionear.py`; provenance and every local edit are in `fireplace-visionear-v1.json`.

## Fireplace — previous audio-14 audition draft, now inactive

`fireplace-kingsrow-v2.flac` derives only from the same approved kingsrow CC0 upload linked below. No whole-file boost (0 dB delivery gain); gentle 150 Hz high-pass plus the same localized peak/tail handling. Playback applies a fixed broad −5 dB peaking EQ at 280 Hz (Q 0.65) only to the very quiet continuous bed, with a fixed 12 kHz safety high-cut. Event samples keep their upper crackle spectrum and bypass the bed EQ. The 12 excerpts are now 0.13–0.18 seconds to avoid carrying long background tails. No spectral denoising, RMS normalization, or stacked continuous loops. The spectral report and three listening samples require user listening approval before publication.

## Fireplace — published audio v13, approved kingsrow recording

`fireplace-kingsrow-v1.flac`: “Fire Crackling 01.wav” by kingsrow, Freesound.

- Source: https://freesound.org/people/kingsrow/sounds/181563/
- License: CC0, https://creativecommons.org/publicdomain/zero/1.0/ (verified on the source page 2026-10-04).
- User-supplied original: `181563__kingsrow__fire-crackling-01.wav`, 34.210839 seconds, stereo 44.1 kHz 16-bit PCM. The supplied original is not altered.
- Delivery: lossless FLAC, same sample rate, channel count and 16-bit depth. No lossy codec, synthetic noise, added recording or spectral denoising.
- Preparation: gentle 100 Hz high-pass; local 320 Hz high-pass and −4.44 dB clip gain around the low-frequency tail (smooth 28.55–33.05 s window); local reduction of the exceptional 5.81 s transient and short transparent clip-gain envelopes over remaining isolated high peaks. A single fixed +8 dB delivery gain is applied to the whole recording. No per-excerpt normalization or continuous compression.
- Playback: ONE 31.810839-second continuous bed. A 2.4-second raised-cosine seam is baked into its buffer before playback; it never requires two looping sources. Twelve short 0.24–0.29 s events are extracted from the same decoded recording with boundary fades, without individual normalization. Event selection avoids recent repeats; random waits, slight gain differences, a hard quiet gap and a one-event-at-a-time policy prevent rhythmic/phasey stacking. No medium pops below 65% intensity.
- Detailed source hash, timeline positions, gain edits and measured before/after levels: `fireplace-kingsrow-v1.json`. Reproduce with `scripts/prepare-fire-audio.py` and the original upload.
- Previous recordings below are retained only as inactive historical assets; the Fireplace no longer requests or plays them.

## Previous Fireplace — v3, inactive

`fireplace-wood-v3.wav`: “Fireplace Sound loop” by PagDev, OpenGameArt.

- Source: https://opengameart.org/content/fireplace-sound-loop
- Original: https://opengameart.org/sites/default/files/fire.wav
- License: CC0, https://creativecommons.org/publicdomain/zero/1.0/
- Downloaded 2026-10-03. Source is a 29.2635-second stereo 44.1 kHz 32-bit PCM WAV, converted to 16-bit PCM WAV at the same sample rate and channel count for delivery. No lossy codec used.
- Three excerpts from the same source (1s/3s/5s offsets, 24s/23s/22s loop lengths). Seam crossfades, level matching, gentle 180 Hz high-pass conditioning, soft peak ceiling, and per-layer frequency filtering are applied during playback.
- No additional wildlife, music or synthetic fire layers. This is a replacement source, not an extraction from the user's YouTube reference.

## Previous Fireplace recording — retained, inactive

`fireplace-steady.mp3`: “Fireplace #4” by Joseph SARDIN, BigSoundBank.

- Source: https://bigsoundbank.com/feu-de-cheminee-4-s2856.html
- File: https://bigsoundbank.com/UPLOAD/mp3/2856.mp3
- License: CC0 (public domain), as declared on the source page; https://creativecommons.org/publicdomain/zero/1.0/
- Downloaded 2026-10-03. Original MP3 is distributed unchanged.
- Playback uses three different excerpts (6s / 22s / 38s offsets; 29s / 31s / 37s lengths), seam crossfades, two 180 Hz high-pass stages to attenuate low knocks, level matching and a gentle 0.24 soft peak ceiling. These are three layers derived from one real fireplace recording, not three separately recorded fire strengths.
- Layer A: soft ember body (220–1800 Hz). Layer B: gentle crackle (500–5400 Hz). Layer C: fuller fire (220–6200 Hz).
- Intensity controls their normalized blend; it does not alter master volume. No generated fire audio or unlicensed placeholders.
