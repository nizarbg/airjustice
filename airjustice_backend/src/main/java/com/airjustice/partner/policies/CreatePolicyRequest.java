package com.airjustice.partner.policies;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePolicyRequest(
        @NotBlank String clientName,
        @Email @NotBlank String clientEmail,
        @NotBlank String clientPhone,

        @NotBlank String flightNumber,
        @NotNull LocalDate flightDate,
        @NotBlank String depIata,
        @NotBlank String arrIata,

        @NotNull @DecimalMin("0.0") BigDecimal price,
        @NotBlank String currency,

        @NotNull Boolean autoAssign,
        Long assignedAgentId
) {}