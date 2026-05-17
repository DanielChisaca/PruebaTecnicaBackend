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
public class TransferRequest {

    @JsonProperty("origin_user_id")
    private Long originUserId;

    @JsonProperty("destination_phone")
    private String destinationPhone;

    private Double amount;
}