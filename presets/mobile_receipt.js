const {
  cleanValue,
  extractPhone,
  findLine,
  matchFirst,
  parseCurrencyAmount,
  toDateOrNull,
  toLines,
} = require("./helpers");

const keywords = [
  "gcash",
  "maya",
  "paypal",
  "wise",
  "revolut",
  "remitly",
  "worldremit",
  "reference no",
  "sent to",
  "transaction id",
];

const description =
  "Parse wallet receipts, transfers, remittance confirmations, and digital payment screenshots.";

function parse(text, options = {}) {
  const amountInfo = parseCurrencyAmount(text, {
    linePatterns: [
      /amount|total amount sent|you have sent|you sent|paid|transferred|received|cash in|cash out/i,
    ],
  });
  const dateRaw =
    matchFirst(text, [
      /(?:Date|Transaction Date|Created At|Paid On|Timestamp)\s*[:\-]?\s*([^\n]+)/i,
      /([A-Za-z]+ \d{1,2}, \d{4}(?: \d{1,2}:\d{2}(?: ?[APMapm]{2})?)?)/,
      /(\d{1,2} [A-Za-z]+ \d{4}(?: \d{1,2}:\d{2}(?: ?[APMapm]{2})?)?)/,
      /(\d{4}[-/.]\d{2}[-/.]\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?)/,
      /(\d{2}[-/.]\d{2}[-/.]\d{4}(?: \d{1,2}:\d{2}(?: ?[APMapm]{2})?)?)/,
      /(?:timestamp|unix|epoch)[^\d]*(\d{10,13})/i,
    ]) || null;

  return {
    category: "mobile_receipt",
    platform: detectPlatform(text),
    amount: amountInfo.formatted,
    amountValue: amountInfo.value,
    amountRaw: amountInfo.raw,
    currency: amountInfo.currency,
    date: toDateOrNull(dateRaw),
    reference: extractReference(text),
    phone: extractPhone(text, options.defaultCountry || "PH"),
    receiver: extractReceiver(text),
    sender: extractSender(text),
  };
}

function score(text) {
  let total = 0;

  if (/gcash|maya|paymaya|paypal|wise|revolut|venmo|cash app|zelle|worldremit|remitly/i.test(text)) {
    total += 60;
  }

  if (/sent to|paid to|receiver|transfer|reference|transaction id|confirmation/i.test(text)) {
    total += 25;
  }

  if (/mobile number|wallet|cash in|cash out/i.test(text)) {
    total += 15;
  }

  return total;
}

function detectPlatform(text) {
  if (/gcash/i.test(text)) return "gcash";
  if (/maya|paymaya/i.test(text)) return "maya";
  if (/palawan/i.test(text)) return "palawan";
  if (/coins\.ph|coinsph/i.test(text)) return "coins.ph";
  if (/shopee\s*pay/i.test(text)) return "shopeepay";
  if (/grabpay/i.test(text)) return "grabpay";
  if (/paypal/i.test(text)) return "paypal";
  if (/stripe/i.test(text)) return "stripe";
  if (/venmo/i.test(text)) return "venmo";
  if (/cash\s*app/i.test(text)) return "cash_app";
  if (/zelle/i.test(text)) return "zelle";
  if (/revolut/i.test(text)) return "revolut";
  if (/wise|transferwise/i.test(text)) return "wise";
  if (/worldremit/i.test(text)) return "worldremit";
  if (/remitly/i.test(text)) return "remitly";
  if (/western\s*union/i.test(text)) return "western_union";
  if (/bpi|bdo|unionbank|landbank|metrobank|security bank/i.test(text)) return "bank";
  return "unknown";
}

function extractReference(text) {
  const referenceLine = findLine(text, [
    /^(?:Reference|Ref(?:erence)?(?:\s*(?:No|Number|#))?|Transaction\s*(?:ID|No|Number|Reference)|Confirmation(?:\s*(?:No|#))?)\b/i,
  ]);
  const raw =
    referenceLine &&
    matchFirst(referenceLine, [
      /^(?:Reference|Ref(?:erence)?(?:\s*(?:No|Number|#))?|Transaction\s*(?:ID|No|Number|Reference)|Confirmation(?:\s*(?:No|#))?)\s*[:\-]?\s*([A-Z0-9\- ]{6,40})/i,
    ]);

  return raw ? raw.replace(/[^\w-]/g, "").trim() : null;
}

function extractReceiver(text) {
  const receiverLine = findLine(text, [/^(?:Receiver|Sent to|Paid to|To)\s*[:\-]?/i]);
  const labeled =
    receiverLine &&
    matchFirst(receiverLine, [/^(?:Receiver|Sent to|Paid to|To)\s*[:\-]?\s*([^\n]+)/i]);
  if (labeled) {
    return labeled;
  }

  const lines = toLines(text);
  const phoneIndex = lines.findIndex((line) => /\+?\d[\d\s-]{8,}/.test(line));
  if (phoneIndex > 0) {
    const possibleName = cleanValue(lines[phoneIndex - 1]);
    if (possibleName && /^[\p{L} .'-]{3,}$/u.test(possibleName) && !/\d/.test(possibleName)) {
      return possibleName;
    }
  }

  const fallbackLine = findLine(text, [/^(?:receiver|sent to|paid to|to)\b/i]);
  if (!fallbackLine) {
    return null;
  }

  return cleanValue(fallbackLine.replace(/^(?:receiver|sent to|paid to|to)\s*[:\-]?\s*/i, ""));
}

function extractSender(text) {
  const senderLine = findLine(text, [/^(?:From|Sender|Paid by|You)\s*[:\-]?/i]);
  return (
    (senderLine &&
      matchFirst(senderLine, [/^(?:From|Sender|Paid by|You)\s*[:\-]?\s*([^\n]+)/i])) ||
    null
  );
}

module.exports = {
  description,
  keywords,
  parse,
  score,
};
