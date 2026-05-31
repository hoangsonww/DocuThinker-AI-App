/**
 * Helper: Send success response
 * @param res - Response object
 * @param statusCode - HTTP status code
 * @param message - Success message
 * @param data - Data to send
 */
exports.sendSuccessResponse = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    message,
    ...data,
  });
};

/**
 * Helper: Send error response
 * @param res - Response object
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param details - Error details
 */
exports.sendErrorResponse = (res, statusCode, message, details = "") => {
  // Always log the full error server-side so it shows up in Vercel logs, even
  // when the client only receives a short string.
  const isErr = details instanceof Error;
  console.error(`[ERROR ${statusCode}] ${message}`, {
    details: isErr
      ? {
          name: details.name,
          message: details.message,
          code: details.code,
          stack: details.stack,
          responseData: details.response && details.response.data,
        }
      : details,
  });

  // Make sure the client never receives a blank `details`.
  let detailText = "";
  if (isErr) {
    detailText =
      details.message || details.toString() || details.name || "Unknown error";
  } else if (details && typeof details === "object") {
    detailText = JSON.stringify(details);
  } else {
    detailText = details || "Unknown error";
  }

  res.status(statusCode).json({
    error: message,
    details: detailText,
  });
};
