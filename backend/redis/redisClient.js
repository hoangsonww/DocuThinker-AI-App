const redis = require("redis");

let redisClient;

const initializeRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false,
      },
    });

    await redisClient.connect();

    redisClient.on("connect", () => {
      console.log("Connected to Redis successfully!");
    });

    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    // Test connection
    await redisClient.set("DocuThinker-Redis", "connected");
    console.log("Successfully added key in Redis: DocuThinker-Redis");

    // Add example keys
    await addExampleKeys();
  } catch (err) {
    console.error("Failed to initialize Redis:", err.message);
  }
};

/**
 * Add example keys to Redis
 */
const addExampleKeys = async () => {
  try {
    // Example session data
    const exampleSession = {
      userId: "user123",
      token: "abcdef123456",
      loginTime: new Date().toISOString(),
    };
    await cacheUserSession(exampleSession.userId, exampleSession);

    // Example document metadata
    const exampleDocMetadata = {
      title: "AI Research Paper",
      author: "Jane Doe",
      createdAt: new Date().toISOString(),
      tags: ["AI", "Machine Learning", "Research"],
    };
    await cacheDocumentMetadata("doc123", exampleDocMetadata);

    // Example query results
    const exampleQueryResults = [
      { docId: "doc123", title: "AI Research Paper" },
      { docId: "doc456", title: "Blockchain Basics" },
    ];
    await cacheQueryResults("user123:search:AI", exampleQueryResults);

    // Example recently viewed documents
    await cacheRecentlyViewedDocument("user123", "doc123");
    await cacheRecentlyViewedDocument("user123", "doc456");

    console.log("Example keys added to Redis.");
  } catch (err) {
    console.error("Error adding example keys:", err);
  }
};

// Cache utility functions

/**
 * Cache user session data
 * @param {string} userId - User ID
 * @param {object} sessionData - Session-related information
 * @param {number} ttl - Time to live in seconds
 */
const cacheUserSession = async (userId, sessionData, ttl = 3600) => {
  try {
    const key = `user:session:${userId}`;
    await redisClient.set(key, JSON.stringify(sessionData), {
      EX: ttl,
    });
    console.log(`Cached session for user ${userId}`);
  } catch (err) {
    console.error("Error caching user session:", err);
  }
};

/**
 * Cache document metadata
 * @param {string} docId - Document ID
 * @param {object} metadata - Document metadata
 * @param {number} ttl - Time to live in seconds
 */
const cacheDocumentMetadata = async (docId, metadata, ttl = 3600) => {
  try {
    const key = `document:metadata:${docId}`;
    await redisClient.set(key, JSON.stringify(metadata), {
      EX: ttl,
    });
    console.log(`Cached metadata for document ${docId}`);
  } catch (err) {
    console.error("Error caching document metadata:", err);
  }
};

/**
 * Cache query results
 * @param {string} queryKey - Unique key for the query
 * @param {object} results - Query results
 * @param {number} ttl - Time to live in seconds
 */
const cacheQueryResults = async (queryKey, results, ttl = 600) => {
  try {
    const key = `query:results:${queryKey}`;
    await redisClient.set(key, JSON.stringify(results), {
      EX: ttl,
    });
    console.log(`Cached results for query ${queryKey}`);
  } catch (err) {
    console.error("Error caching query results:", err);
  }
};

/**
 * Cache recently viewed documents
 * @param {string} userId - User ID
 * @param {string} docId - Document ID
 * @param {number} ttl - Time to live in seconds
 */
const cacheRecentlyViewedDocument = async (userId, docId, ttl = 3600) => {
  try {
    const key = `user:recently_viewed:${userId}`;
    await redisClient.lPush(key, docId);
    await redisClient.expire(key, ttl); // Set TTL for the list
    console.log(`Cached recently viewed document ${docId} for user ${userId}`);
  } catch (err) {
    console.error("Error caching recently viewed document:", err);
  }
};

/**
 * Invalidate a specific cache key
 * @param {string} key - Cache key to invalidate
 */
const invalidateCache = async (key) => {
  try {
    await redisClient.del(key);
    console.log(`Invalidated cache for key ${key}`);
  } catch (err) {
    console.error("Error invalidating cache:", err);
  }
};

/**
 * Fetch data from cache
 * @param {string} key - Cache key
 * @returns {object|null} - Parsed data or null if not found
 */
const fetchFromCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Error fetching data from cache:", err);
    return null;
  }
};

module.exports = {
  redisClient,
  initializeRedis,
  cacheUserSession,
  cacheDocumentMetadata,
  cacheQueryResults,
  cacheRecentlyViewedDocument,
  invalidateCache,
  fetchFromCache,
};
