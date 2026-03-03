package com.airjustice.partner.policies;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PolicyDto(
        Long id,
        String clientName,
        String clientEmail,
        String clientPhone,
        String flightNumber,
        LocalDate flightDate,
        String depIata,
        String arrIata,
        BigDecimal price,
        String currency,
        boolean autoAssigned,
        Long assignedAgentId,
        String assignedAgentName,
        PolicyStatus status,
        String disableReason,
        Instant createdAt
) {}