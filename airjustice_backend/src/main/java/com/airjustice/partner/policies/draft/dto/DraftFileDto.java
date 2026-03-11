package com.airjustice.partner.policies.draft.dto;

import java.time.Instant;

public record DraftFileDto(
        Long id,
        String filename,
        String contentType,
        long sizeBytes,
        Instant uploadedAt
) {}
