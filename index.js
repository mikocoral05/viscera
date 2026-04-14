const Tesseract = require("tesseract.js");

const builtInPresets = {
  mobile_receipt: require("./presets/mobile_receipt"),
  bank_receipt: require("./presets/bank_receipt"),
  bdo: require("./presets/bdo"),
  id_card: require("./presets/id_card"),
  invoice_or_bill: require("./presets/invoice_or_bill"),
  generic_text: require("./presets/generic_text"),
};

const customPresets = new Map();

async function extractText(image, options = {}) {
  if (!image) {
    throw new Error("extractText requires an image path, URL, or Buffer.");
  }

  const {
    preset,
    presetOptions = {},
    defaultCountry = "PH",
    language: explicitLanguage,
    lang,
    logger = null,
    minConfidence = 0,
    normalizeText: shouldNormalizeText = true,
    includeRaw = false,
    autoDetectPreset = !preset,
    includeSuggestions = true,
    recognizeOptions = {},
    ...legacyRecognizeOptions
  } = options;

  const language = explicitLanguage || lang || "eng";
  const startedAt = Date.now();
  const tesseractOptions = {
    ...legacyRecognizeOptions,
    ...recognizeOptions,
  };

  if (typeof logger === "function") {
    tesseractOptions.logger = logger;
  } else if ("logger" in tesseractOptions && typeof tesseractOptions.logger !== "function") {
    delete tesseractOptions.logger;
  }

  try {
    const result = await Tesseract.recognize(image, language, tesseractOptions);
    const extractedAt = new Date();
    const ocrPayload = normalizeOcrData(result.data, {
      minConfidence,
      normalizeText: shouldNormalizeText,
    });

    const parsedPayload = parseText(ocrPayload.text, {
      preset,
      presetOptions,
      defaultCountry,
      autoDetectPreset,
      includeSuggestions,
      words: ocrPayload.words,
      lines: ocrPayload.lines,
    });

    return {
      text: ocrPayload.text,
      normalizedText: parsedPayload.normalizedText,
      confidenceAvg: ocrPayload.confidence.average,
      confidence: ocrPayload.confidence,
      counts: ocrPayload.counts,
      words: ocrPayload.words,
      lines: ocrPayload.lines,
      paragraphs: ocrPayload.paragraphs,
      preset: parsedPayload.preset,
      presetSource: parsedPayload.presetSource,
      suggestedPresets: parsedPayload.suggestedPresets,
      parsed: parsedPayload.parsed,
      meta: {
        language,
        extractedAt: extractedAt.toISOString(),
        durationMs: Date.now() - startedAt,
      },
      raw: includeRaw ? result : undefined,
    };
  } catch (error) {
    throw new Error(`OCR failed: ${error.message}`);
  }
}

function parseText(text, options = {}) {
  const sourceText = typeof text === "string" ? text : String(text || "");
  const normalizedText = normalizeOcrText(sourceText);
  const {
    preset,
    presetOptions = {},
    defaultCountry = "PH",
    autoDetectPreset = !preset,
    includeSuggestions = true,
    words = [],
    lines = [],
  } = options;

  let presetSource = null;
  let selectedPreset = null;

  if (preset) {
    selectedPreset = resolvePresetInput(preset);
    presetSource = "manual";
  } else if (autoDetectPreset) {
    const [bestMatch] = suggestPresets(normalizedText, { limit: 1 });
    if (bestMatch) {
      selectedPreset = resolvePresetInput(bestMatch.name);
      presetSource = "suggested";
    }
  }

  const context = {
    defaultCountry,
    words,
    lines,
    text: normalizedText,
  };

  return {
    text: sourceText,
    normalizedText,
    counts: buildTextCounts(normalizedText, { words, lines }),
    preset: selectedPreset ? selectedPreset.name : null,
    presetSource,
    suggestedPresets: includeSuggestions ? suggestPresets(normalizedText) : [],
    parsed: selectedPreset ? selectedPreset.parse(normalizedText, { ...context, ...presetOptions }) : null,
  };
}

function createExtractor(defaultOptions = {}) {
  return {
    extractText(image, options = {}) {
      return extractText(image, { ...defaultOptions, ...options });
    },
    parseText(text, options = {}) {
      return parseText(text, { ...defaultOptions, ...options });
    },
  };
}

function registerPreset(name, preset) {
  if (!name || typeof name !== "string") {
    throw new Error("registerPreset requires a preset name.");
  }

  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("registerPreset requires a non-empty preset name.");
  }

  if (builtInPresets[normalizedName]) {
    throw new Error(`Preset "${normalizedName}" already exists as a built-in preset.`);
  }

  const normalizedPreset = normalizePreset(normalizedName, preset, "custom");
  customPresets.set(normalizedName, normalizedPreset);
  return normalizedPreset;
}

function unregisterPreset(name) {
  return customPresets.delete(name);
}

function getPreset(name) {
  try {
    return resolvePresetInput(name);
  } catch (error) {
    return null;
  }
}

function hasPreset(name) {
  return Boolean(getPreset(name));
}

function listPresets() {
  return [...collectPresetEntries()].map(([name, preset]) => ({
    name,
    description: preset.description || "",
    keywords: Array.isArray(preset.keywords) ? [...preset.keywords] : [],
    source: preset.source || "built-in",
  }));
}

