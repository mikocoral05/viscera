const { normalizeWhitespace, toLines } = require("./helpers");

const keywords = ["text", "notes", "document"];
const description =
  "Fallback parser for plain OCR output when no more specific preset is a strong match.";

function parse(text) {
  const normalized = normalizeWhitespace(text);
  const lines = toLines(normalized);
  const words = normalized.match(/\b[\p{L}\p{N}][\p{L}\p{N}\-.'@/]*\b/gu) || [];

  return {
    category: "generic_text",
    summary: normalized.slice(0, 280).trim(),
    lineCount: lines.length,
    wordCount: words.length,
    previewLines: lines.slice(0, 3),
  };
}

function score() {
  return 1;
}

module.exports = {
  description,
  keywords,
  parse,
  score,
};
