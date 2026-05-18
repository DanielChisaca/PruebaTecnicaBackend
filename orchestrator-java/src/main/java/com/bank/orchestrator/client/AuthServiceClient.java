// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

package com.bank.orchestrator.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;

@Component
public class AuthServiceClient {

    private final WebClient webClient;
    private final String authUrl;

    // Inyección del WebClient configurado globalmente y la URL desde el application.yml
    public AuthServiceClient(WebClient webClient, @Value("${services.auth-url}") String authUrl) {
        this.webClient = webClient;
        this.authUrl = authUrl;
    }

    /**
     * Valida si un token de sesión enviado por el cliente es legítimo en Redis.
     * Requisito: "Manejo de sesión" orquestado desde Java.
     * * @param token El Bearer Token enviado en las cabeceras HTTP.
     * @return Un Mono con la respuesta del microservicio de Node.js (ej. datos del usuario si es válida).
     */
    public Mono<Map> validateSession(String token) {
        return this.webClient.post()
                .uri(authUrl + "/api/v1/auth/validate")
                .header("Authorization", token)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(Map.class);
    }

}