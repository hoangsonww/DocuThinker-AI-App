/**
 * Classifies the given document text into a predefined category.
 * @param {string} text - The document text to classify.
 * @returns {string} - The predicted category for the text.
 */
const classifyDocument = (text) => {
  // Define keywords for each category (basic example)
  const categories = {
    Technology: [
      "computer",
      "software",
      "internet",
      "tech",
      "ai",
      "programming",
      "coding",
    ],
    Sports: [
      "football",
      "soccer",
      "basketball",
      "baseball",
      "cricket",
      "game",
      "score",
    ],
    Health: [
      "medicine",
      "doctor",
      "health",
      "fitness",
      "disease",
      "hospital",
      "therapy",
    ],
    Finance: [
      "investment",
      "market",
      "finance",
      "bank",
      "money",
      "economy",
      "trading",
    ],
    Education: [
      "school",
      "education",
      "student",
      "teacher",
      "university",
      "class",
      "learning",
    ],
    Travel: [
      "travel",
      "destination",
      "vacation",
      "tourism",
      "hotel",
      "flight",
      "adventure",
    ],
    Food: [
      "food",
      "restaurant",
      "recipe",
      "cooking",
      "cuisine",
      "meal",
      "taste",
    ],
    Entertainment: [
      "movie",
      "music",
      "entertainment",
      "show",
      "artist",
      "performance",
      "celebrity",
    ],
    Science: [
      "science",
      "research",
      "experiment",
      "discovery",
      "scientist",
      "theory",
      "lab",
    ],
    Economy: [
      "economy",
      "business",
      "industry",
      "growth",
      "company",
      "market",
      "trade",
    ],
    Politics: [
      "politics",
      "government",
      "election",
      "policy",
      "democracy",
      "vote",
      "leader",
    ],
    Environment: [
      "environment",
      "climate",
      "planet",
      "nature",
      "ecology",
      "sustainability",
      "green",
    ],
  };

  // Convert the text to lowercase for comparison
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/);

  // Calculate category scores based on keyword matches
  const scores = {};

  Object.keys(categories).forEach((category) => {
    scores[category] = words.filter((word) =>
      categories[category].includes(word),
    ).length;
  });

  // Determine the category with the highest score
  const predictedCategory = Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b,
  );

  return predictedCategory;
};

module.exports = { classifyDocument };
