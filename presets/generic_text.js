// presets/generic_text.js
function parse(text) {
  return {
    category: "generic_text",
    summary: text.slice(0, 300).trim(),
  };
}

module.exports = { parse };
