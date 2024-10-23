const { summarizeText } = require("./summarizer");
const { analyzeText } = require("./analyzer");
const readline = require("readline");

// Create readline interface to simulate chat-like interaction in the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Main function to interact with the user and process their input.
 */
const startChat = () => {
  console.log("Welcome to the AI Text Summarizer & Analyzer!");
  console.log("Type your text and press enter to summarize and analyze it.");
  console.log("Type 'exit' to quit the program.");

  rl.on("line", (input) => {
    if (input.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
    } else {
      // Summarize and analyze the user's input
      const summary = summarizeText(input);
      const analysis = analyzeText(input);

      console.log("\n--- Summary ---");
      console.log(summary);

      console.log("\n--- Analysis ---");
      console.log(`Sentiment Score: ${analysis.sentiment.score}`);
      console.log(`Keywords: ${analysis.keywords.join(", ")}`);
      console.log("\n");

      console.log("Enter more text or type 'exit' to quit:");
    }
  });
};

// Start the chat interaction
startChat();
