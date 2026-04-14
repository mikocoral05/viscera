# Viscera Tutorial

This page walks through the most useful ways to use `viscera` in a real project.

If you want the browsable version of this guide, open `docs/index.html`.

## 1. Install the package

```bash
npm install viscera
```

## 2. Extract plain OCR text from an image

Use this when you only need the text and metadata.

```js
const { extractText } = require("viscera");

async function main() {
  const result = await extractText("./sample.png");

  console.log(result.text);
  console.log(result.confidence);
  console.log(result.counts);
}

main().catch(console.error);
```

What you get back:

- `text`: OCR text with cleaned spacing
- `confidence`: average, min, and max confidence
- `counts`: character, word, line, and paragraph counts
- `words`, `lines`, `paragraphs`: structured OCR nodes

## 3. Parse a known document type with a preset

If you already know the document type, pass a preset name.

```js
const { extractText } = require("viscera");

async function main() {
  const result = await extractText("./gcash-receipt.jpg", {
    preset: "mobile_receipt",
    defaultCountry: "PH",
  });

  console.log(result.parsed);
}

main().catch(console.error);
```

Example parsed output:

```js
{
  category: "mobile_receipt",
  platform: "gcash",
  amount: "1,250.00",
  amountValue: 1250,
  currency: "PHP",
  reference: "700123456789",
  phone: "+639171234567",
  receiver: "Maria Cruz",
  sender: null,
  date: 2026-04-14T13:21:00.000Z
}
```

## 4. Let Viscera suggest the best preset

If you are not sure which document type you have, call `parseText()` or `extractText()` without a preset.

```js
const { parseText } = require("viscera");

const result = parseText(`
BDO Online Banking
Transaction Reference: ABC-12345
Sender: John Doe
Receiver: Jane Santos
Amount: PHP 2500.75
`);

console.log(result.preset);
console.log(result.suggestedPresets);
console.log(result.parsed);
```

This is especially helpful when users upload mixed document types.

## 5. Reuse defaults with createExtractor()

If your app keeps using the same settings, create a reusable extractor.

```js
const { createExtractor } = require("viscera");

const extractor = createExtractor({
  preset: "invoice_or_bill",
  defaultCountry: "PH",
});

const invoice = extractor.parseText(`
Invoice No: INV-2201
Vendor: Northwind Studio
Billed To: Acme Corp
Grand Total: USD 199.00
Due Date: April 30, 2026
`);

console.log(invoice.parsed);
```

## 6. Register your own preset

This is where the library gets more useful for product-specific documents.

```js
const { registerPreset, parseText } = require("viscera");

registerPreset("membership_card", {
  description: "Extract a membership id and member name",
  keywords: ["member id", "membership"],
  score(text) {
    return /member id/i.test(text) ? 100 : 0;
  },
  parse(text) {
    const id = text.match(/Member ID:\s*([A-Z0-9-]+)/i)?.[1] || null;
    const name = text.match(/Name:\s*(.+)/i)?.[1] || null;

    return {
      category: "membership_card",
      memberId: id,
      name,
    };
  },
});

const result = parseText(`
Membership Card
Name: Mika Tenshio
Member ID: MEM-2044
`, {
  preset: "membership_card",
});

console.log(result.parsed);
```

## 7. Understand the built-in presets

Use these when you want quick structured output without building your own parser first.

- `mobile_receipt`: GCash, Maya, PayPal, remittance receipts, wallet screenshots
- `bank_receipt`: bank transfers, deposits, beneficiary confirmations
- `bdo`: BDO-specific transfers and online banking screenshots
- `invoice_or_bill`: invoices, statements, utility bills, purchase totals
- `id_card`: passports, IDs, licenses, identity cards
- `generic_text`: fallback summary when nothing else is a strong match

## 8. Use OCR progress logging

Tesseract can take a little time on large images, so progress logs are handy.

```js
const { extractText } = require("viscera");

const result = await extractText("./large-document.png", {
  logger(message) {
    if (message.status === "recognizing text") {
      console.log(`OCR progress: ${Math.round(message.progress * 100)}%`);
    }
  },
});
```

## 9. Tips for better OCR results

- Use clear, high-resolution images when possible.
- Crop away large empty margins before OCR.
- Prefer screenshots or flat scans over angled photos.
- If you know the document type, pass a preset directly.
- If you know the country for phone parsing, pass `defaultCountry`.

## 10. Troubleshooting

### `parsed` is `null`

That usually means no preset was selected. Try one of these:

- Pass `preset: "mobile_receipt"` or another known preset
- Call `suggestPresets(text)` to inspect likely matches
- Register a custom preset for your exact document layout

### OCR text looks messy

Try cleaner input images first. OCR accuracy depends heavily on the source image quality.

### I want the raw Tesseract response too

Enable `includeRaw`:

```js
const result = await extractText("./page.png", {
  includeRaw: true,
});
```

## 11. Development notes for this repo

For the current library state in this repository:

- package version is now `0.2.1`
- `libphonenumber-js` was updated to `^1.12.41`
- `tesseract.js` stays on `^6.0.1` for now
- `tesseract.js@7.0.0` exists, but upgrading cleanly should be handled as a separate compatibility task

## 12. Liability and validation

Viscera follows the normal MIT position: it is provided `as is`, without warranty, and with limitation of liability under the license.

In practice, that means you should still validate extracted OCR data before using it in flows involving payments, identity checks, compliance, or any other high-impact decision.
