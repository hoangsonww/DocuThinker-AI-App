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
  res.status(statusCode).json({
    error: message,
    details,
  });
};