function suggestPresets(text, options = {}) {
  const normalizedText = normalizeOcrText(text);
  const { limit = 3 } = options;
  const suggestions = [...collectPresetEntries()]
    .map(([name, preset]) => ({
      name,
      description: preset.description || "",
      source: preset.source || "built-in",
      score: scorePresetMatch(preset, normalizedText),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));

  if (!suggestions.length) {
    const fallback = builtInPresets.generic_text;
    return [
      {
        name: "generic_text",
        description: fallback.description || "",
        source: fallback.source || "built-in",
        score: 1,
      },
    ];
  }

  return suggestions.slice(0, Math.max(1, limit));
}

function resolvePresetInput(input) {
  if (typeof input === "string") {
    const preset = builtInPresets[input] || customPresets.get(input);
    if (!preset) {
      throw new Error(
        `Unknown preset "${input}". Available presets: ${listPresets()
          .map((entry) => entry.name)
          .join(", ")}`
      );
    }

    return normalizePreset(input, preset, builtInPresets[input] ? "built-in" : "custom");
  }

  if (typeof input === "function" || (input && typeof input.parse === "function")) {
    return normalizePreset("custom_inline", input, "custom");
  }

  throw new Error("Preset must be a preset name, parser function, or preset object.");
}

function collectPresetEntries() {
  return [
    ...Object.entries(builtInPresets).map(([name, preset]) => [
      name,
      normalizePreset(name, preset, "built-in"),
    ]),
    ...[...customPresets.entries()].map(([name, preset]) => [
      name,
      normalizePreset(name, preset, "custom"),
    ]),
  ];
}

function normalizePreset(name, preset, source) {
  if (typeof preset === "function") {
    return {
      name,
      description: "",
      keywords: [],
      parse: preset,
      source,
      score: null,
    };
  }

  if (!preset || typeof preset.parse !== "function") {
    throw new Error(`Preset "${name}" must expose a parse(text, context) function.`);
  }

  return {
    name,
    description: preset.description || "",
    keywords: Array.isArray(preset.keywords) ? preset.keywords : [],
    parse: preset.parse,
    source: preset.source || source,
    score: typeof preset.score === "function" ? preset.score : null,
  };
}

function scorePresetMatch(preset, text) {
  if (!text) {
    return preset.name === "generic_text" ? 1 : 0;
  }

  if (typeof preset.score === "function") {
    return Math.max(0, preset.score(text));
  }

  if (preset.name === "generic_text") {
    return 1;
  }

  let score = 0;
  for (const keyword of preset.keywords || []) {
    if (new RegExp(escapeRegExp(keyword), "i").test(text)) {
      score += 10;
    }
  }

  return score;
}

function normalizeOcrData(data, options = {}) {
  const { minConfidence = 0, normalizeText: shouldNormalizeText = true } = options;
  const text = shouldNormalizeText ? normalizeOcrText(data.text || "") : String(data.text || "");
  const words = normalizeNodes(data.words).filter((word) => word.confidence >= minConfidence);
  const lines = normalizeNodes(data.lines);
  const paragraphs = normalizeNodes(data.paragraphs);
  const confidenceValues = words.length
    ? words.map((word) => word.confidence)
    : typeof data.confidence === "number"
    ? [data.confidence]
    : [];

  return {
    text,
    words: words.length
      ? words
      : lines.map((line) => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox,
        })),
    lines,
    paragraphs,
    confidence: {
      average: average(confidenceValues),
      min: confidenceValues.length ? Math.min(...confidenceValues) : null,
      max: confidenceValues.length ? Math.max(...confidenceValues) : null,
    },
    counts: {
      characters: text.length,
      words: words.length || countWords(text),
      lines: lines.length || countNonEmptyLines(text),
      paragraphs: paragraphs.length,
    },
  };
}

function normalizeNodes(nodes) {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes
    .map((node) => ({
      text: typeof node.text === "string" ? node.text.trim() : "",
      confidence: typeof node.confidence === "number" ? node.confidence : 0,
      bbox: node.bbox || null,
    }))
    .filter((node) => node.text);
}

function buildTextCounts(text, options = {}) {
  const { words = [], lines = [] } = options;

  return {
    characters: text.length,
    words: Array.isArray(words) && words.length ? words.length : countWords(text),
    lines: Array.isArray(lines) && lines.length ? lines.length : countNonEmptyLines(text),
  };
}

function normalizeOcrText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line, index, lines) => line || (index > 0 && lines[index - 1] !== ""))
    .join("\n")
    .trim();
}

function countWords(text) {
  const matches = normalizeOcrText(text).match(/\b[\p{L}\p{N}][\p{L}\p{N}\-.'@/]*\b/gu);
  return matches ? matches.length : 0;
}

function countNonEmptyLines(text) {
  return normalizeOcrText(text)
    .split("\n")
    .filter(Boolean).length;
}

function average(values) {
  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  createExtractor,
  extractText,
  getPreset,
  hasPreset,
  listPresets,
  parseText,
  registerPreset,
  suggestPresets,
  unregisterPreset,
};

