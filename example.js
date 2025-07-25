const { extractText } = require("./index");

(async () => {
  const imagePath = "./sample.png"; // Replace with your image file
  const result = await extractText(imagePath);

  console.log("Full Text:", result.text);
  console.log("Confidence Average:", result.confidenceAvg);
  console.log("Words:", result.words);
})();
