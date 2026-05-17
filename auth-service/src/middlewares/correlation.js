const { v4: uuidv4 } = require('uuid');

module.exports = (req, res, next) => {
  // Captura la cabecera del orquestador o genera un nuevo Correlation ID si no existe
  const correlationId = req.header('X-Correlation-ID') || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};