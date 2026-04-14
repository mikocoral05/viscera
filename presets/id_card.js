const { cleanValue, matchFirst, toDateOrNull, toLines } = require("./helpers");

const keywords = [
  "passport",
  "license",
  "birth date",
  "nationality",
  "citizenship",
  "driver",
  "national id",
];

const description =
  "Extract common fields from IDs, passports, licenses, and government-issued identity cards.";

function parse(text) {
  const idNumber = matchFirst(text, [
    /(?:ID(?:\s*Number)?|License|Passport|Document No|National ID|PhilHealth|UMID|TIN|SSS)\s*#?:?\s*([\w\-]+)/i,
  ]);
  const birthDateRaw = matchFirst(text, [
    /(?:Born|Birth\s*Date|DOB|Date of Birth)\s*:?\s*([^\n]+)/i,
    /(\d{2,4}[-/]\d{1,2}[-/]\d{1,4})/,
  ]);
  const gender = matchFirst(text, [/(?:Sex|Gender)\s*[:\-]?\s*(Male|Female|M|F)/i]);
  const nationality = matchFirst(text, [
    /(?:Nationality|Citizenship)\s*[:\-]?\s*([A-Za-z ]+)/i,
  ]);
  const address = matchFirst(text, [/(?:Address|Residence|Location)\s*[:\-]?\s*([^\n]+)/i]);

  return {
    category: "id_card",
    documentType: detectDocumentType(text),
    fullName: extractName(text),
    idNumber: cleanValue(idNumber),
    birthDate: toDateOrNull(birthDateRaw),
    gender: cleanValue(gender),
    nationality: cleanValue(nationality),
    address: cleanValue(address),
  };
}

function score(text) {
  let total = 0;

  if (/passport|driver|license|national id|citizenship|date of birth|dob/i.test(text)) {
    total += 65;
  }

  if (/surname|given name|full name|sex|nationality/i.test(text)) {
    total += 25;
  }

  if (/address|document no|id number/i.test(text)) {
    total += 10;
  }

  return total;
}

function extractName(text) {
  const explicit = matchFirst(text, [
    /(?:Name|Full Name|Cardholder)\s*[:\-]?\s*([^\n]+)/i,
  ]);
  if (explicit) {
    return explicit;
  }

  const lines = toLines(text);
  const uppercaseLine = lines.find((line) => /^[A-Z][A-Z\s,'-]{5,}$/.test(line));
  if (uppercaseLine) {
    return cleanValue(uppercaseLine);
  }

  return null;
}

function detectDocumentType(text) {
  if (/passport/i.test(text)) return "passport";
  if (/driver/i.test(text) || /license/i.test(text)) return "drivers_license";
  if (/national id/i.test(text)) return "national_id";
  if (/umid/i.test(text)) return "umid";
  if (/philhealth/i.test(text)) return "philhealth";
  if (/postal id/i.test(text)) return "postal_id";
  if (/voter/i.test(text)) return "voter_id";
  return "id_card";
}

module.exports = {
  description,
  keywords,
  parse,
  score,
};
