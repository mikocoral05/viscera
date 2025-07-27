// Parser for digital payment receipts — both local (Philippines) and international.
// It detects common transaction elements like amount, date, reference ID, phone number, etc.
// 🌐 Supported sources include mobile wallets, banks, and international services.

// 🌍 Supported Platforms (detected automatically):
// - GCash, Maya, Palawan Express, Coins.ph, ShopeePay, GrabPay
// - BPI, BDO, Metrobank, UnionBank, LandBank (tagged as "bank")
// - ✅ PayPal, Stripe, Wise (TransferWise), Revolut, Western Union
// - ✅ Remitly, WorldRemit, Venmo, Cash App, Zelle
// - ✅ Any receipt that includes recognizable keywords and formats

import { findPhoneNumbersInText } from "libphonenumber-js";
function parse(text) {
  console.log(text);

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

// Extracts and formats monetary amount from the text
function extractAmount(text, format = true) {
  const match = text.match(
    /(?:Amount|Total Amount Sent|You have sent|Paid|Total|Transferred)\D{0,10}([\d,]+\.\d{2})/
  );

  if (!match) return null;

  const raw = parseFloat(match[1].replace(/,/g, ""));

  if (format) {
    // Return formatted as '25,000.00'
    return raw.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return raw; // Return numeric version
}

// Extracts a formatted date-time
function extractDate(text) {
  // 1. e.g., "May 14, 2025 9:21 PM"
  let match = text.match(
    /([A-Za-z]+ \d{1,2}, \d{4})\s+(\d{1,2}:\d{2} ?[APMapm]{2})/
  );
  if (match) return new Date(`${match[1]} ${match[2]} GMT+0800`);

  // 2. e.g., "14 May 2025 21:21"
  match = text.match(/(\d{1,2}) ([A-Za-z]+) (\d{4})\s+(\d{1,2}:\d{2})/);
  if (match)
    return new Date(
      `${match[2]} ${match[1]}, ${match[3]} ${match[4]} GMT+0800`
    );

  // 3. e.g., "2025-07-25T18:30", "2025-07-25 18:30"
  match = text.match(/(\d{4})[-\/\.](\d{2})[-\/\.](\d{2})[ T](\d{2}:\d{2})/);
  if (match)
    return new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:00+08:00`);

  // 4. e.g., "05-14-2025 9:21 PM"
  match = text.match(
    /(\d{2})[-\/\.](\d{2})[-\/\.](\d{4})\s+(\d{1,2}:\d{2} ?[APMapm]{2})/
  );
  if (match)
    return new Date(`${match[3]}-${match[1]}-${match[2]} ${match[4]} GMT+0800`);

  // 5. Raw Unix timestamps (optional, in milliseconds or seconds)
  match = text.match(/(?:timestamp|unix|epoch)[^\d]*?(\d{10,13})/i);
  if (match) {
    const timestamp = parseInt(match[1], 10);
    return new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
  }

  return null; // fallback
}

// Extracts transaction/reference ID (numbers or alphanumerics), excluding month names or dates.
function extractReference(text) {
  const match = text.match(
    /(?:Ref(?:erence)?(?:\s*No)?\.?|Transaction|Trans\s*ID|Confirmation)[\s:]*([A-Z0-9 ]{8,40})/i
  );
  if (!match) return null;

  let raw = match[1];

  // Stop parsing at month names (May, June, etc.)
  raw = raw.split(
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i
  )[0];

  // Remove all non-alphanumeric characters
  return raw.replace(/[^\w]/g, "").trim() || null;
}

// Detects PH mobile number or international mobile numbers (basic)
function extractPhone(text) {
  const results = findPhoneNumbersInText(text, "US"); // or 'PH', or change per context
  return results.length > 0 ? results[0].number.number : null;
}

// Extracts receiver name from patterns like "to John Smith"
function extractReceiver(text) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  let receiver = null;

  // First priority: standard keyword pattern
  for (const line of lines) {
    const match = line.match(/(?:to|Receiver|Sent to|Paid to)[:\s]+(.+)/i);
    if (match) {
      receiver = match[1].trim();
      break;
    }
  }

  // Fallback: name above phone number
  if (!receiver) {
    const phoneIndex = lines.findIndex((line) => /\+?\d[\d\s-]{8,}/.test(line));
    if (phoneIndex > 0) {
      const possibleName = lines[phoneIndex - 1];
      // Only accept if it looks like a name (letters, possibly special chars, and not a number)
      if (
        /^[\p{L}«»\s.'-]{3,}$/u.test(possibleName) &&
        !/\d/.test(possibleName)
      ) {
        receiver = possibleName;
      }
    }
  }

  return receiver;
}

// Extracts sender name from patterns like "From: Maria Cruz"
function extractSender(text) {
  const match = text.match(
    /(?:From|Sender|You)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/i
  );
  return match ? match[1].trim() : null;
}

export { parse };
