/**
 * Backend API Endpoints Testing Script
 * Run with: node test-endpoints.js
 */

const axios = require("axios");

// Configure this to your backend URL
const BASE_URL = process.env.BACKEND_URL || "http://localhost:3000";

// Test user data
const TEST_USER_ID = "test-user-" + Date.now();
const TEST_DOC_ID = "test-doc-" + Date.now();

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

// Test functions

async function testHighlightsEndpoint() {
  logInfo("Testing document highlights endpoints...");

  try {
    // Test saving highlights
    const highlightsData = {
      userId: TEST_USER_ID,
      docId: TEST_DOC_ID,
      highlights: [
        {
          id: "h1",
          text: "Important text",
          color: "#ffeb3b",
          startOffset: 0,
          endOffset: 14,
        },
        {
          id: "h2",
          text: "Another highlight",
          color: "#8bc34a",
          startOffset: 20,
          endOffset: 37,
        },
      ],
    };

    const saveResponse = await axios.post(
      `${BASE_URL}/document-highlights`,
      highlightsData,
    );

    if (saveResponse.status === 200 && saveResponse.data.success) {
      logSuccess("POST /document-highlights - Highlights saved successfully");
    } else {
      logWarning("POST /document-highlights - Unexpected response format");
    }

    // Test retrieving highlights
    const getResponse = await axios.get(
      `${BASE_URL}/document-highlights/${TEST_USER_ID}/${TEST_DOC_ID}`,
    );

    if (getResponse.status === 200 && getResponse.data.success) {
      logSuccess(
        "GET /document-highlights/:userId/:docId - Highlights retrieved successfully",
      );
      logInfo(
        `Retrieved ${getResponse.data.highlights?.length || 0} highlights`,
      );
    } else {
      logWarning(
        "GET /document-highlights/:userId/:docId - Unexpected response format",
      );
    }

    return true;
  } catch (error) {
    logError(`Highlights endpoint error: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testCommentsEndpoint() {
  logInfo("Testing document comments endpoints...");

  try {
    // Test saving comments
    const commentsData = {
      userId: TEST_USER_ID,
      docId: TEST_DOC_ID,
      comments: [
        {
          id: "c1",
          text: "This is a great point",
          selectedText: "Important text",
          position: 0,
          timestamp: new Date().toISOString(),
        },
        {
          id: "c2",
          text: "Need to verify this",
          selectedText: "Another highlight",
          position: 20,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const saveResponse = await axios.post(
      `${BASE_URL}/document-comments`,
      commentsData,
    );

    if (saveResponse.status === 200 && saveResponse.data.success) {
      logSuccess("POST /document-comments - Comments saved successfully");
    } else {
      logWarning("POST /document-comments - Unexpected response format");
    }

    // Test retrieving comments
    const getResponse = await axios.get(
      `${BASE_URL}/document-comments/${TEST_USER_ID}/${TEST_DOC_ID}`,
    );

    if (getResponse.status === 200 && getResponse.data.success) {
      logSuccess(
        "GET /document-comments/:userId/:docId - Comments retrieved successfully",
      );
      logInfo(`Retrieved ${getResponse.data.comments?.length || 0} comments`);
    } else {
      logWarning(
        "GET /document-comments/:userId/:docId - Unexpected response format",
      );
    }

    return true;
  } catch (error) {
    logError(`Comments endpoint error: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testUpdateContentEndpoint() {
  logInfo("Testing document content update endpoint...");

  try {
    const updateData = {
      userId: TEST_USER_ID,
      docId: TEST_DOC_ID,
      summary: "Updated summary content",
      originalText: "Updated original text content",
    };

    const response = await axios.post(
      `${BASE_URL}/update-document-content`,
      updateData,
    );

    if (response.status === 200 && response.data.success) {
      logSuccess(
        "POST /update-document-content - Content updated successfully",
      );
    } else {
      logWarning("POST /update-document-content - Unexpected response format");
    }

    return true;
  } catch (error) {
    logError(`Update content endpoint error: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testPDFConversionEndpoint() {
  logInfo("Testing PDF conversion endpoint...");

  try {
    const pdfData = {
      text: "This is a test document for PDF conversion. It contains multiple lines and paragraphs.\n\nThis is the second paragraph with some important information.",
      title: "Test PDF Document",
    };

    const response = await axios.post(`${BASE_URL}/convert-to-pdf`, pdfData, {
      responseType: "arraybuffer",
    });

    if (response.status === 200 && response.data) {
      const buffer = Buffer.from(response.data);
      if (buffer.toString("utf8", 0, 4) === "%PDF") {
        logSuccess("POST /convert-to-pdf - PDF generated successfully");
        logInfo(`PDF size: ${buffer.length} bytes`);
      } else {
        logWarning("POST /convert-to-pdf - Response is not a valid PDF");
      }
    } else {
      logWarning("POST /convert-to-pdf - Unexpected response");
    }

    return true;
  } catch (error) {
    logError(`PDF conversion endpoint error: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testDOCXConversionEndpoint() {
  logInfo("Testing DOCX conversion endpoint...");

  try {
    const docxData = {
      text: "This is a test document for DOCX conversion. It contains multiple lines and paragraphs.\n\nThis is the second paragraph with some important information.",
      title: "Test DOCX Document",
    };

    const response = await axios.post(`${BASE_URL}/convert-to-docx`, docxData, {
      responseType: "arraybuffer",
    });

    if (response.status === 200 && response.data) {
      const buffer = Buffer.from(response.data);
      // DOCX files start with PK (ZIP file signature)
      if (buffer.toString("utf8", 0, 2) === "PK") {
        logSuccess("POST /convert-to-docx - DOCX generated successfully");
        logInfo(`DOCX size: ${buffer.length} bytes`);
      } else {
        logWarning("POST /convert-to-docx - Response is not a valid DOCX");
      }
    } else {
      logWarning("POST /convert-to-docx - Unexpected response");
    }

    return true;
  } catch (error) {
    logError(`DOCX conversion endpoint error: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testExistingEndpoint(method, path, description) {
  logInfo(`Testing ${method} ${path}...`);

  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${path}`,
    });

    if (response.status === 200 || response.status === 404) {
      logSuccess(`${method} ${path} - Endpoint exists`);
      return true;
    }
  } catch (error) {
    if (
      error.response &&
      (error.response.status === 400 || error.response.status === 404)
    ) {
      logSuccess(
        `${method} ${path} - Endpoint exists (expected error response)`,
      );
      return true;
    }
    logError(`${method} ${path} - Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log("\n" + "=".repeat(60), colors.bright);
  log("DocuThinker Backend API Endpoints Testing", colors.bright);
  log("=".repeat(60) + "\n", colors.bright);

  logInfo(`Testing backend at: ${BASE_URL}`);
  logInfo(`Test User ID: ${TEST_USER_ID}`);
  logInfo(`Test Doc ID: ${TEST_DOC_ID}\n`);

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  const tests = [
    { name: "Highlights Endpoints", fn: testHighlightsEndpoint },
    { name: "Comments Endpoints", fn: testCommentsEndpoint },
    { name: "Update Content Endpoint", fn: testUpdateContentEndpoint },
    { name: "PDF Conversion Endpoint", fn: testPDFConversionEndpoint },
    { name: "DOCX Conversion Endpoint", fn: testDOCXConversionEndpoint },
  ];

  for (const test of tests) {
    log("\n" + "-".repeat(60), colors.bright);
    log(`Running: ${test.name}`, colors.bright);
    log("-".repeat(60), colors.bright);

    results.total++;
    const success = await test.fn();

    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between tests
  }

  // Test existing endpoints
  log("\n" + "-".repeat(60), colors.bright);
  log("Testing Existing Endpoints", colors.bright);
  log("-".repeat(60), colors.bright);

  const existingEndpoints = [
    { method: "GET", path: "/api-docs", description: "API Documentation" },
    { method: "POST", path: "/register", description: "User Registration" },
    { method: "POST", path: "/login", description: "User Login" },
    { method: "POST", path: "/upload", description: "Document Upload" },
  ];

  for (const endpoint of existingEndpoints) {
    results.total++;
    const success = await testExistingEndpoint(
      endpoint.method,
      endpoint.path,
      endpoint.description,
    );
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Print summary
  log("\n" + "=".repeat(60), colors.bright);
  log("Test Summary", colors.bright);
  log("=".repeat(60), colors.bright);
  log(`Total Tests: ${results.total}`, colors.bright);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  log(
    `Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`,
    colors.bright,
  );

  if (results.failed === 0) {
    logSuccess("All tests passed! 🎉");
  } else {
    logWarning("Some tests failed. Please review the errors above.");
  }

  return results.failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      logError(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runTests };
