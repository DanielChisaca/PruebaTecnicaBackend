import time
import logging
import sys
from contextvars import ContextVar
from fastapi import Request
# ════════════════════════════════════════════════════════════════════════════
# Author: Daniel Chisacá Rubio
# ════════════════════════════════════════════════════════════════════════════

import structlog

# Variables de contexto para Trazabilidad y Sesión
correlation_id_var = ContextVar("correlation_id", default="internal-tx")
session_id_var = ContextVar("session_id", default="N/A")

def compliance_processor(logger, method_name, event_dict):
    """
    Procesador personalizado para forzar la estructura exacta de la rúbrica.
    Mapea, limpia y ordena las llaves requeridas para la entrega.
    """
    event_dict["timestamp"] = event_dict.pop("timestamp", None)
    event_dict["level"] = event_dict.pop("level", method_name.upper())
    event_dict["service"] = "core-service-python"
    
    event_dict["traceId"] = correlation_id_var.get()
    event_dict["sessionId"] = session_id_var.get()
    
    event_dict["operation"] = event_dict.pop("operation", "INTERNAL")
    event_dict["message"] = event_dict.pop("event", "")
    
    if event_dict["level"] in ["ERROR", "CRITICAL"]:
        event_dict["status"] = "FAILED"
        event_dict["errorCode"] = event_dict.pop("errorCode", "ERR_CORE_INTERNAL")
    else:
        event_dict["status"] = event_dict.pop("status", "SUCCESS")
        event_dict["errorCode"] = None

    event_dict["durationMs"] = event_dict.pop("durationMs", None)
    event_dict["httpStatus"] = event_dict.pop("httpStatus", None)

    ordered_keys = [
        "timestamp", "level", "service", "traceId", "sessionId", 
        "operation", "message", "status", "durationMs", "httpStatus", "errorCode"
    ]
    
    compliance_dict = {k: event_dict.get(k) for k in ordered_keys}
    
    for k, v in event_dict.items():
        if k not in ordered_keys:
            compliance_dict[k] = v
            
    return compliance_dict

def setup_logging():
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            compliance_processor,
            structlog.processors.JSONRenderer(ensure_ascii=False)
        ],
        context_class=dict, 
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

handler = logging.StreamHandler(sys.stdout)
root_logger = logging.getLogger()
root_logger.addHandler(handler)
root_logger.setLevel(logging.INFO)

setup_logging()
logger = structlog.get_logger()

# =====================================================================
# 🔄 MIDDLEWARE DE TRAZABILIDAD Y MÉTRICAS DE RENDIMIENTO (FASTAPI)
# =====================================================================
async def log_middleware(request: Request, call_next):
    start_time = time.time()
    

    corr_id = request.headers.get("X-Correlation-ID", "internal-tx")
    correlation_id_var.set(corr_id)
    
    sess_id = request.headers.get("X-Session-ID", "N/A")
    session_id_var.set(sess_id)
    
    operation_name = f"{request.method} {request.url.path}"
    

    structlog.contextvars.clear_contextvars()
    
    logger.info(
        f"Petición entrante al Core", 
        operation=operation_name
    )
    
    try:
        response = await call_next(request)

        duration_ms = int((time.time() - start_time) * 1000)
        
        logger.info(
            f"Petición procesada con éxito en Core",
            operation=operation_name,
            durationMs=duration_ms,
            httpStatus=response.status_code,
            status="SUCCESS"
        )
        return response

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error(
            "Fallo crítico en la ejecución del Core Service",
            operation=operation_name,
            durationMs=duration_ms,
            httpStatus=500,
            errorCode="CORE_RUNTIME_ERROR",
            exception=str(e)
        )
        raise e