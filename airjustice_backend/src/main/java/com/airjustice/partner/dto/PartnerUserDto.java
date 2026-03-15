package com.airjustice.partner.dto;

import java.time.Instant;

public record PartnerUserDto(
        Long id,
        Long accountId,
        String fullName,
        String email,
        String role,
        Instant lastLoginAt
) {}
