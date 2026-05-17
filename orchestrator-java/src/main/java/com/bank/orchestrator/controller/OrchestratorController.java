package com.bank.orchestrator.controller; 

import com.bank.orchestrator.client.AuthServiceClient;
import com.bank.orchestrator.client.CoreServiceClient;
import com.bank.orchestrator.dto.BalanceResponse;
import com.bank.orchestrator.dto.MovementResponse;
import com.bank.orchestrator.dto.TransferRequest;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest; // 🚀 El import correcto para Spring MVC
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/orchestrator")
@Tag(name = "Orchestrator Financial API", description = "Endpoints controlados y orquestados para la Fintech políglota")
public class OrchestratorController {

    private final CoreServiceClient coreServiceClient;
    private final AuthServiceClient authServiceClient;

    public OrchestratorController(CoreServiceClient coreServiceClient, AuthServiceClient authServiceClient) {
        this.coreServiceClient = coreServiceClient;
        this.authServiceClient = authServiceClient;
    }

    @GetMapping("/balance/{userId}")
    @Operation(summary = "Consulta de saldo segura orquestada hacia Core")
    @CircuitBreaker(name = "coreServiceCB", fallbackMethod = "balanceFallback")
    public Mono<ResponseEntity<BalanceResponse>> getOrchestratedBalance(
            @RequestHeader("Authorization") String token,
            @PathVariable Long userId,
            HttpServletRequest servletRequest) { // 🛠️ Cambiado a HttpServletRequest
        
        long startTime = System.currentTimeMillis();
        String operation = "GET /api/v1/orchestrator/balance/" + userId;
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        
        JsonLogger.info("Procesando consulta de saldo orquestada para el usuario ID: " + userId, traceId, "N/A", operation, null, 200);
        
        return authServiceClient.validateSession(token)
                .flatMap(session -> coreServiceClient.getBalance(userId))
                .map(res -> {
                    long duration = System.currentTimeMillis() - startTime;
                    JsonLogger.info("Consulta de saldo completada con éxito", traceId, "N/A", operation, duration, 200);
                    return ResponseEntity.ok(res);
                });
    }

    @PostMapping("/transfer")
    @Operation(summary = "Ejecución transaccional de transferencias por teléfono con protección Circuit Breaker y token Redis")
    @CircuitBreaker(name = "coreServiceCB", fallbackMethod = "transferFallback")
    public Mono<ResponseEntity<String>> executeOrchestratedTransfer(
            @RequestHeader("Authorization") String token,
            @RequestBody TransferRequest request,
            HttpServletRequest servletRequest) { // 🛠️ Cambiado a HttpServletRequest
        
        long startTime = System.currentTimeMillis();
        String operation = "POST /api/v1/orchestrator/transfer";
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        
        JsonLogger.info("Iniciando flujo de orquestación de transferencia", traceId, "N/A", operation, null, 200);
        
        return authServiceClient.validateSession(token)
                .flatMap(session -> {
                    String username = session instanceof Map ? String.valueOf(((Map<?,?>)session).get("username")) : "N/A";
                    JsonLogger.info("Sesión validada exitosamente en Redis para usuario: " + username + ". Procediendo a la transferencia física en BD.", traceId, username, operation, null, 200);
                    return coreServiceClient.executeTransfer(request);
                })
                .map(res -> {
                    long duration = System.currentTimeMillis() - startTime;
                    JsonLogger.info("Transferencia orquestada y completada de forma exitosa", traceId, "N/A", operation, duration, 201);
                    return ResponseEntity.status(HttpStatus.CREATED).body(res);
                });
    }

    @GetMapping("/movements/{userId}")
    @Operation(summary = "Consulta de movimientos histórica orquestada")
    @CircuitBreaker(name = "coreServiceCB", fallbackMethod = "movementsFallback")
    public Mono<ResponseEntity<List<MovementResponse>>> getOrchestratedMovements(
            @RequestHeader("Authorization") String token,
            @PathVariable Long userId,
            HttpServletRequest servletRequest) { // 🛠️ Cambiado a HttpServletRequest
        
        long startTime = System.currentTimeMillis();
        String operation = "GET /api/v1/orchestrator/movements/" + userId;
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        
        JsonLogger.info("Orquestando la consulta de movimientos para el usuario ID: " + userId, traceId, "N/A", operation, null, 200);
        
        return authServiceClient.validateSession(token)
                .flatMapMany(session -> coreServiceClient.getMovements(userId)) 
                .collectList()
                .map(res -> {
                    long duration = System.currentTimeMillis() - startTime;
                    JsonLogger.info("Consulta de movimientos mixtos completada exitosamente. Registros: " + res.size(), traceId, "N/A", operation, duration, 200);
                    return ResponseEntity.ok(res);
                });
    }

