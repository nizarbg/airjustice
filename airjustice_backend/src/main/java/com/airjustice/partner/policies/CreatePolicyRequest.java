package com.airjustice.partner.policies;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Extended to support notify options (email/SMS).
 */
public record CreatePolicyRequest(
        // Client
        @NotBlank String clientName,
        @NotBlank String clientEmail,
        @NotBlank String clientPhone,

        // Flight
        @NotBlank String flightNumber,
        @NotNull LocalDate flightDate,
        @NotBlank String depIata,
        @NotBlank String arrIata,

        // Price
        @NotNull BigDecimal price,
        @NotBlank String currency,

        // Assignment
        Boolean autoAssign,
        Long assignedAgentId,

        // Notifications
        Boolean notifyEmail,
        Boolean notifySms
) {}