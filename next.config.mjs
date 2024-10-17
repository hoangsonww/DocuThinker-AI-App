// next.config.mjs

const nextConfig = {
  reactStrictMode: true, // Strict mode for catching potential problems in React

  // Environment variables
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    BASE_URL: process.env.BASE_URL,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },

  // Custom headers for API routes, including CORS settings
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
        ],
      },
    ];
  },

  // Enable image domains if needed for external image sources
  images: {
    domains: ["example.com"],
  },

  // Optional: Custom Webpack configuration
  webpack(config) {
    // Modify the Webpack config if needed
    return config;
  },
};

export default nextConfig;
