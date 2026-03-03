package com.airjustice.guest.dto;

import java.time.LocalDateTime;

public record FlightOptionDto(
        String flightNumber,
        String airline,
        String depIata,
        String arrIata,
        LocalDateTime scheduledDeparture,
        LocalDateTime scheduledArrival
) {}