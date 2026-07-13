# Changelog

## Unreleased

## v1.3.0 - 2026-07-13

- Added local EPUB 2 and EPUB 3 import with transactional replacement and archive safety checks.
- Added chapter detection, popup chapter selection, and immediate chapter jumps.
- Added `[图片N]` / `[N images]` markers at EPUB illustration positions, including covers and front matter images.
- Added an optional numeric illustration button that reflects the current rendered text range.
- Added a movable edge-snapping illustration button and a resizable multi-image viewer that preserves image proportions.
- Added archive metadata preflight before extraction and retained post-extraction size checks.
- Deduplicated repeated image resources while preserving every reading-position anchor.
- Improved encrypted-content and spine-level fixed-layout detection.
- Queued failed local image cleanup for retry on the next EPUB import.
- Kept EPUB text, metadata, progress, and illustrations entirely in local browser storage.
- Added explicit errors for damaged, oversized, fixed-layout-only, and DRM-protected EPUB files.

## v1.2.0 - 2026-07-10

- Expanded embedded display lines from 1–3 to 1–10.
- Reduced the minimum display width from 40 px to 1 px.
- Removed the fixed 120 px minimum from automatic width fitting.
- Prevented unreadable characters from being consumed when the configured width is too small.
- Added a localized popup-only warning, available after insertion, for widths that cannot display complete text.
- Updated embedded status to report the final rendered width.

## v1.1.0 - 2026-07-10

- Added an instant Chinese/English interface switch with saved preference.
- Updated the default display width to 500 px and vertical text position to -0.43 em.
- Replaced technical slot terminology with clearer display-width labels and statuses.
- Added a custom Intext Reader icon set for Chrome toolbar and extension pages.
- Kept embedded reading and embedding method names unchanged in Chinese.
- Fixed quick hide on pages where `BODY` looks scrollable but `HTML` is the actual page scroller.
- Added scroll-movement detection with page fallback before the final direct-removal safety action.
- Replaced the native TXT picker display with fully localized Chinese/English controls.
- Added the current extension version and a bilingual personal-use disclaimer to the popup footer.

## v1.0.0 - 2026-07-09

- Initial public release.
- Added plain insertion and embedded reading modes.
- Added fixed-width and auto-fit embedded slots.
- Added custom shortcuts and duplicate shortcut detection.
- Added quick hide with nearest scrollable container support.
- Added local-only text import and storage.
