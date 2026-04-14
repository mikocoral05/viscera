const { cleanValue, matchFirst } = require("./helpers");
const bankReceipt = require("./bank_receipt");

const keywords = ["bdo", "banco de oro", "send money", "online banking", "kabayan"];
const description =
  "BDO-focused preset for Banco de Oro receipts and online banking transfer screenshots.";

function parse(text, options = {}) {
  const base = bankReceipt.parse(text, options);
  const transferType = matchFirst(text, [
    /(?:Transaction Type|Transfer Type|Service)\s*[:\-]?\s*([^\n]+)/i,
    /(Send Money|Bills Payment|Transfer to Another Bank|Own Account Transfer)/i,
  ]);

  return {
    ...base,
    category: "bdo",
    bank: "BDO",
    transferType: cleanValue(transferType),
    channel: detectChannel(text),
  };
}

function score(text) {
  let total = 0;

  if (/bdo|banco de oro/i.test(text)) {
    total += 90;
  }

  if (/online banking|send money|own account transfer|bills payment/i.test(text)) {
    total += 10;
  }

  return total;
}

function detectChannel(text) {
  if (/online banking/i.test(text)) return "online_banking";
  if (/mobile app|bdo pay/i.test(text)) return "mobile_app";
  if (/atm/i.test(text)) return "atm";
  return null;
}

module.exports = {
  description,
  keywords,
  parse,
  score,
};
