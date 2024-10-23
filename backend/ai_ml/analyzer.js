const Sentiment = require('sentiment');
const sentiment = new Sentiment();

/**
 * Analyzes the text for sentiment and extracts keywords.
 * @param {string} text - The input text to analyze.
 * @returns {object} - An object containing sentiment and keywords.
 */
const analyzeText = (text) => {
  // Perform sentiment analysis using the 'sentiment' package
  const sentimentResult = sentiment.analyze(text);

  // Extract keywords by filtering words based on length and excluding common stopwords
  const stopwords = ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'these', 'those', 'there'];
  const keywords = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4 && !stopwords.includes(word));

  return {
    sentiment: sentimentResult,
    keywords,
  };
};

module.exports = { analyzeText };
