// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

const { v4: uuidv4 } = require('uuid');

module.exports = (req, res, next) => {
  const correlationId = req.header('X-Correlation-ID') || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};