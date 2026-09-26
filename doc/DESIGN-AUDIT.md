# Interface audit — 1.5.0

## Problems found in 1.4

The photographic texture remained visible across the entire editing panel. Large
bright bevels competed with the labels. Separate glass islands gave the brand,
source selection, settings, and editor similar prominence. Palette names were
small on phones, and scrolling could move sheet navigation out of reach.

## Decisions

Use the regular material described in [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
for text-bearing controls. The shader's center now has a stable luminance field;
the photographic refraction is confined to the outer bevel. Highlights are
narrower and weaker. CSS fallback has the same dense material. The image itself
is not glass and remains rectangular, inside a separate rounded mount.

Group the photo source, palette, intensity, random choice, camera switch and save
action in one dock. Keep branding plain and group the two app utilities. The
source indicator and palette count sit outside the image. Author links, source
code, installation, wallets, all 69 effects and all export methods remain.

Use one short motion vocabulary, following [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion):
220 ms image crossfade, 280 ms sheet entrance, 180 ms dismissal, 280–300 ms
segmented selection movement, and brief press feedback. Highlights settle after
pointer movement; nothing decoratively loops while idle. The image transition is
a separate canvas and never changes exported PNG pixels. Device and in-app Reduce
Motion disable the visual transitions.

## Contrast evidence and limits

ChromeHeadless tests read the rendered shader pixels, excluding the outer 16 CSS
pixels where no labels are placed. They compare those pixels with the actual
secondary-text theme color against five source images: black, white, red, green,
and blue. The minimum measured ratios were **6.33:1 light** and **8.95:1 dark**,
against a 4.5:1 test threshold. Primary text has stronger contrast. This is a
bounded rendering check, not a certification of every UI state or device.

The save button uses a darker blue gradient for white-label contrast. Reduced
transparency, increased contrast, forced colors and unavailable WebGL retain
usable surfaces. Focus indicators remain visible, and main touch controls are
at least 44 CSS pixels high.

Native Apple compositing is not available to this Angular web app. These are
custom web materials, not an assertion of pixel equivalence with iOS. Real-device
Safari/PWA acceptance still needs an iPhone or iPad.
