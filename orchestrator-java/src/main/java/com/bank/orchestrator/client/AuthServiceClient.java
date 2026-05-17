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
                // Si Node responde un error (401/403), lo capturamos para manejarlo en la orquestación
                .bodyToMono(Map.class);
    }

    /**
     * Envía la petición de registro de usuario al Auth Service de Node.js
     * para que cifre la contraseña con Bcrypt.
     */
    public Mono<Map> registerUser(Map<String, Object> registerPayload) {
        return this.webClient.post()
                .uri(authUrl + "/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(registerPayload)
                .retrieve()
                .bodyToMono(Map.class);
    }

    /**
     * Envía las credenciales a Node.js para verificar el hash y generar la sesión.
     */
    public Mono<Map> loginUser(Map<String, String> loginPayload) {
        return this.webClient.post()
                .uri(authUrl + "/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(loginPayload)
                .retrieve()
                .bodyToMono(Map.class);
    }
}