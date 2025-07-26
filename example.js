const { extractText } = require("./index");

(async () => {
  const imagePath =
    "C:/Users/ASUS/Downloads/3e8684e5-ed1b-422a-a507-d4575a7344ca.jpg"; // Replace with your image file
  const result = await extractText(imagePath);

  console.log("Full Text:", result.text);
  console.log("Confidence Average:", result.confidenceAvg);
  console.log("Words:", result.words);
})();
