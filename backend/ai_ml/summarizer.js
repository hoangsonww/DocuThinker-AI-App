/**
 * Summarizes the given text by selecting sentences with the highest word frequencies.
 * @param {string} text - The input text to summarize.
 * @returns {string} - A summarized version of the text.
 */
const summarizeText = (text) => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0) return text;

  const wordFrequency = {};

  // Calculate word frequencies
  sentences.forEach(sentence => {
    const words = sentence
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/);

    words.forEach(word => {
      if (word.length > 3) { // Only consider words longer than 3 characters
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
  });

  // Rank sentences by summing the frequency of significant words
  const rankedSentences = sentences.map(sentence => {
    const words = sentence.toLowerCase().split(/\s+/);
    const sentenceScore = words.reduce((acc, word) => acc + (wordFrequency[word] || 0), 0);
    return { sentence, score: sentenceScore };
  });

  // Sort sentences by score in descending order and pick the top 3 sentences
  const topSentences = rankedSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.sentence);

  return topSentences.join(' ');
};

module.exports = { summarizeText };
