// ════════════════════════════════════════════════════════════════════════════
// Author: Daniel Chisacá Rubio
// ════════════════════════════════════════════════════════════════════════════

package com.bank.orchestrator.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceResponse {

    // @JsonProperty mapea la convención snake_case de Python (Pydantic) 
    // a la convención camelCase estándar de Java automáticamente.
    @JsonProperty("account_id")
    private Long accountId;

    private Double balance;
}