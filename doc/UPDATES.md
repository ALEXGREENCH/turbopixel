# Updates and cache lifetime

TurboPixel 1.8.0 keeps Angular's verified, versioned resource cache. JS/CSS/font
URLs contain content hashes. Every build starts with a clean output directory;
GitHub Pages publishes only that output, not an archive of previous releases.
The repository keeps source history, not generated version directories.

## Installed applications

The manifest id, scope, start URL and `ngsw-worker.js` URL remain stable. A build
marker changes the worker bytes for each release, so browser update checks also
notice releases in existing installations. `version.json` and manifest appData
identify the current version/build. Installation does not depend on an old build
remaining available on GitHub: the latest manifest lists the latest resources,
and the worker can download them directly while retaining a cached old session.
A legacy installation without the new update UI may need its next opening after
an online worker check to enter the new release. Already running legacy code
cannot be retroactively given a banner without reloading it.

Registration is immediate (camera timers otherwise delay Angular stability).
Checks run at startup, when returning online/visible, and every five minutes
while visible, with a 30-second throttle. About offers a manual check. A complete
new release produces an Update action; editing is never interrupted by an
automatic reload. Freshness navigation prefers the network with offline fallback.
Applying an update adds the target release to the navigation URL so GitHub Pages'
HTTP cache cannot reuse the old unversioned HTML response.

## Draft and recovery

Before Update reloads the page, one temporary IndexedDB record stores the source
image as PNG, palette index and intensity. A camera session stores the current
unprocessed video frame and restores it as a photo; Camera can be started again.
Editing is disabled during this short save. The record is overwritten, not
appended, and removed after successful restoration. Appearance settings remain
in their existing preference storage. If saving fails, reload is cancelled.

An unrecoverable worker state (for example an evicted bundle that is now a 404 on
the server) offers a network refresh. The fresh stable entry URL bypasses the
worker for navigation. An inline Retry fallback also works when the main bundle
cannot load, without relying on a missing hashed script. Internet access is
required to obtain a new release; offline use retains the last complete cache.

## Retention

Angular retains the latest complete release and any version assigned to a live
client. Its cleanup removes unused version caches during worker initialization /
idle processing after obsolete clients disappear. An old tab can therefore keep
its version until closed; deleting its files immediately would break that tab.
This is bounded by active sessions, not a permanent archive of every release.
Cleanup is scoped to `/turbopixel/`; GreenPixel caches, drafts and preferences are
not cleared. The browser manages ordinary HTTP cache eviction separately.

## Verification

51 checks: 13 Node and 38 ChromeHeadless. Worker tests execute the installed
Angular worker code with simulated network/cache/client boundaries. They remove
A's files, skip B, install C, verify offline startup, keep A's live tab working,
then verify A's cache is deleted when the tab closes. They also cover incomplete
releases and unrelated caches. This is a lifecycle regression harness, not an OS
Home Screen installation test. Browser tests use real IndexedDB and PNG pixels
to verify draft replacement, restoration and deletion, plus update failure paths.
The production build's manual update check was exercised in Chromium with its
real service worker. Real iOS standalone acceptance still requires a device.

References: [Angular worker communication](https://angular.dev/ecosystem/service-workers/communications),
[cache lifecycle](https://angular.dev/ecosystem/service-workers/devops).
