function parse(text) {
  return {
    category: "mobile_receipt",
    platform: detectPlatform(text),
    amount: extractAmount(text),
    date: extractDate(text),
    reference: extractReference(text),
    phone: extractPhone(text),
  };
}

function detectPlatform(text) {
  if (/gcash/i.test(text)) return "gcash";
  if (/maya/i.test(text)) return "maya";
  if (/palawan/i.test(text)) return "palawan";
  return "unknown";
}

function extractAmount(text) {
  const match = text.match(
    /(?:Amount|Total Amount Sent)[^\d]*([\d,]+\.\d{2})/i
  );
  return match ? parseFloat(match[1].replace(/,/g, "")) : null;
}

function extractDate(text) {
  const match = text.match(
    /(\w+ \d{1,2}, \d{4})\s+(\d{1,2}:\d{2} [APMapm]{2})/
  );
  return match ? new Date(`${match[1]} ${match[2]}`) : null;
}

function extractReference(text) {
  const match = text.match(/Ref(?:erence)? No\.?\s*([\d ]{10,})/i);
  return match ? match[1].replace(/\s+/g, "").trim() : null;
}

function extractPhone(text) {
  const match = text.match(/(?:\+63|09)\d{9}/);
  return match ? match[0] : null;
}

module.exports = { parse };
