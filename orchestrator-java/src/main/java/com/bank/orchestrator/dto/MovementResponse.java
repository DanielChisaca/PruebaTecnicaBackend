// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

package com.bank.orchestrator.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovementResponse {

    private Long id;

    @JsonProperty("origin_account_id")
    private Long originAccountId;

    @JsonProperty("destination_phone")
    private String destinationPhone;

    private Double amount;
    private String timestamp;
    private String type;
}