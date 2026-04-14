# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] - 2026-04-14

### Changed
- Corrected the Buy Me a Coffee funding link to `https://buymeacoffee.com/mikaeltenshio`.
- Updated docs and package metadata to reflect the patch release version.

## [0.2.0] - 2026-04-14

### Added
- Expanded the public API with `parseText()`, `createExtractor()`, preset registry helpers, and preset suggestion helpers.
- Added richer OCR responses including normalized text, counts, confidence summaries, timing metadata, and optional raw OCR payloads.
- Added a new `bdo` preset plus shared parser utilities in `presets/helpers.js`.
- Added a browsable static docs site in `docs/index.html` with fixture previews and copyable code snippets.
- Added OCR fixture images in `docs/assets/fixtures/` and offline end-to-end OCR coverage in `test/index.test.js`.
- Added `scripts/generate-fixtures.ps1` so the sample image set can be regenerated locally.
- Added publish metadata, funding links, and a dry-run packaging script.

### Changed
- Improved the built-in receipt, bank, invoice, ID, and generic text parsers for more reliable structured output.
- Updated `libphonenumber-js` from `^1.12.10` to `^1.12.41`.
- Kept `tesseract.js` on `^6.0.1` while leaving the `7.x` migration as a separate compatibility step.
- Reworked the CLI example and documentation to better show real-world usage.

## [0.1.0] - 2026-04-14

### Added
- Initial OCR wrapper around `tesseract.js` with basic preset parsing support.
