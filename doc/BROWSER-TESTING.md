# Browser verification — 1.5.0

## 1.5.0 regression checks

29 checks: 10 Node export tests and 19 browser checks. The new tests measure the
actual shader's secondary-text contrast in light and dark themes on five colored
backgrounds, verify separate, reduced-motion-aware image transitions, and retain
dialog semantics and backdrop with custom motion durations. See
[the design audit](DESIGN-AUDIT.md) for measurements and their limits.

Manual 1.5.0 checks: 320×700 and 390×844 portrait, 844×390 landscape, and
1280×900 desktop; no horizontal overflow. Main actions fit on the tested portrait
screens, while short landscape pages remain scrollable. Palette search/Done stay
visible after scrolling to the last effects. Crossfade returns to zero opacity;
the resulting download decoded as an 880×880 PNG. In-app reduced motion hides the
transition canvas, and reduced transparency removes both shader and backdrop blur.

## 1.4.0 regression checks

The suite now has 26 checks (10 Node export tests and 16 browser tests). Added
coverage compiles and renders the real WebGL shader, checks lens transparency,
context loss/restoration and CSS fallback, verifies the actual dark palette
container, and exercises one-shot installation prompts, cancellation and errors.
Wallet copy verification compares the full original address with the clipboard
payload. Native OS installation remains a device acceptance check.

Manual checks cover square image corners, palette colors and horizontal bounds,
wallet rows, installation instructions, and shader surfaces on mobile layouts.
The shader samples the photo scene; it does not capture arbitrary DOM content.

## Automated regression coverage

`npm run test:export`: 10 tests execute the actual TypeScript export methods with
browser boundaries replaced. They cover PNG bytes/MIME/filename, absent or
throwing sharing APIs, synchronous invocation within the click handler, repeated
sharing after cancellation, duplicate-click prevention, permission failures,
clipboard rejection, attached download anchors, and delayed Blob URL cleanup
independent of closing the preview.

`npm run test:ci` additionally compiles and renders Angular components in
ChromeHeadless: 10 checks cover rendering, saving, appearance preference recovery
and persistence boundaries, and preservation of effect indices after searching.
All 20 checks passed with the 1.3.0 production build. These checks do not simulate
Safari's OS share sheet.

## Manual checks

Chromium: desktop and 390px mobile layouts, effect navigation, export preview,
PNG download and re-opening the PNG. Production build uses a repository-relative
base path and generates the PWA service worker.

Liquid Glass update: verified light/dark themes, persisted accessibility switches,
computed removal of backdrop blur, reduced transition duration, searchable palette
selection with Enter and focus restoration, and 320×700, 390×844 portrait and
844×390 landscape layouts. At 390×844 the main controls fit without page scrolling;
smaller/shorter layouts remain scrollable without horizontal overflow. The updated
export sheet downloaded a PNG with a valid signature that decoded as 640×640.

Real Safari/iOS, iPadOS standalone PWA, and Firefox are not available on this
Windows workstation. The Safari fix removes the iframe and asynchronous-fetch
patterns identified in the old implementation; it still needs device acceptance
on the latest iOS/macOS releases. Do not treat Chromium or mocked API tests as
real Safari validation.

## Device acceptance checklist

- iPhone Safari and installed PWA: take/open a photo, export PNG, find it in Files.
- Share → Save Image and Share → Save to Files; verify decoded image and filename.
- Cancel Share, share again, close/reopen the export sheet, repeat three times.
- Deny clipboard permission: an error appears and Download remains usable.
- Close the sheet immediately after Download; confirm the file still completes.
- Rotate the device and scroll the sheet with a browser toolbar visible.
- Check light/dark appearance, larger text, VoiceOver labels and keyboard focus.
- Firefox: PNG download remains available without Web Share support.
- Chrome/Edge: file download, PNG clipboard and supported system share targets.

## Relevant platform guidance

- [WebKit: User Activation API](https://webkit.org/blog/13862/the-user-activation-api/)
- [Apple: Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [Apple: Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
