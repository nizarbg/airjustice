package com.airjustice.partner.policies.draft.dto;

import java.util.List;

public record DraftExtractionDto(
        ExtractedPassengerDto passenger,
        List<ExtractedSegmentDto> segments,
        boolean multiPassengerDetected,
        boolean noFlightDetected
) {}