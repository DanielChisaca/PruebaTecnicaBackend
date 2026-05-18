// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

package com.bank.orchestrator.controller;

import com.bank.orchestrator.client.AuthServiceClient;
import com.bank.orchestrator.client.CoreServiceClient;
import com.bank.orchestrator.dto.BalanceResponse;
import com.bank.orchestrator.dto.MovementResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests unitarios del OrchestratorController.
 * CoreServiceClient y AuthServiceClient se mockean: no se necesita infraestructura real.
 *
 * Nota: el fallback del Circuit Breaker (503) no se prueba aquí porque
 * @CircuitBreaker con AOP solo intercepta excepciones síncronas, no errores
 * emitidos por un Mono. El comportamiento de resiliencia se cubre en tests
 * de integración con WireMock o Testcontainers.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
class OrchestratorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoreServiceClient coreServiceClient;

    @MockBean
    private AuthServiceClient authServiceClient;

    private static final String TOKEN = "bearer-token-test";

    @SuppressWarnings("unchecked")
    private static final Map<String, Object> SESSION = Map.of(
            "id", 1,
            "username", "testuser",
            "phone_number", "3001112233"
    );

    // -----------------------------------------------------------------------
    // GET /api/v1/orchestrator/accounts/balance/{userId}
    // -----------------------------------------------------------------------

    @Test
    void getBalance_sesionValida_retorna200ConSaldo() throws Exception {
        BalanceResponse balance = new BalanceResponse(10L, 5000.0);
        when(authServiceClient.validateSession(TOKEN)).thenReturn(Mono.just(SESSION));
        when(coreServiceClient.getBalance(1L)).thenReturn(Mono.just(balance));

        MvcResult async = mockMvc.perform(
                        get("/api/v1/orchestrator/accounts/balance/1")
                                .header("Authorization", TOKEN))
                .andExpect(request().asyncStarted())
                .andReturn();

        mockMvc.perform(asyncDispatch(async))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.account_id").value(10))
                .andExpect(jsonPath("$.balance").value(5000.0));
    }

    @Test
    void getBalance_sinHeaderAuthorization_retorna400() throws Exception {
        // @RequestHeader obligatorio: Spring MVC rechaza la petición antes de llegar al controller
        mockMvc.perform(get("/api/v1/orchestrator/accounts/balance/1"))
                .andExpect(status().isBadRequest());
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/orchestrator/transfers
    // -----------------------------------------------------------------------

    @Test
    void transfer_exitosa_retorna201() throws Exception {
        when(authServiceClient.validateSession(TOKEN)).thenReturn(Mono.just(SESSION));
        when(coreServiceClient.executeTransfer(any()))
                .thenReturn(Mono.just("{\"status\":\"success\"}"));

        String body = """
                {"origin_user_id": 1, "destination_phone": "3004445566", "amount": 100.0}
                """;

        MvcResult async = mockMvc.perform(
                        post("/api/v1/orchestrator/transfers")
                                .header("Authorization", TOKEN)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(request().asyncStarted())
                .andReturn();

        mockMvc.perform(asyncDispatch(async))
                .andExpect(status().isCreated());
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/orchestrator/movements/{userId}
    // -----------------------------------------------------------------------

    @Test
    void getMovements_sesionValida_retornaLista() throws Exception {
        MovementResponse egreso = MovementResponse.builder()
                .id(1L).originAccountId(10L).destinationPhone("3004445566")
                .amount(500.0).type("egreso").timestamp("2025-01-15T10:00:00").build();
        MovementResponse ingreso = MovementResponse.builder()
                .id(2L).originAccountId(20L).destinationPhone("3001112233")
                .amount(100.0).type("ingreso").timestamp("2025-01-16T10:00:00").build();

        when(authServiceClient.validateSession(TOKEN)).thenReturn(Mono.just(SESSION));
        when(coreServiceClient.getMovements(1L)).thenReturn(Flux.just(egreso, ingreso));

        MvcResult async = mockMvc.perform(
                        get("/api/v1/orchestrator/movements/1")
                                .header("Authorization", TOKEN))
                .andExpect(request().asyncStarted())
                .andReturn();

        mockMvc.perform(asyncDispatch(async))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].type").value("egreso"))
                .andExpect(jsonPath("$[1].type").value("ingreso"));
    }

    @Test
    void getMovements_sinTransacciones_retornaListaVacia() throws Exception {
        when(authServiceClient.validateSession(TOKEN)).thenReturn(Mono.just(SESSION));
        when(coreServiceClient.getMovements(1L)).thenReturn(Flux.empty());

        MvcResult async = mockMvc.perform(
                        get("/api/v1/orchestrator/movements/1")
                                .header("Authorization", TOKEN))
                .andExpect(request().asyncStarted())
                .andReturn();

        mockMvc.perform(asyncDispatch(async))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/orchestrator/notifications/{userId}
    // -----------------------------------------------------------------------

    @Test
    void getNotificaciones_sesionValida_retornaListaLocal() throws Exception {
        when(authServiceClient.validateSession(TOKEN)).thenReturn(Mono.just(SESSION));

        MvcResult async = mockMvc.perform(
                        get("/api/v1/orchestrator/notifications/1")
                                .header("Authorization", TOKEN))
                .andExpect(request().asyncStarted())
                .andReturn();

        // El controller genera 3 alertas estáticas en Java (no depende de servicios externos)
        mockMvc.perform(asyncDispatch(async))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void getNotificaciones_sesionInvalida_retorna401() throws Exception {
        // onErrorResume en el controller captura el error y retorna 401 directamente
        when(authServiceClient.validateSession(TOKEN))
                .thenReturn(Mono.error(new RuntimeException("No autorizado")));

        MvcResult async = mockMvc.perform(
                        get("/api/v1/orchestrator/notifications/1")
                                .header("Authorization", TOKEN))
                .andExpect(request().asyncStarted())
                .andReturn();

        mockMvc.perform(asyncDispatch(async))
                .andExpect(status().isUnauthorized());
    }
}
