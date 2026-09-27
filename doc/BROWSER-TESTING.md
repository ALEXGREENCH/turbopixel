# Browser verification - 1.8.0

52 checks pass: 13 Node checks (including the actual Angular worker under simulated
network/cache/client boundaries) and 39 ChromeHeadless checks. Update coverage
includes skipping releases after old server files disappear, offline use, cache
cleanup, incomplete release rejection, draft persistence/restoration and failures.
See [UPDATES.md](UPDATES.md) for the lifecycle and real-device limits.

Manual Chromium checks cover the single responsive layout with no FULL/expand
button, a complete frameless preview, Save/palettes and all secondary controls.
On 390x667 Modern, the frame fills the 375px content width (desktop scrollbar)
and Save ends at 586px. On 1280x900, the frame is 718px square, controls beside it.
The production PWA reports its current version through About / Check for updates.

# Browser verification - 1.7.1

43 checks pass (10 Node export, 33 ChromeHeadless). The expanded-view regression
now also checks that the header, source controls, intensity, random effect and
footer remain visible and that the photo's decorative mount is absent.

At 390x667 in Chromium, the header is 60px high, the photo fills the 375px content
width (the desktop scrollbar uses the remaining width), and Save ends at 600px.
Secondary actions remain below and are reachable by scrolling. At 1280x900,
the complete square frame is 796px high, with the editing controls below it.
Save opens its existing dialog from full frame. Native Safari/device camera
acceptance remains outstanding; these measurements use Chromium and the demo.

# Browser verification - 1.7.0

43 automated checks passed: 10 Node export tests and 33 ChromeHeadless checks.
New tests cover expanding the same canvas without losing the photo or settings,
closing via the navigation callback, and letting an open dialog consume Escape.
Existing real-browser History/PopState integration tests cover nested entries.

Manual Chromium checks cover Classic, Modern and Terminal, 320x700 and 390x844
portrait, a short 390x667 viewport, 844x390 landscape and 1280x900 desktop.
No horizontal overflow was observed. On the short portrait viewport, Terminal's
square preview increased from a calculated 215px to a measured 359px per side
(374px in large preview, without the desktop scrollbar). At 1280x900 the frame
measures 710px normally and 840px in large preview. At 844x390, large preview
provides a 330px frame with Save and palette controls beside it.

Palette selection and Save remain available in large preview. Escape closes
Save first and leaves large preview open; a second Escape restores the editor.
The complete watermark remains visible. Native Safari camera capture and device
Back gestures still require real-device acceptance; the workstation checks use
the demo image and Chromium.

# Browser verification � 1.6.0

40 checks: 10 Node export tests and 30 ChromeHeadless checks. New coverage includes
real asynchronous History/PopState events, nested overlays, closing/reopening
while history traversal is pending, expired Forward entries, drag thresholds and
pointer cancellation, validated style persistence, ten style/theme contrast
variants and the matte shader center's immunity to sharp source changes.

Mobile review covers the centered title, all five styles, palette selection,
settings scrolling at 320px, and unchanged photo/watermark bounds. The in-app
browser does not expose its native Back control to automation; a keyboard
shortcut did not navigate there. History claims are therefore supported by the
real ChromeHeadless history integration check and service tests. OS back-swipe
animation and Safari share/PWA installation still need real-device acceptance.

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
