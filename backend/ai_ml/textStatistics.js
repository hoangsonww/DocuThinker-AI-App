/**
 * Calculates various statistical measures for the given text.
 * @param {string} text - The document text to analyze.
 * @returns {object} - An object containing various statistical measures.
 */
const getTextStatistics = (text) => {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const sentenceCount = (text.match(/[^.!?]+[.!?]+/g) || []).length;
  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;

  // Calculate the Flesch-Kincaid Readability Score (approximation)
  const syllableCount = words.reduce((count, word) => count + countSyllables(word), 0);
  const fleschKincaidScore = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);

  return {
    wordCount,
    sentenceCount,
    averageWordLength,
    fleschKincaidScore: parseFloat(fleschKincaidScore.toFixed(2))
  };
};

/**
 * Counts the syllables in a given word (simple approximation).
 * @param {string} word - The word to count syllables for.
 * @returns {number} - The number of syllables in the word.
 */
const countSyllables = (word) => {
  word = word.toLowerCase();
  if (word.length <= 3) return 1; // Basic rule: words with 3 or fewer letters have 1 syllable
  const vowels = 'aeiouy';
  let syllableCount = 0;
  let previousIsVowel = false;

  for (let i = 0; i < word.length; i++) {
    const currentIsVowel = vowels.includes(word[i]);
    if (currentIsVowel && !previousIsVowel) {
      syllableCount++;
    }
    previousIsVowel = currentIsVowel;
  }

  // Subtract silent 'e' at the end of words like 'cake' or 'bike'
  if (word.endsWith('e')) {
    syllableCount--;
  }

  return Math.max(1, syllableCount);
};

module.exports = { getTextStatistics };
