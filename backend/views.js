// Helper: Send success response
exports.sendSuccessResponse = (res, statusCode, message, data) => {
  res.status(statusCode).json({
    message,
    ...data,
  });
};

// Helper: Send error response
exports.sendErrorResponse = (res, statusCode, message, details = "") => {
  res.status(statusCode).json({
    error: message,
    details,
  });
};
