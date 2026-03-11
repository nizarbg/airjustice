package com.airjustice.partner.policies;

public record ExtractedSegmentDto(
        String flightNumber,
        String depIata,
        String arrIata,
        String departureDateTime,
        String airline,
        Double confidenceFlightNumber,
        Double confidenceRoute,
        Double confidenceDateTime
) {}
