// Parser for digital payment receipts — both local (Philippines) and international.
// It detects common transaction elements like amount, date, reference ID, phone number, etc.
// 🌐 Supported sources include mobile wallets, banks, and international services.

// 🌍 Supported Platforms (detected automatically):
// - GCash, Maya, Palawan Express, Coins.ph, ShopeePay, GrabPay
// - BPI, BDO, Metrobank, UnionBank, LandBank (tagged as "bank")
// - ✅ PayPal, Stripe, Wise (TransferWise), Revolut, Western Union
// - ✅ Remitly, WorldRemit, Venmo, Cash App, Zelle
// - ✅ Any receipt that includes recognizable keywords and formats

function parse(text) {
  return {
    category: "mobile_receipt",
    platform: detectPlatform(text),
    amount: extractAmount(text),
    date: extractDate(text),
    reference: extractReference(text),
    phone: extractPhone(text),
    receiver: extractReceiver(text),
    sender: extractSender(text),
  };
}

// Detects the platform based on text patterns
function detectPlatform(text) {
  if (/gcash/i.test(text)) return "gcash";
  if (/maya|paymaya/i.test(text)) return "maya";
  if (/palawan/i.test(text)) return "palawan";
  if (/coins\.ph|coinsph/i.test(text)) return "coins.ph";
  if (/shopee\s*pay/i.test(text)) return "shopeepay";
  if (/grabpay/i.test(text)) return "grabpay";

  // International & digital wallets
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

  // Banks (generic catch)
  if (
    /bpi|bdo|unionbank|landbank|metrobank|chase|wells\s*fargo|bank\s*of\s*america/i.test(
      text
    )
  )
    return "bank";

  return "unknown";
}

// Extracts monetary amount from the text
function extractAmount(text) {
  const match = text.match(
    /(?:Amount|Total Amount Sent|You have sent|Paid|Total|Transferred)\D{0,10}([\d,]+\.\d{2})/
  );
  return match ? parseFloat(match[1].replace(/,/g, "")) : null;
}

// Extracts a formatted date-time
function extractDate(text) {
  const match = text.match(
    /(\w+ \d{1,2}, \d{4})\s+(\d{1,2}:\d{2} ?[APMapm]{2})/
  );
  if (match) return new Date(`${match[1]} ${match[2]}`);

  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  if (isoMatch) return new Date(`${isoMatch[1]}T${isoMatch[2]}`);

  return null;
}

// Extracts transaction/reference ID
function extractReference(text) {
  const match = text.match(
    /(?:Ref(?:erence)?|Transaction|Trans\s*ID|Confirmation)\s*[:#-]?\s*([A-Z\d\- ]{8,})/i
  );
  return match ? match[1].replace(/[\s\-]+/g, "").trim() : null;
}

// Detects PH mobile number or international mobile numbers (basic)
function extractPhone(text) {
  const match = text.match(/(?:\+?\d{1,3})?[\s-]?(?:09|\d{2,3})\d{7,9}/);
  return match ? match[0] : null;
}

// Extracts receiver name from patterns like "to John Smith"
function extractReceiver(text) {
  const match = text.match(
    /(?:to|Receiver|Sent to|Paid to)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i
  );
  return match ? match[1].trim() : null;
}

// Extracts sender name from patterns like "From: Maria Cruz"
function extractSender(text) {
  const match = text.match(
    /(?:From|Sender|You)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i
  );
  return match ? match[1].trim() : null;
}

module.exports = { parse };
