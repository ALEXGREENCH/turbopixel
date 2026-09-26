# Liquid Glass adaptation — 1.4.0

This is a web interpretation of Apple's Liquid Glass design language, not the
native Apple rendering API or an exact reproduction of its optical refraction.
The original image processing algorithms and photo-export flow remain intact.

## Applied principles

| Apple guidance | Application |
| --- | --- |
| Separate controls from content | The photo remains crisp and opaque. Floating source, editing, and navigation surfaces use glass. |
| Regular and clear materials | Readable, tinted regular glass for controls; a dimmed clear variant for the small source badge over the image. |
| Adapt to surrounding content | A WebGL shader refracts the photo-derived background at rounded lens edges, with RGB dispersion and directional highlights. The badge over the image samples the photo itself. |
| Avoid glass stacked on glass | Each control group has one material surface. Child controls use simple fills. |
| Capsule controls and concentric curves | Capsule buttons, segmented source selection, rounded slider thumb, and rounded sheets. Image corners stay square to preserve all pixels and the watermark. Main touch controls are at least 44 CSS pixels high. |
| Immediate, restrained feedback | Press scaling, spring-like easing, slider feedback, and pointer-directed highlights. No continuously looping decorative motion. |
| Clear hierarchy | Save photo is the prominent tinted action; secondary commands use quieter shapes and outlined local SVG icons. |
| Sheets maintain context | Export, appearance, information, and palette sheets keep the last photo visible behind a dimmed backdrop; mobile dialogs sit near the bottom. |
| Light and dark adaptation | Automatic device appearance plus explicit Light/Dark choices, including browser theme colors. |
| Accessibility overrides | Device reduced motion, reduced transparency, increased contrast, forced colors, and no-blur fallback. In-app Reduce motion and Reduce transparency switches persist locally. |
| Flexible layout | Desktop side dock, compact portrait layout, landscape rules, dynamic viewport heights, and safe-area padding. |

The palette sheet includes searchable names and color swatches. All 69 original
effects remain available. Photos, preferences, and generated image data stay on
the device; icons and fonts require no external service.

Implementation: `src/styles.scss` (materials and accessibility),
`src/app/app.component.*` (editor), `src/app/appearance.ts` (preferences),
`src/app/icon.component.ts` (icons), and the dialog components.

`src/app/glass-optics.ts` uses one WebGL context and copies the rendered lenses
to decorative canvases beneath the controls. It samples the application's photo
and background scene, not arbitrary DOM content. Sheets keep a denser CSS material
for readability. Refraction is not baked into exported images.

Static photos do not cause continuous shader redraws. Pointer, layout, appearance,
and photo changes invalidate the lenses. Rendering stops while hidden, uses a
pixel ratio capped at 1.5, and respects reduced motion/transparency preferences.
Unavailable or lost WebGL leaves CSS glass usable; restoration rebuilds resources.

## Sources

- [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Get to know the new design system, WWDC25](https://developer.apple.com/videos/play/wwdc2025/356/)
- [Build a UIKit app with the new design, WWDC25](https://developer.apple.com/videos/play/wwdc2025/323/)
- [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)

See [browser verification](BROWSER-TESTING.md) for observed results and the
remaining real-device acceptance checks.
