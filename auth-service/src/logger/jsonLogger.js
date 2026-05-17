const info = (message, req, extra = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "INFO",
    service: "auth-service-node",
    traceId: req ? (req.correlationId || req.headers?.['x-correlation-id']) : "internal-auth",
    sessionId: extra.sessionId || (req && req.session?.id) || "N/A",
    operation: extra.operation || (req ? `${req.method} ${req.baseUrl || req.path}` : "INTERNAL"),

    message,
    
    status: extra.status || "SUCCESS",
    durationMs: extra.durationMs !== undefined ? extra.durationMs : null,
    httpStatus: extra.httpStatus || (req ? 200 : null),
    errorCode: null
  }));
};

const error = (message, req, errorDetails = {}) => {
  const actualError = errorDetails instanceof Error ? errorDetails.message : (errorDetails.message || errorDetails);

  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "ERROR",
    service: "auth-service-node",
    traceId: req ? (req.correlationId || req.headers?.['x-correlation-id']) : "internal-auth",
    sessionId: errorDetails.sessionId || (req && req.session?.id) || "N/A",
    operation: errorDetails.operation || (req ? `${req.method} ${req.baseUrl || req.path}` : "INTERNAL"),
    
    message: `${message} | Detalle: ${actualError}`,
    
    status: "FAILED",
    durationMs: errorDetails.durationMs !== undefined ? errorDetails.durationMs : null,
    httpStatus: errorDetails.httpStatus || (errorDetails.response?.status) || 500,
    errorCode: errorDetails.errorCode || "ERR_INTERNAL_SERVER"
  }));
};

module.exports = { info, error };