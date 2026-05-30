// Advanced K6 Load Testing Scenarios for DocuThinker
// Comprehensive performance, stress, and spike testing

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const apiLatency = new Trend("api_latency");
const requestCount = new Counter("request_count");

// Configuration
const BASE_URL = __ENV.BASE_URL || "https://api.docuthinker.example.com";
const THINK_TIME = 1;

// Test scenarios
export const options = {
  scenarios: {
    // 1. Baseline test - establish normal performance
    baseline: {
      executor: "constant-vus",
      vus: 10,
      duration: "5m",
      startTime: "0s",
      gracefulStop: "30s",
      tags: { test_type: "baseline" },
    },

    // 2. Load test - sustained load
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 50 }, // Ramp up
        { duration: "10m", target: 50 }, // Sustain
        { duration: "2m", target: 0 }, // Ramp down
      ],
      startTime: "6m",
      gracefulStop: "30s",
      tags: { test_type: "load" },
    },

    // 3. Stress test - find breaking point
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 100 },
        { duration: "5m", target: 100 },
        { duration: "2m", target: 200 },
        { duration: "5m", target: 200 },
        { duration: "2m", target: 300 },
        { duration: "5m", target: 300 },
        { duration: "5m", target: 0 },
      ],
      startTime: "20m",
      gracefulStop: "30s",
      tags: { test_type: "stress" },
    },

    // 4. Spike test - sudden traffic surge
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 500 }, // Spike
        { duration: "1m", target: 500 }, // Sustain spike
        { duration: "10s", target: 0 }, // Drop
      ],
      startTime: "50m",
      gracefulStop: "30s",
      tags: { test_type: "spike" },
    },

    // 5. Soak test - extended duration
    soak: {
      executor: "constant-vus",
      vus: 50,
      duration: "2h",
      startTime: "55m",
      gracefulStop: "30s",
      tags: { test_type: "soak" },
    },

    // 6. Breakpoint test - gradually increase until failure
    breakpoint: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs: 500,
      maxVUs: 1000,
      stages: [
        { duration: "2m", target: 10 },
        { duration: "5m", target: 50 },
        { duration: "5m", target: 100 },
        { duration: "5m", target: 200 },
        { duration: "5m", target: 500 },
      ],
      startTime: "3h",
      tags: { test_type: "breakpoint" },
    },
  },

  // Thresholds - SLA requirements
  thresholds: {
    // 95% of requests must complete within 500ms
    http_req_duration: ["p(95)<500"],

    // 99% of requests must complete within 1s
    "http_req_duration{test_type:baseline}": ["p(99)<1000"],

    // Error rate must be below 1%
    errors: ["rate<0.01"],

    // 95% of requests must succeed
    http_req_failed: ["rate<0.05"],
  },

  // Additional configuration
  noConnectionReuse: false,
  userAgent: "K6LoadTest/1.0",
};

// Simulated user authentication
function authenticate() {
  const authPayload = JSON.stringify({
    username: "testuser",
    password: "testpass123",
  });

  const authRes = http.post(`${BASE_URL}/api/auth/login`, authPayload, {
    headers: { "Content-Type": "application/json" },
  });

  check(authRes, {
    "authentication successful": (r) => r.status === 200,
    "received auth token": (r) => r.json("token") !== undefined,
  });

  return authRes.json("token");
}

