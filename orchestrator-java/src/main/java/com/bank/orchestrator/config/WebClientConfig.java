// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

package com.bank.orchestrator.config;

import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
                .filter((request, next) -> {
                    String corrId = MDC.get("correlationId");
                    ClientRequest filteredRequest = ClientRequest.from(request)
                            .header("X-Correlation-ID", corrId != null ? corrId : "internal-orq")
                            .build();
                    return next.exchange(filteredRequest);
                })
                .build();
    }
}