const { extractText, listPresets } = require("./index");

async function main() {
  const imagePath = process.argv[2];
  const preset = process.argv[3] || "generic_text";

  if (!imagePath) {
    console.error("Usage: node example.js <image-path> [preset]");
    console.error(
      `Available presets: ${listPresets()
        .map((entry) => entry.name)
        .join(", ")}`
    );
    process.exit(1);
  }

  const result = await extractText(imagePath, {
    preset,
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        console.log(`OCR progress: ${Math.round(message.progress * 100)}%`);
      }
    },
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
