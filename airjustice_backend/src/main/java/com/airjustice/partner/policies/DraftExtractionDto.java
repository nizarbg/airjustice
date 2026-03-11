package com.airjustice.partner.policies;

import java.util.List;

public record DraftExtractionDto(
        ExtractedPassengerDto passenger,
        List<ExtractedSegmentDto> segments,
        boolean multiPassengerDetected
) {}
