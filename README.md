# TurboPixel — modern browser edition

[Open TurboPixel](https://alexgreench.github.io/turbopixel/) · [Original by turborium](https://github.com/turborium/turbopixel)

A fork of turborium's TurboPixel pixel-art camera, with the original 69 effects,
five interface styles and a rebuilt PNG export flow. Original authorship,
watermark, source history and license notices are retained.

## Changes in 1.7.0

- Portrait preview uses the available width; short screens scroll the controls
  below the photo instead of shrinking the frame to fit them.
- Desktop and landscape layouts use the remaining viewport height, with controls
  beside the image. The complete frame and watermark stay visible.
- Expand preview keeps palette selection and Save available while hiding the
  other controls. Exit with the same button, Back or Escape. The camera, photo
  and effect settings remain in place. Terminal labels this action `FULL`.

## Changes in 1.6.1

Terminal now uses the locally bundled **3270font**, a documented reconstruction
of physical IBM 3270-series terminal lettering, instead of Courier. Text commands,
reverse-video selections, a block slider thumb and character-style switches replace
rounded GUI controls. The light theme is an accessibility adaptation; the dark
presentation uses subdued green on black. Photo colors and export stay unchanged.
Font provenance and license are included in `src/assets/fonts/`.

## Changes in 1.6.0

- Restore the centered **#TurboPixel** title, without an extra brand icon.
- Default to solid Classic orange. Appearance also offers Modern, Monochrome
  (1984), Desktop (1995) and Terminal, each with light/dark options.
- Browser/device Back closes the active sheet or dialog. Done, selection, Escape
  and backdrop dismissal consume the corresponding history entry. Forward does
  not reopen a dismissed dialog with stale photo data.
- On phones the palette sheet meets the bottom safe area. Drag its handle down
  to dismiss; search does not summon the keyboard until tapped.
- Optional Modern glass has a 99.2% matte center and one subdued edge, with no
  secondary highlight ring. Exported images remain unaffected.
- Forty automated checks include real browser history events, drag dismissal,
  ten style/theme contrast variants and rendered shader contrast.

## Changes in 1.5.0

- Regular glass with protected text contrast; refraction stays at the bevel.
- One editing panel and a compact settings group, with larger palette labels.
- A rounded mount around the complete rectangular photo, without covering pixels.
- Short photo crossfades, moving segmented selections, restrained press feedback,
  and sheet transitions. Reduce Motion disables these transitions.
- Sticky palette search and dialog headers keep navigation available when scrolling.
- Rendered shader contrast tests cover black, white, red, green, and blue backgrounds
  in both themes. See [the design audit](doc/DESIGN-AUDIT.md).

## Changes in 1.4.0

- Preserve all image corners and the watermark in the editor and export preview.
- Render photographic glass with a WebGL refraction shader, chromatic dispersion,
  and directional edge highlights. Text remains in the DOM above the effect.
- Fix the palette sheet's actual container styles, dark-mode contrast, and mobile width.
- Add **Install app**: a browser installation prompt when available and manual
  Home Screen instructions for Safari and other browsers.
- Put wallet addresses on their own full-width rows with unchanged copy payloads.

## Liquid Glass design

Photo-first layout with floating translucent controls, photo-derived background
colors, specular edge highlights, capsule groups and concentric rounded corners.
The complete flow uses one visual language: palette search, photo export,
appearance preferences, camera errors and attribution.

Appearance offers Automatic/Light/Dark themes and explicit Reduce Transparency
and Reduce Motion settings. Device accessibility media queries and a solid
fallback for browsers without backdrop filters are also supported. Preferences
stay on the device. See [design mapping and verification](doc/LIQUID-GLASS.md).

This is a browser implementation inspired by Apple's design guidance, not the
native Apple Liquid Glass compositor or a claim of exact optical equivalence.

## Changes in 1.2.0

- PNG download uses an attached anchor and a Blob URL retained long enough for Safari to consume it, even after the export sheet closes.
- Share uses the top-level navigator directly from the user gesture. The PNG File is prepared before the click; the old hidden-iframe workaround is removed.
- Sharing and clipboard buttons use capability detection, not browser-name checks. Cancellation is silent; errors are visible and leave download available.
- System typography, 44px or larger button targets, light/dark appearance, safe-area insets, dynamic viewport sizing, keyboard focus and reduced-motion support.
- Open an image from Files/Photos, or start the camera explicitly. The demo scene is local SVG artwork and requires no camera access.
- Processing stays on the device. The upstream Google Analytics tag has been removed. Version 1.3 replaces the remote icon font with local outline SVG icons.

## Run and verify

Node.js 22 is used in CI. Install dependencies with `npm ci`.

```sh
npm start
npm run test:export
npm run test:ci
npm run build -- --base-href /turbopixel/
```

`test:ci` also runs Angular rendering tests in ChromeHeadless. On Windows, set
`CHROME_BIN` to the installed Chrome executable if it is not found automatically.
See [browser verification](doc/BROWSER-TESTING.md) for test coverage and limits.

## Save on iPhone or iPad

1. Open a photo or use Camera, then choose a palette.
2. Tap **Save photo**.
3. **Download PNG** saves through the browser download manager. **Share / Save to Photos** opens the system share sheet; choose Save Image or Save to Files when offered by the OS.
4. You can also touch and hold the preview. Sharing destinations depend on the browser, operating system and installed apps.

## GitHub Pages

The workflow in `.github/workflows/webpack.yml` tests and builds on pushes to
`main`, then publishes the build using GitHub Pages. Set the repository's Pages
source to **GitHub Actions**. Pull requests run checks without deploying.

## License and attribution

TurboPixel is by Peter (@turborium). The original Apache-2.0 LICENSE and all
per-file MPL notices are preserved. Some source files use MPL-1.1; the original
app component declares MPL-2.0. This fork modifies the application shell and
export code; camera, pixelator and effects retain their original notices.

The original development README is available in the upstream repository and Git
history. This is an independent fork, not an Apple product or an official iOS app.
