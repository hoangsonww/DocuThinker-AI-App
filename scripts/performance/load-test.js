import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiTrend = new Trend('api_duration');
const requestCounter = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],  // 95% of requests should be below 500ms
    'errors': ['rate<0.05'],                            // Error rate should be below 5%
    'http_req_failed': ['rate<0.05'],                   // Failed requests should be below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://docuthinker.com';

// Test scenarios
export default function () {
  group('Home Page', () => {
    const res = http.get(`${BASE_URL}`);
    check(res, {
      'home page status is 200': (r) => r.status === 200,
      'home page load time < 2s': (r) => r.timings.duration < 2000,
    });
    errorRate.add(res.status !== 200);
    requestCounter.add(1);
    sleep(1);
  });

  group('API Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });
    apiTrend.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    requestCounter.add(1);
    sleep(0.5);
  });

  group('Document Upload Simulation', () => {
    // Prepare test data
    const payload = JSON.stringify({
      title: `Test Document ${Date.now()}`,
      content: 'This is a test document for load testing',
      type: 'text',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(`${BASE_URL}/api/documents`, payload, params);

    check(res, {
      'document upload status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'document upload time < 1s': (r) => r.timings.duration < 1000,
      'response has document id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    apiTrend.add(res.timings.duration);
    errorRate.add(res.status !== 200 && res.status !== 201);
    requestCounter.add(1);
    sleep(2);
  });

  group('Document List', () => {
    const res = http.get(`${BASE_URL}/api/documents`);

    check(res, {
      'document list status is 200': (r) => r.status === 200,
      'document list load time < 500ms': (r) => r.timings.duration < 500,
      'response is array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) || Array.isArray(body.documents);
        } catch (e) {
          return false;
        }
      },
    });

    apiTrend.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    requestCounter.add(1);
    sleep(1);
  });

  group('AI Processing Simulation', () => {
    const payload = JSON.stringify({
      text: 'Analyze this sample text for sentiment and key points.',
      operation: 'analyze',
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(`${BASE_URL}/api/ai/process`, payload, params);

    check(res, {
      'AI processing status is 200': (r) => r.status === 200,
      'AI processing time < 3s': (r) => r.timings.duration < 3000,
      'response has analysis': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.analysis !== undefined || body.result !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    apiTrend.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    requestCounter.add(1);
    sleep(3);
  });
}

// Setup function (runs once at start)
export function setup() {
  console.log('Starting load test...');
  console.log(`Target URL: ${BASE_URL}`);
  return { startTime: Date.now() };
}

// Teardown function (runs once at end)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${duration} seconds`);
}
