package com.airjustice.guest.dto;

import com.airjustice.guest.entity.CaseStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PublicCaseDto(
        String trackingCode,
        CaseStatus status,
        String flightNumber,
        LocalDate flightDate,
        String depIata,
        String arrIata,
        String airline,
        LocalDateTime scheduledDeparture,
        LocalDateTime scheduledArrival
) {}