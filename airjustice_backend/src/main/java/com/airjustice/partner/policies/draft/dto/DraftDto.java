package com.airjustice.partner.policies.draft.dto;

import com.airjustice.partner.policies.draft.DraftStatus;

import java.time.Instant;
import java.util.List;

public record DraftDto(
        Long id,
        DraftStatus status,
        Instant createdAt,
        Instant updatedAt,
        List<DraftFileDto> files
) {}