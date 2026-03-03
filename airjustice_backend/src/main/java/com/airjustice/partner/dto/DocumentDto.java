package com.airjustice.partner.dto;

import java.time.Instant;

public record DocumentDto(
        Long id,
        String type,
        String filename,
        Instant uploadedAt
) {}
