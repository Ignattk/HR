// Simple API key authentication middleware for n8n or frontend
module.exports = function (req, res, next) {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  const validKey = process.env.API_KEY || "test-api-key";
  if (apiKey !== validKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};
