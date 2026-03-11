package com.airjustice.partner.policies.draft.dto;

public record ExtractedSegmentDto(
        String flightNumber,
        String depIata,
        String arrIata,
        String airline,
        String departureDateTime, // ISO string
        double confidenceFlightNumber,
        double confidenceRoute,
        double confidenceDateTime
) {}