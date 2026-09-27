# Full-frame revision - 1.7.1

Full frame now uses ordinary document scrolling, retaining the header and footer.
The decorative image mount and shadow are removed. Portrait frames fill the
available content width; wider screens limit the frame to viewport height minus
the compact header and 44px status/exit row. Frame fitting preserves its aspect
ratio and watermark. Controls below the image no longer reduce that area.

Palette and Save lead the controls in both visual and keyboard order. Intensity,
photo/camera selection, random choice and camera switching follow, with no
functional controls hidden. Entry scrolls to the header after layout; exit
restores the prior scroll position. Pending scroll work is cancelled on teardown.

# Preview layout - 1.7.0

The old mobile height calculation reserved 476 CSS pixels for the interface
(452 in Terminal), leaving a small camera frame on short screens. Portrait
layout now derives preview height from available width and effect aspect ratio.
Controls remain below the photo and can scroll on short screens. Desktop and
landscape layouts allocate the remaining viewport height to the preview, with
controls alongside it.

Large preview keeps the existing canvas and camera stream. It reduces the
interface to palette selection, Save and an exit button; Back and Escape also
exit. Dialogs keep their own navigation entry above the preview. This mode uses
normal page layout rather than depending on the browser Fullscreen API. No
controls cover the image or its watermark. All settings return on exit.

# Terminal revision — 1.6.1

The previous green Courier treatment was replaced with a specific IBM 3270
reference. The bundled font is 3270font v3.0.1, whose author documents a lineage
through x3270 and Georgia Tech's 3270tool to characters copied from a physical
terminal. This is a modern outline reconstruction, not a ROM font. The bundled
license permits distribution, and conversion to WOFF2 preserves glyphs/metrics.

The terminal styling uses plain text commands, fixed-width lettering, understated
single-color rules and inverse selections. No GUI bevels, round thumb, shadows,
blur, simulated boot output, scanlines or decorative flicker. Palette swatches
and the photograph retain their actual colors because they communicate image
content. Touch targets, accessibility labels, native inputs and all functionality
remain; the light palette is explicitly a readability adaptation.

Reference: [3270font provenance](https://github.com/rbanffy/3270font) and
[IBM's description of character-cell terminals](https://www.ibm.com/docs/en/zos-basic-skills?topic=enhanced-introduction-3270-terminal).

Verification: font loading test rejects silent system-font fallback; all existing
contrast, export, installation and navigation tests remain in the suite. Font
assets are bundled and covered by the PWA asset cache. Phone settings use a wider
first theme column so “Automatic” fits without horizontal scrolling.

# Interface audit — 1.6.0

The title is now centered between two equal 44px utility targets. The original
hashtag identity replaces the extra pixel-grid mark. Classic orange is the
first-run interface; existing theme and accessibility preferences are preserved.
Modern, 1984 monochrome, 1995 desktop and terminal styles are separately selectable
from photo palettes. Styles never alter image processing or export content.

Classic/retro surfaces are solid. Modern defaults to solid too; users can disable
Reduce transparency for the optical material. Based on the reported double rims
and visible photo artifacts, its tint is now 99.2% in the center. Refraction is
limited to a 10px edge, with smaller displacement/dispersion, weaker highlights,
no inner highlight ring and no overlapping CSS rim. Canvas bounds include the
host border, avoiding the previous 2px difference in drawn lens dimensions.

The same rendered-pixel contrast test now measures **6.98:1 light** and
**9.43:1 dark**. Switching the source between black and white changes the central
RGB channels by at most two 8-bit levels. Tests also cover primary, secondary,
accent and button text in all five styles and both color themes (minimum 4.5:1).
Desktop-style utility/status text uses white on its teal page background.

Palette sheets meet the phone bottom safe area and keep search/header sticky.
Only the handle captures a downward drag; native scrolling and OS edge gestures
remain available elsewhere. Dialogs and sheets share transient browser-history
entries, so Back dismisses the top overlay. Ordinary dismissal consumes the same
entry asynchronously; queued openings wait for that traversal. Forward skips
expired overlays rather than restoring stale export data. Tests exercise real
popstate delivery in a browser as well as nested/rapid dismissal cases.

The Apple materials/motion references and real-device limitations below remain
applicable. These styles are web interpretations, not native Apple rendering.

# Interface audit â€” 1.5.0

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
220 ms image crossfade, 280 ms sheet entrance, 180 ms dismissal, 280â€“300 ms
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
