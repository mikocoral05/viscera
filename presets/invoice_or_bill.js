const {
  cleanValue,
  matchFirst,
  parseCurrencyAmount,
  toDateOrNull,
} = require("./helpers");

const keywords = [
  "invoice",
  "bill",
  "amount due",
  "grand total",
  "due date",
  "billed to",
  "vendor",
];

const description =
  "Parse invoices, billing statements, utility bills, and purchase receipts with amount and due date details.";

function parse(text) {
  const totalInfo = parseCurrencyAmount(text, {
    linePatterns: [/total amount|amount due|grand total|balance due|total/i],
  });
  const subtotalInfo = parseCurrencyAmount(text, {
    linePatterns: [/subtotal/i],
    fallbackToText: false,
  });
  const taxInfo = parseCurrencyAmount(text, {
    linePatterns: [/tax|vat/i],
    fallbackToText: false,
  });

  const invoiceNumber = matchFirst(text, [
    /^(?:Invoice|Bill)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([\w\-]+)/im,
  ]);
  const dueDateRaw = matchFirst(text, [/(?:Due\s*Date|Pay\s*By)\s*[:\-]?\s*([^\n]+)/i]);
  const billDateRaw = matchFirst(text, [
    /(?:Date\s*Issued|Bill\s*Date|Invoice\s*Date)\s*[:\-]?\s*([^\n]+)/i,
  ]);
  const vendor = matchFirst(text, [/(?:From|Vendor|Supplier)\s*[:\-]?\s*([^\n]+)/i]);
  const client = matchFirst(text, [
    /(?:To|Client|Customer|Billed\s*To)\s*[:\-]?\s*([^\n]+)/i,
  ]);
  const purchaseOrder = matchFirst(text, [
    /(?:PO|Purchase Order)\s*(?:No\.|Number|#)?\s*[:\-]?\s*([\w\-]+)/i,
  ]);

  return {
    category: "invoice_or_bill",
    invoiceNo: cleanValue(invoiceNumber),
    invoiceNumber: cleanValue(invoiceNumber),
    purchaseOrder: cleanValue(purchaseOrder),
    subtotal: subtotalInfo.value,
    tax: taxInfo.value,
    totalAmount: totalInfo.value,
    totalAmountFormatted: totalInfo.formatted,
    currency: totalInfo.currency || subtotalInfo.currency || taxInfo.currency,
    dueDate: toDateOrNull(dueDateRaw),
    billDate: toDateOrNull(billDateRaw),
    vendor: cleanValue(vendor),
    client: cleanValue(client),
  };
}

function score(text) {
  let total = 0;

  if (/invoice|bill|billing statement|statement of account/i.test(text)) {
    total += 60;
  }

  if (/grand total|amount due|due date|billed to|vendor/i.test(text)) {
    total += 30;
  }

  if (/po number|invoice number|subtotal|tax/i.test(text)) {
    total += 10;
  }

  return total;
}

module.exports = {
  description,
  keywords,
  parse,
  score,
};
