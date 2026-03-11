package com.airjustice.partner.policies.draft.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CreatePolicyFromDraftRequest(
        // passenger
        @NotBlank String passengerFullName,

        // contact
        @Email @NotBlank String clientEmail,
        @NotBlank String clientPhone,

        // segments (corrected)
        @NotNull List<SegmentInput> segments,

        // pricing
        @NotNull BigDecimal price,
        @NotBlank String currency,

        // notifications
        boolean notifyClient
) {
    public record SegmentInput(
            @NotBlank String flightNumber,
            @NotBlank String depIata,
            @NotBlank String arrIata,
            String airline,
            @NotBlank String departureDateTime // ISO
    ) {}
}