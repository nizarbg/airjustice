package com.airjustice.partner.policies;

import java.time.Instant;

public record AuditDto(
        Long id,
        AuditAction action,
        String actorEmail,
        String details,
        Instant createdAt
) {}