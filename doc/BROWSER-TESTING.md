# Browser verification — 1.3.0

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
