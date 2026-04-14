# viscera

[![npm version](https://img.shields.io/npm/v/viscera?color=1f6852&label=npm)](https://www.npmjs.com/package/viscera)
[![docs](https://img.shields.io/badge/docs-live-8a3d24)](https://mikocoral05.github.io/viscera/)
[![license](https://img.shields.io/npm/l/viscera?color=6f564a)](./LICENSE)

![Viscera README banner](https://raw.githubusercontent.com/mikocoral05/viscera/main/docs/assets/viscera-readme-banner.png)

Viscera is a helpful OCR toolkit on top of `tesseract.js` that gives you raw text, confidence metadata, built-in document presets, and a small parser system for turning OCR output into structured JSON.

## Why use it?

- OCR text extraction with confidence, words, lines, and paragraph metadata
- Built-in presets for receipts, bank transfers, IDs, invoices, and generic text
- Auto-suggest or auto-detect the best preset for a block of OCR text
- Register your own custom presets when your project has a specific document format
- Keep a reusable extractor with shared defaults through `createExtractor()`

## Install

```bash
npm install viscera
```

## Docs

- Browsable docs page: `docs/index.html`
- Markdown tutorial: `docs/tutorial.md`
- Release notes: `CHANGELOG.md`
- Release checklist: `PUBLISHING.md`
- README banner source: `docs/assets/viscera-readme-banner.png`

## Quick Start

```js
const { extractText } = require("viscera");

async function run() {
  const result = await extractText("./receipt.png", {
    preset: "mobile_receipt",
    logger: (message) => {
      if (message.status === "recognizing text") {
        console.log(`OCR: ${Math.round(message.progress * 100)}%`);
      }
    },
  });

  console.log(result.text);
  console.log(result.parsed);
}

run().catch(console.error);
```

## Start In 60 Seconds

If you want a tiny repo layout to try the package immediately, this is enough:

```text
viscera-demo/
  app.js
  package.json
```

```json
{
  "name": "viscera-demo",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "start": "node app.js"
  }
}
```

```bash
npm install viscera
npm start
```

```js
const { extractText } = require("viscera");

async function main() {
  const result = await extractText("./receipt.png", {
    preset: "mobile_receipt",
  });

  console.log(result.parsed);
}

main().catch(console.error);
```

## Built-In Presets

| Preset | Best for |
| --- | --- |
| `mobile_receipt` | Wallet receipts, remittance screenshots, digital transfer confirmations |
| `bank_receipt` | Bank transfers, deposit slips, online banking confirmations |
| `bdo` | BDO-specific receipts and Banco de Oro transaction screenshots |
| `invoice_or_bill` | Invoices, utility bills, statements, purchase receipts |
| `id_card` | IDs, passports, licenses, government cards |
| `generic_text` | Fallback parser for plain OCR text |

## Common Usage

### 1. OCR only

```js
const { extractText } = require("viscera");

const result = await extractText("./document.jpg");
console.log(result.text);
console.log(result.confidence);
```

### 2. Parse text you already have

```js
const { parseText } = require("viscera");

const result = parseText(`
GCash
You have sent PHP 420.00
Sent to Maria Cruz
Reference No: 1234567890
`);

console.log(result.preset);
console.log(result.parsed);
```

### 3. Reuse defaults

```js
const { createExtractor } = require("viscera");

const extractor = createExtractor({
  preset: "invoice_or_bill",
  defaultCountry: "PH",
});

const parsedInvoice = extractor.parseText(`
Invoice No: INV-22
Grand Total: USD 99.00
Due Date: April 30, 2026
`);
```

### 4. Add your own preset

```js
const { registerPreset, parseText } = require("viscera");

registerPreset("tracking_label", {
  description: "Parse a courier tracking label",
  keywords: ["tracking number", "ship to"],
  score(text) {
    return /tracking number/i.test(text) ? 100 : 0;
  },
  parse(text) {
    const match = text.match(/Tracking Number:\s*([A-Z0-9-]+)/i);
    return {
      category: "tracking_label",
      trackingNumber: match ? match[1] : null,
    };
  },
});

console.log(parseText("Tracking Number: ZX-42", { preset: "tracking_label" }));
```

### 5. Run offline OCR against a local language file

This repository includes `eng.traineddata`, so the fixture tests can run without downloading language data during OCR.

```js
const { extractText } = require("viscera");

const result = await extractText("./docs/assets/fixtures/mobile-receipt.png", {
  preset: "mobile_receipt",
  langPath: process.cwd(),
  gzip: false,
  cacheMethod: "none",
});
```

## Result Shape

`extractText()` returns a richer response than raw OCR alone:

```js
{
  text,
  normalizedText,
  confidenceAvg,
  confidence: { average, min, max },
  counts: { characters, words, lines, paragraphs },
  words,
  lines,
  paragraphs,
  preset,
  presetSource,
  suggestedPresets,
  parsed,
  meta: { language, extractedAt, durationMs }
}
```

## Tutorial

A longer usage walkthrough lives in `docs/tutorial.md`, and the browsable static version lives in `docs/index.html`.

## Local Example

Run the example file with an image path and optional preset name:

```bash
node example.js ./receipt.png mobile_receipt
```

## Screenshot

The README hero image is generated from repo assets instead of being a random one-off image.

- Generator script: `scripts/generate-readme-banner.ps1`
- Fixture source images: `docs/assets/fixtures/`

## Validation

```bash
npm test
npm run pack:preview
```

## Notes

- Node `18+` is recommended.
- `libphonenumber-js` was updated to the latest compatible `1.x` release.
- `tesseract.js` is still on `6.x` here on purpose because `7.x` is a new major version and should get a dedicated compatibility pass before upgrading the library.
- The fixture images used by the docs are also used in the end-to-end OCR test coverage.

## Liability

Viscera is distributed under the MIT License and is provided `as is`, without warranty of any kind, express or implied.

That means:

- you should validate OCR results before using them in money, identity, compliance, or other high-impact workflows
- the package should not be described as guaranteed safe, error-free, or fit for every purpose
- production users should keep their own checks, review steps, and fallback handling around extracted data
