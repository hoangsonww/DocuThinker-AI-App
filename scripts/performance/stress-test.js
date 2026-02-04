import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 200 }, // Ramp up to 200 users
    { duration: "2m", target: 300 }, // Ramp up to 300 users
    { duration: "5m", target: 300 }, // Stay at 300 users
    { duration: "2m", target: 400 }, // Spike to 400 users
    { duration: "5m", target: 400 }, // Stay at 400 users
    { duration: "5m", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(99)<2000"],
    http_req_failed: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://docuthinker.com";

export default function () {
  const responses = http.batch([
    ["GET", `${BASE_URL}`],
    ["GET", `${BASE_URL}/api/health`],
    ["GET", `${BASE_URL}/api/documents`],
  ]);

  check(responses[0], {
    "home page status is 200": (r) => r.status === 200,
  });

  check(responses[1], {
    "health check status is 200": (r) => r.status === 200,
  });

  check(responses[2], {
    "documents API status is 200": (r) => r.status === 200,
  });

  sleep(1);
}
