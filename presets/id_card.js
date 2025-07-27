/**
 * Supported ID Cards (Expected Patterns & Fields)
 *
 * ✅ Compatible / Expected ID Types:
 * - Philippine IDs: UMID, SSS, TIN, PhilHealth, Pag-IBIG, Postal ID, Voter's ID, National ID
 * - Driver’s Licenses (PH & foreign)
 * - Passports (any country with text OCR)
 * - National ID cards (NRIC, MyKad, Aadhaar, etc.)
 *
 * 🔍 Fields Extracted:
 * - fullName: Full name of cardholder
 * - idNumber: ID or license number
 * - birthDate: Date of birth (multiple formats supported)
 * - gender: M/F or Male/Female
 * - nationality: Nationality or citizenship
 * - address: Residential address (if available)
 */

function parse(text) {
  const idNumber = (text.match(
    /(?:ID(?:\s*Number)?|SSS|TIN|PhilHealth|License|Passport|UMID)\s*#?:?\s*([\w\-]+)/i
  ) || [])[1];

  const nameMatch =
    text.match(
      /(?:Name|Full Name)[:\-]?\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
    ) ||
    text.match(/([A-Z]{2,},?\s+[A-Z]{2,}.*)/) ||
    [];

  const birthday = (text.match(
    /(?:Born|Birth\s*Date|Bday|DOB)\s*:?\s*(\w{3,9}\s+\d{1,2},?\s+\d{4}|\d{2,4}[-\/]\d{1,2}[-\/]\d{1,4})/i
  ) || [])[1];
  const date = birthday ? new Date(birthday) : null;

  const gender = (text.match(/(?:Sex|Gender)[:\-]?\s*(Male|Female|M|F)/i) ||
    [])[1];

  const nationality = (text.match(
    /(?:Nationality|Citizenship)[:\-]?\s*([A-Za-z]+)/i
  ) || [])[1];

  const address = (text.match(/(?:Address|Residence|Location)[:\-]?\s*(.+)/i) ||
    [])[1];

  return {
    category: "id_card",
    fullName: nameMatch?.[1]?.trim() || null,
    idNumber: idNumber?.trim() || null,
    birthDate: isNaN(date) ? null : date,
    gender: gender?.trim() || null,
    nationality: nationality?.trim() || null,
    address: address?.trim() || null,
  };
}

module.exports = { parse };
