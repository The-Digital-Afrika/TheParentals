// Helper for error responses
const sendError = (res, status, message) => {
  res.status(status).json({ success: false, error: message });
};

module.exports = { sendError };
