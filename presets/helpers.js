const { findPhoneNumbersInText } = require("libphonenumber-js");

const CURRENCY_MAP = {
  "\u20B1": "PHP",
  PHP: "PHP",
  "$": "USD",
  USD: "USD",
  "\u20AC": "EUR",
  EUR: "EUR",
  "\u00A3": "GBP",
  GBP: "GBP",
  SGD: "SGD",
  CAD: "CAD",
  AUD: "AUD",
  JPY: "JPY",
};

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1] !== ""))
    .join("\n")
    .trim();
}

function toLines(text) {
  return normalizeWhitespace(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const cleaned = String(value)
    .replace(/\s+/g, " ")
    .replace(/^[\s:.-]+|[\s:.-]+$/g, "")
    .trim();

  return cleaned || null;
}

function matchFirst(text, patterns, groupIndex = 1) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);
    if (match && match[groupIndex]) {
      return cleanValue(match[groupIndex]);
    }
  }

  return null;
}

function findLine(text, patterns) {
  const lines = toLines(text);
  return lines.find((line) => patterns.some((pattern) => pattern.test(line))) || null;
}

function detectCurrency(text) {
  const token =
    matchFirst(text, [/\b(PHP|USD|EUR|GBP|SGD|CAD|AUD|JPY)\b/i]) ||
    matchFirst(text, [/(\u20B1|\$|\u20AC|\u00A3)/]);

  return normalizeCurrency(token);
}

function normalizeCurrency(token) {
  if (!token) {
    return null;
  }

  return CURRENCY_MAP[String(token).toUpperCase()] || CURRENCY_MAP[token] || null;
}

function parseCurrencyAmount(text, options = {}) {
  const { fallbackToText = true } = options;
  const preferredLine =
    findLine(text, options.linePatterns || []) ||
    (fallbackToText
      ? findLine(text, [/(\u20B1|\$|\u20AC|\u00A3|PHP|USD|EUR|GBP|SGD|CAD|AUD|JPY)\s*[\d,.]+/i])
      : null);
  const source = preferredLine || (fallbackToText ? String(text || "") : "");
  const moneyMatch = source.match(
    /(PHP|USD|EUR|GBP|SGD|CAD|AUD|JPY|\u20B1|\$|\u20AC|\u00A3)?\s*([\d]+(?:,\d{3})*(?:\.\d{1,2})?)/i
  );

  if (!moneyMatch) {
    return {
      raw: null,
      value: null,
      currency: detectCurrency(text),
      formatted: null,
      source: preferredLine,
    };
  }

  const currency = normalizeCurrency(moneyMatch[1]) || detectCurrency(source) || detectCurrency(text);
  const value = Number.parseFloat(moneyMatch[2].replace(/,/g, ""));

  return {
    raw: cleanValue(moneyMatch[0]),
    value: Number.isFinite(value) ? value : null,
    currency,
    formatted: Number.isFinite(value)
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null,
    source: preferredLine,
  };
}

function toDateOrNull(value) {
  if (!value) {
    return null;
  }

  const cleaned = cleanValue(value)
    ?.replace(/(\d)(st|nd|rd|th)\b/gi, "$1")
    .replace(/\bat\b/gi, " ")
    .replace(/\s+/g, " ");

  if (!cleaned) {
    return null;
  }

  if (/^\d{10,13}$/.test(cleaned)) {
    const numericValue = Number.parseInt(cleaned, 10);
    const timestamp = cleaned.length === 10 ? numericValue * 1000 : numericValue;
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  let date = new Date(cleaned);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }

  let match = cleaned.match(
    /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}:\d{2})(?::(\d{2}))?(?:\s*([APMapm]{2}))?)?/
  );
  if (match) {
    const [, year, month, day, time = "00:00", seconds = "00", meridiem] = match;
    date = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}:${seconds}${
        meridiem ? ` ${meridiem.toUpperCase()}` : ""
      }`
    );
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  match = cleaned.match(
    /(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:[ T](\d{1,2}:\d{2})(?:\s*([APMapm]{2}))?)?/
  );
  if (match) {
    const [, month, day, year, time = "00:00", meridiem] = match;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    date = new Date(
      `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${time}${
        meridiem ? ` ${meridiem.toUpperCase()}` : ""
      }`
    );
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  match = cleaned.match(
    /(\d{1,2}) ([A-Za-z]+) (\d{4})(?:[ T](\d{1,2}:\d{2})(?:\s*([APMapm]{2}))?)?/
  );
  if (match) {
    const [, day, monthName, year, time = "00:00", meridiem] = match;
    date = new Date(`${monthName} ${day}, ${year} ${time}${meridiem ? ` ${meridiem}` : ""}`);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function extractPhone(text, defaultCountry = "PH") {
  try {
    const results = findPhoneNumbersInText(String(text || ""), defaultCountry);
    return results.length ? results[0].number.number : null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  cleanValue,
  detectCurrency,
  extractPhone,
  findLine,
  matchFirst,
  normalizeCurrency,
  normalizeWhitespace,
  parseCurrencyAmount,
  toDateOrNull,
  toLines,
};
