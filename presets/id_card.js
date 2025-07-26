// presets/id_card.js
function parse(text) {
  const idNumber = (text.match(
    /(?:ID|SSS|TIN|PhilHealth|License)\s*#?:?\s*([\w-]+)/i
  ) || [])[1];
  const nameMatch = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?)/);
  const birthday = (text.match(
    /(?:Born|Birth\s*Date|Bday)\s*:?\s*(\w+ \d{1,2},? \d{4})/
  ) || [])[1];

  const date = birthday ? new Date(birthday) : null;

  return {
    category: "id_card",
    fullName: nameMatch?.[1] || null,
    idNumber: idNumber || null,
    birthDate: isNaN(date) ? null : date,
  };
}

module.exports = { parse };