    // ========== MÉTODOS FALLBACK DEL CIRCUIT BREAKER (ADAPTADOS) ==========
    
    public Mono<ResponseEntity<BalanceResponse>> balanceFallback(String token, Long userId, HttpServletRequest servletRequest, Throwable ex) {
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        JsonLogger.error("CIRCUIT BREAKER ACTIVADO - Fallback de Consulta de Saldo. Detalle: " + ex.getMessage(), traceId, "N/A", "GET /api/v1/orchestrator/balance/" + userId, 503, "ERR_CIRCUIT_BREAKER");
        
        BalanceResponse mockFallbackResponse = BalanceResponse.builder().accountId(-1L).balance(0.0).build();
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(mockFallbackResponse));
    }

    public Mono<ResponseEntity<String>> transferFallback(String token, TransferRequest request, HttpServletRequest servletRequest, Throwable ex) {
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        JsonLogger.error("CIRCUIT BREAKER ACTIVADO - Microservicio Core (Python) degradado o caído. Bloqueando transferencia.", traceId, "N/A", "POST /api/v1/orchestrator/transfer", 503, "ERR_CIRCUIT_BREAKER");
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("{\"status\": \"error\", \"message\": \"Servicio transaccional temporalmente no disponible (Circuit Breaker Abierto)\"}"));
    }

    public Mono<ResponseEntity<List<MovementResponse>>> movementsFallback(String token, Long userId, HttpServletRequest servletRequest, Throwable ex) {
        String traceId = servletRequest.getHeader("X-Correlation-ID");
        JsonLogger.error("CIRCUIT BREAKER ACTIVADO - Fallback de Consulta de Movimientos. Detalle: " + ex.getMessage(), traceId, "N/A", "GET /api/v1/orchestrator/movements/" + userId, 503, "ERR_CIRCUIT_BREAKER");
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(List.of()));
    }

    // =====================================================================
    // 📊 CLASE UTILITARIA INTERNA BLINDADA
    // =====================================================================
    private static class JsonLogger {
        private static final Logger standardLog = LoggerFactory.getLogger("JSON_STRUCTURED_LOGGER");

        public static void info(String message, String traceId, String sessionId, String operation, Long durationMs, Integer httpStatus) {
            standardLog.info(buildJson("INFO", message, traceId, sessionId, operation, durationMs, httpStatus, "null"));
        }

        public static void error(String message, String traceId, String sessionId, String operation, Integer httpStatus, String errorCode) {
            standardLog.error(buildJson("ERROR", message, traceId, sessionId, operation, null, httpStatus, errorCode));
        }

        private static String buildJson(String level, String message, String traceId, String sessionId, String operation, Long durationMs, Integer httpStatus, String errorCode) {
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"timestamp\":\"").append(Instant.now().toString()).append("\",");
            json.append("\"level\":\"").append(level).append("\",");
            json.append("\"service\":\"orchestrator-service-java\",");
            json.append("\"traceId\":\"").append(traceId != null ? traceId : "internal-orchestrator").append("\",");
            json.append("\"sessionId\":\"").append(sessionId != null ? sessionId : "N/A").append("\",");
            json.append("\"operation\":\"").append(operation != null ? operation : "INTERNAL").append("\",");
            json.append("\"message\":\"").append(message.replace("\"", "\\\"")).append("\",");
            json.append("\"status\":\"").append("ERROR".equals(level) ? "FAILED" : "SUCCESS").append("\",");
            json.append("\"durationMs\":").append(durationMs != null ? durationMs : "null").append(",");
            json.append("\"httpStatus\":").append(httpStatus != null ? httpStatus : "null").append(",");
            json.append("\"errorCode\":").append(errorCode != null && !"null".equals(errorCode) ? "\"" + errorCode + "\"" : "null");
            json.append("}");
            return json.toString();
        }
    }
}