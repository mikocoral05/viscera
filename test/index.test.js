const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  createExtractor,
  extractText,
  getPreset,
  hasPreset,
  listPresets,
  parseText,
  registerPreset,
  suggestPresets,
  unregisterPreset,
} = require("../index");

let failures = 0;

async function run(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error.stack || error.message);
  }
}

const repoRoot = path.resolve(__dirname, "..");
const fixtureDir = path.join(repoRoot, "docs", "assets", "fixtures");
const offlineOcrOptions = {
  langPath: repoRoot,
  gzip: false,
  cacheMethod: "none",
};

(async () => {
  await run("lists built-in presets including BDO", async () => {
    const presetNames = listPresets().map((preset) => preset.name);

    assert.ok(presetNames.includes("mobile_receipt"));
    assert.ok(presetNames.includes("bank_receipt"));
    assert.ok(presetNames.includes("bdo"));
    assert.ok(presetNames.includes("generic_text"));
  });

  await run("suggestPresets ranks invoice text correctly", async () => {
    const suggestions = suggestPresets(`
      Invoice No: INV-102
      Vendor: Northwind Studio
      Billed To: Acme Corp
      Grand Total: USD 120.00
      Due Date: April 30, 2026
    `);

    assert.equal(suggestions[0].name, "invoice_or_bill");
  });

  await run("parseText extracts bank receipt details", async () => {
    const result = parseText(
      `
        BDO Online Banking
        Transaction Reference: ABC-12345
        Sender: John Doe
        Receiver: Jane Santos
        Account Number: 1234-5678-90
        Amount: PHP 2,500.75
        Transaction Date: April 14, 2026 09:30 AM
        Remarks: Monthly rent
      `,
      { preset: "bank_receipt" }
    );

    assert.equal(result.preset, "bank_receipt");
    assert.equal(result.parsed.bank, "BDO");
    assert.equal(result.parsed.transactionReference, "ABC-12345");
    assert.equal(result.parsed.amount, 2500.75);
    assert.equal(result.parsed.currency, "PHP");
    assert.equal(result.parsed.receiver, "Jane Santos");
    assert.ok(result.parsed.date instanceof Date);
  });

  await run("parseText can auto-detect a mobile receipt", async () => {
    const result = parseText(`
      GCash
      You have sent PHP 1,250.00
      Sent to Maria Cruz
      Reference No: 700123456789
      Date: April 14, 2026 9:21 PM
      09171234567
    `);

    assert.equal(result.preset, "mobile_receipt");
    assert.equal(result.parsed.platform, "gcash");
    assert.equal(result.parsed.amountValue, 1250);
    assert.equal(result.parsed.receiver, "Maria Cruz");
  });

  await run("custom preset registration works with createExtractor", async () => {
    registerPreset("tracking_label", {
      description: "Detect a tracking number",
      keywords: ["tracking number"],
      parse(text) {
        const match = text.match(/Tracking Number:\s*([A-Z0-9-]+)/i);
        return {
          category: "tracking_label",
          trackingNumber: match ? match[1] : null,
        };
      },
      score(text) {
        return /tracking number/i.test(text) ? 100 : 0;
      },
    });

    try {
      assert.ok(hasPreset("tracking_label"));
      assert.equal(getPreset("tracking_label").name, "tracking_label");

      const extractor = createExtractor({ preset: "tracking_label" });
      const result = extractor.parseText("Tracking Number: ZX-42");

      assert.equal(result.parsed.trackingNumber, "ZX-42");
    } finally {
      unregisterPreset("tracking_label");
    }

    assert.equal(hasPreset("tracking_label"), false);
  });

  await run("fixture images exist for docs and OCR coverage", async () => {
    const files = ["mobile-receipt.png", "invoice.png", "bank-receipt.png"];
    for (const file of files) {
      assert.ok(fs.existsSync(path.join(fixtureDir, file)), `Missing fixture: ${file}`);
    }
  });

  await run("extractText can OCR the mobile receipt fixture offline", async () => {
    const result = await extractText(path.join(fixtureDir, "mobile-receipt.png"), {
      preset: "mobile_receipt",
      ...offlineOcrOptions,
    });

    assert.equal(result.preset, "mobile_receipt");
    assert.match(result.text, /Reference No:\s*700123456789/i);
    assert.equal(result.parsed.reference, "700123456789");
    assert.equal(result.parsed.receiver, "Maria Cruz");
    assert.equal(result.parsed.amountValue, 1250);
    assert.equal(result.parsed.currency, "PHP");
  });

  await run("extractText can OCR the invoice fixture offline", async () => {
    const result = await extractText(path.join(fixtureDir, "invoice.png"), {
      preset: "invoice_or_bill",
      ...offlineOcrOptions,
    });

    assert.equal(result.preset, "invoice_or_bill");
    assert.match(result.text, /Invoice No:\s*INV-2201/i);
    assert.equal(result.parsed.invoiceNumber, "INV-2201");
    assert.equal(result.parsed.vendor, "Northwind Studio");
    assert.equal(result.parsed.client, "Acme Corp");
    assert.equal(result.parsed.totalAmount, 199);
    assert.equal(result.parsed.currency, "USD");
  });

  await run("extractText can OCR the bank receipt fixture offline", async () => {
    const result = await extractText(path.join(fixtureDir, "bank-receipt.png"), {
      preset: "bank_receipt",
      ...offlineOcrOptions,
    });

    assert.equal(result.preset, "bank_receipt");
    assert.match(result.text, /Transaction Reference:\s*ABC-12345/i);
    assert.equal(result.parsed.bank, "BDO");
    assert.equal(result.parsed.transactionReference, "ABC-12345");
    assert.equal(result.parsed.sender, "John Doe");
    assert.equal(result.parsed.receiver, "Jane Santos");
    assert.equal(result.parsed.amount, 2500.75);
  });

  if (failures > 0) {
    process.exit(1);
  }
})();
