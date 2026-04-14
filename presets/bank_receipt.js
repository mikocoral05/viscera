const {
  cleanValue,
  matchFirst,
  parseCurrencyAmount,
  toDateOrNull,
} = require("./helpers");

const keywords = [
  "account number",
  "beneficiary",
  "bank",
  "transaction reference",
  "transaction date",
  "deposit",
  "sender",
  "receiver",
];

const description =
  "Parse standard bank transfer receipts, deposit confirmations, and online banking transaction snapshots.";

function parse(text) {
  const amountInfo = parseCurrencyAmount(text, {
    linePatterns: [/amount|deposit|paid|transfer amount|transaction amount/i],
  });
  const dateRaw = matchFirst(text, [
    /(?:Date|Transaction Date|Txn Date|Processed On)\s*[:\-]?\s*([^\n]+)/i,
    /([A-Za-z]+ \d{1,2}, \d{4}(?: \d{1,2}:\d{2}(?: ?[APMapm]{2})?)?)/,
    /(\d{4}[-/.]\d{2}[-/.]\d{2}(?:[ T]\d{2}:\d{2})?)/,
  ]);

  const transactionReference = matchFirst(text, [
    /(?:Reference|Transaction\s*ID|Ref(?:\.|#)?|Confirmation)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
  ]);

  const sender = matchFirst(text, [/(?:Sender|From|Transfer From)\s*[:\-]?\s*([^\n]+)/i]);
  const receiver = matchFirst(text, [
    /(?:Receiver|To|Beneficiary|Transfer To)\s*[:\-]?\s*([^\n]+)/i,
  ]);
  const accountNumber = matchFirst(text, [
    /(?:Account(?:\s*Number| No)?|Acct\.?\s*#?)\s*[:\-]?\s*([\d\-*]+)/i,
  ]);
  const remarks = matchFirst(text, [/(?:Remarks|Note|Purpose)\s*[:\-]?\s*([^\n]+)/i]);
  const bank = detectBank(text);

  return {
    category: "bank_receipt",
    bank,
    transactionReference,
    transaction_reference: transactionReference,
    sender: cleanValue(sender),
    receiver: cleanValue(receiver),
    accountNumber: cleanValue(accountNumber),
    accountNo: cleanValue(accountNumber),
    amount: amountInfo.value,
    amountFormatted: amountInfo.formatted,
    currency: amountInfo.currency,
    date: toDateOrNull(dateRaw),
    remarks: cleanValue(remarks),
  };
}

function score(text) {
  let total = 0;

  if (/account number|beneficiary|bank transfer|transaction date|transaction reference/i.test(text)) {
    total += 55;
  }

  if (/bdo|bpi|metrobank|unionbank|security bank|landbank|rcbc|chase|wells fargo|bank of america/i.test(text)) {
    total += 30;
  }

  if (/sender|receiver|deposit|transfer to|transfer from/i.test(text)) {
    total += 15;
  }

  return total;
}

function detectBank(text) {
  if (/bdo|banco de oro/i.test(text)) return "BDO";
  if (/bpi|bank of the philippine islands/i.test(text)) return "BPI";
  if (/metrobank/i.test(text)) return "Metrobank";
  if (/unionbank/i.test(text)) return "UnionBank";
  if (/landbank/i.test(text)) return "LandBank";
  if (/security bank/i.test(text)) return "Security Bank";
  if (/rcbc/i.test(text)) return "RCBC";
  if (/chase/i.test(text)) return "Chase";
  if (/wells\s*fargo/i.test(text)) return "Wells Fargo";
  if (/bank of america|bofa/i.test(text)) return "Bank of America";
  if (/citibank|citi\b/i.test(text)) return "Citibank";
  return null;
}

module.exports = {
  description,
  keywords,
  parse,
  score,
};
