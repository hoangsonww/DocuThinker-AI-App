// Representative content so every screen renders fully without a live
// backend session. Real network calls (auth, chat) still hit lib/api.

export const sampleUser = {
  name: "Alex Carter",
  email: "alex.carter@docuthinker.ai",
  initials: "AC",
  plan: "Pro",
  joinedDaysAgo: 128,
  documentsAnalyzed: 23,
  wordsProcessed: "412K",
};

export type DocItem = {
  id: string;
  title: string;
  summary: string;
  pages: number;
  words: number;
  date: string;
  category: string;
};

export const sampleDocuments: DocItem[] = [
  {
    id: "1",
    title: "Q3 Market Research Report",
    summary:
      "Consumer demand shifted toward sustainable products, with a 24% rise in eco-conscious purchases across three core regions.",
    pages: 42,
    words: 18540,
    date: "May 14, 2026",
    category: "Business",
  },
  {
    id: "2",
    title: "Climate Resilience White Paper",
    summary:
      "A framework for coastal cities to adapt infrastructure to rising sea levels over the next two decades.",
    pages: 28,
    words: 11200,
    date: "May 9, 2026",
    category: "Research",
  },
  {
    id: "3",
    title: "Series B Investor Memo",
    summary:
      "Outlines a path to profitability, unit economics, and the rationale behind a $40M raise to scale operations.",
    pages: 16,
    words: 6730,
    date: "May 3, 2026",
    category: "Finance",
  },
  {
    id: "4",
    title: "Employee Handbook 2026",
    summary:
      "Updated remote-work policy, revised leave structure, and a new performance-review cadence for all teams.",
    pages: 64,
    words: 24100,
    date: "Apr 27, 2026",
    category: "HR",
  },
  {
    id: "5",
    title: "Neural Search Architecture",
    summary:
      "Technical deep dive into a hybrid retrieval system combining vector embeddings with keyword ranking.",
    pages: 22,
    words: 9400,
    date: "Apr 21, 2026",
    category: "Engineering",
  },
];

export const sampleAnalysis = {
  title: "Q3 Market Research Report",
  readingTime: "12 min read",
  summary:
    "This report examines consumer behaviour across three core markets during the third quarter. The headline finding is a decisive shift toward sustainable products: eco-conscious purchases rose 24% year over year, outpacing every other category. Price sensitivity remained high, but shoppers consistently rewarded brands that paired transparent sourcing with clear environmental claims. The data suggests that sustainability has moved from a niche preference to a mainstream purchasing driver, and that companies slow to adapt risk measurable share loss over the coming year.",
  keyIdeas: [
    {
      title: "Sustainability is now mainstream",
      detail:
        "Eco-conscious purchases grew 24% YoY and are no longer concentrated in premium segments.",
    },
    {
      title: "Transparency builds trust",
      detail:
        "Brands disclosing sourcing data saw 1.8x higher repeat-purchase rates than those that did not.",
    },
    {
      title: "Price sensitivity persists",
      detail:
        "Customers will pay a modest green premium, but abandon carts when it exceeds roughly 12%.",
    },
    {
      title: "Regional nuance matters",
      detail:
        "Messaging that worked in urban markets underperformed by 30% in suburban regions.",
    },
  ],
  discussionPoints: [
    "How should pricing strategy balance a green premium against persistent price sensitivity?",
    "Which sourcing metrics are most credible to disclose, and how often should they be updated?",
    "What regional messaging tests should run before the Q4 campaign launch?",
    "Where are the biggest risks if competitors adopt sustainability claims first?",
  ],
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export const sampleChat: ChatMessage[] = [
  {
    id: "c1",
    role: "assistant",
    text: "Hi! I've read the Q3 Market Research Report. Ask me anything about it.",
  },
  {
    id: "c2",
    role: "user",
    text: "What was the biggest change this quarter?",
  },
  {
    id: "c3",
    role: "assistant",
    text: "The standout shift was a 24% year-over-year increase in eco-conscious purchases. Sustainability moved from a niche preference into a mainstream purchasing driver across all three core regions.",
  },
  {
    id: "c4",
    role: "user",
    text: "Should we worry about pricing?",
  },
  {
    id: "c5",
    role: "assistant",
    text: "Somewhat. Shoppers accept a green premium, but the report shows cart abandonment climbs sharply once it passes about 12%. Keep the premium modest and pair it with transparent sourcing.",
  },
];

export const homeFeatures = [
  {
    icon: "document-text-outline",
    title: "Smart Summary",
    text: "Turn long documents into a clear, concise overview.",
  },
  {
    icon: "bulb-outline",
    title: "Key Ideas",
    text: "Surface the points that actually matter.",
  },
  {
    icon: "chatbubbles-outline",
    title: "Chat",
    text: "Ask follow-up questions and dig deeper.",
  },
  {
    icon: "people-outline",
    title: "Discussion Points",
    text: "Get prompts ready for your next meeting.",
  },
] as const;
