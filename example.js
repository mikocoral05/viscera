const { extractText } = require("./index");

(async () => {
  const imagePath =
    "C:/Users/ASUS/Downloads/3e8684e5-ed1b-422a-a507-d4575a7344ca.jpg";

  const result = await extractText(imagePath, {
    preset: "mobile_receipt", // 🟢 Set this to match the type of image
  });

  console.log("Full Text:", result.text);
  console.log("Confidence Average:", result.confidenceAvg);
  console.log("Words:", result.words);
  console.log("Parsed Output:", result.parsed); // 🆕 Structured data here
})();