// Main test scenario
export default function () {
  const token = authenticate();

  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Test group: Document operations
  group("document_operations", () => {
    // Create document
    group("create_document", () => {
      const createPayload = JSON.stringify({
        title: "Test Document",
        content: "Lorem ipsum dolor sit amet...",
        tags: ["test", "automation"],
      });

      const startTime = Date.now();
      const createRes = http.post(`${BASE_URL}/api/documents`, createPayload, {
        headers,
      });
      const duration = Date.now() - startTime;

      apiLatency.add(duration);
      requestCount.add(1);

      const success = check(createRes, {
        "document created": (r) => r.status === 201,
        "has document ID": (r) => r.json("id") !== undefined,
      });

      errorRate.add(!success);

      if (createRes.status === 201) {
        const docId = createRes.json("id");
        sleep(THINK_TIME);

        // Retrieve document
        group("get_document", () => {
          const getRes = http.get(`${BASE_URL}/api/documents/${docId}`, {
            headers,
          });

          check(getRes, {
            "document retrieved": (r) => r.status === 200,
            "correct document": (r) => r.json("id") === docId,
          });

          requestCount.add(1);
        });

        sleep(THINK_TIME);

        // Update document
        group("update_document", () => {
          const updatePayload = JSON.stringify({
            title: "Updated Test Document",
            content: "Updated content...",
          });

          const updateRes = http.put(
            `${BASE_URL}/api/documents/${docId}`,
            updatePayload,
            { headers },
          );

          check(updateRes, {
            "document updated": (r) => r.status === 200,
          });

          requestCount.add(1);
        });

        sleep(THINK_TIME);

        // Search documents
        group("search_documents", () => {
          const searchRes = http.get(
            `${BASE_URL}/api/documents/search?q=test`,
            { headers },
          );

          check(searchRes, {
            "search successful": (r) => r.status === 200,
            "has results": (r) => r.json("results").length > 0,
          });

          requestCount.add(1);
        });

        sleep(THINK_TIME);

        // Delete document
        group("delete_document", () => {
          const deleteRes = http.del(
            `${BASE_URL}/api/documents/${docId}`,
            null,
            { headers },
          );

          check(deleteRes, {
            "document deleted": (r) => r.status === 204,
          });

          requestCount.add(1);
        });
      }
    });
  });

  // Test group: AI operations
  group("ai_operations", () => {
    const aiPayload = JSON.stringify({
      text: "Analyze this document content",
      operation: "summarize",
    });

    const aiRes = http.post(`${BASE_URL}/api/ai/analyze`, aiPayload, {
      headers,
    });

    check(aiRes, {
      "AI analysis successful": (r) => r.status === 200,
      "has analysis result": (r) => r.json("result") !== undefined,
    });

    requestCount.add(1);
  });

  // Test group: Batch operations
  group("batch_operations", () => {
    const batchPayload = JSON.stringify({
      documents: [
        { title: "Doc 1", content: "Content 1" },
        { title: "Doc 2", content: "Content 2" },
        { title: "Doc 3", content: "Content 3" },
      ],
    });

    const batchRes = http.post(
      `${BASE_URL}/api/documents/batch`,
      batchPayload,
      { headers },
    );

    check(batchRes, {
      "batch creation successful": (r) => r.status === 201,
      "created all documents": (r) => r.json("created").length === 3,
    });

    requestCount.add(1);
  });

  sleep(THINK_TIME);
}

// Setup function - runs once per VU
export function setup() {
  console.log("Starting load test against:", BASE_URL);

  // Warmup request
  const warmupRes = http.get(`${BASE_URL}/health`);
  check(warmupRes, {
    "API is healthy": (r) => r.status === 200,
  });

  return { startTime: Date.now() };
}

// Teardown function - runs once after all VUs finish
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Test completed in ${duration}s`);
}

// Handle summary - custom summary output
export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "summary.json": JSON.stringify(data),
    "summary.html": htmlReport(data),
  };
}

function textSummary(data, options) {
  let summary = "\n=== Load Test Summary ===\n\n";

  for (const [name, value] of Object.entries(data.metrics)) {
    summary += `${name}: ${JSON.stringify(value)}\n`;
  }

  return summary;
}

function htmlReport(data) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>K6 Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
  </style>
</head>
<body>
  <h1>K6 Load Test Report</h1>
  <pre>${JSON.stringify(data, null, 2)}</pre>
</body>
</html>`;
}
