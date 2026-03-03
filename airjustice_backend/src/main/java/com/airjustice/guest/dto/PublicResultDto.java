package com.airjustice.guest.dto;

import com.airjustice.guest.entity.ReviewOutcome;

public record PublicResultDto(
        ReviewOutcome outcome,
        Integer delayMinutes,
        boolean eligible,
        Integer compensationBand,
        String userMessage,
        String claimLink
) {}