package com.bank.orchestrator.client;

import com.bank.orchestrator.dto.BalanceResponse;
import com.bank.orchestrator.dto.TransferRequest;
import com.bank.orchestrator.dto.MovementResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

@Component
public class CoreServiceClient {

    private final WebClient webClient;
    private final String coreUrl;

    public CoreServiceClient(WebClient webClient, @Value("${services.core-url}") String coreUrl) {
        this.webClient = webClient;
        this.coreUrl = coreUrl;
    }

    public Mono<BalanceResponse> getBalance(Long userId) {
        return this.webClient.get()
                .uri(coreUrl + "/accounts/balance/" + userId)
                .retrieve()
                .bodyToMono(BalanceResponse.class);
    }

    public Mono<String> executeTransfer(TransferRequest request) {
        return this.webClient.post()
                .uri(coreUrl + "/accounts/transfer")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(String.class);
    }

    public Flux<MovementResponse> getMovements(Long userId) {
        return this.webClient.get()
                .uri(coreUrl + "/movements/" + userId)
                .retrieve()
                .bodyToFlux(MovementResponse.class);
    }
}