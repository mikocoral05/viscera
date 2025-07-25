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

    const words = result.data.words.map((word) => ({
      text: word.text,
      confidence: word.confidence,
      bbox: word.bbox,
    }));

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
  if (!words.length) return 0;
  const total = words.reduce((sum, w) => sum + w.confidence, 0);
  return total / words.length;
}

module.exports = {
  extractText,
};
