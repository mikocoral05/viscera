const Tesseract = require("tesseract.js");

/**
 * Extract text from image with enhanced output including confidence and bounding boxes.
 * @param {string|Buffer} imagePath - Path or buffer of the image to be processed.
 * @param {Object} [options] - Optional Tesseract config options.
 * @returns {Promise<Object>} - Processed OCR result with metadata.
 */
async function extractText(imagePath, options = {}) {
  try {
    const result = await Tesseract.recognize(imagePath, "eng", {
      logger: (m) => console.log(m), // Shows progress
      ...options,
    });

    let words = result.data.words || [];

    if (words.length === 0 && result.data.lines?.length > 0) {
      words = result.data.lines.map((line) => ({
        text: line.text,
        confidence: line.confidence,
        bbox: line.bbox || {},
      }));
    }

    return {
      text: result.data.text,
      confidenceAvg: averageConfidence(words),
      words,
    };
  } catch (err) {
    throw new Error(`OCR failed: ${err.message}`);
  }
}

function averageConfidence(words) {
  if (!words.length) return null; // Instead of 0
  const total = words.reduce((sum, w) => sum + (w.confidence || 0), 0);
  return total / words.length;
}

module.exports = {
  extractText,
};
