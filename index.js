const Tesseract = require("tesseract.js");

// Optional: load all presets here
const presets = {
  mobile_receipt: require("./presets/mobile_receipt"),
  bank_receipt: require("./presets/bank_receipt"),
  id_card: require("./presets/id_card"),
  invoice_or_bill: require("./presets/invoice_or_bill"),
  generic_text: require("./presets/generic_text"),
};

/**
 * Extract text from image and optionally parse using a preset
 * @param {string|Buffer} imagePath
 * @param {Object} [options]
 * @param {string} [options.preset] - Optional category preset
 * @returns {Promise<Object>}
 */
async function extractText(imagePath, options = {}) {
  const { preset, ...tesseractOptions } = options;

  try {
    const result = await Tesseract.recognize(imagePath, "eng", {
      logger: (m) => console.log(m),
      ...tesseractOptions,
    });

    let words = result.data.words || [];

    if (words.length === 0 && result.data.lines?.length > 0) {
      words = result.data.lines.map((line) => ({
        text: line.text,
        confidence: line.confidence,
        bbox: line.bbox || {},
      }));
    }

    const text = result.data.text;
    const confidenceAvg = averageConfidence(words);

    let parsed = null;
    if (preset && presets[preset]) {
      parsed = presets[preset].parse(text);
    }

    return {
      text,
      confidenceAvg,
      words,
      parsed, // category-specific structured result
    };
  } catch (err) {
    throw new Error(`OCR failed: ${err.message}`);
  }
}

function averageConfidence(words) {
  if (!words.length) return null;
  const total = words.reduce((sum, w) => sum + (w.confidence || 0), 0);
  return total / words.length;
}

module.exports = {
  extractText,
};
