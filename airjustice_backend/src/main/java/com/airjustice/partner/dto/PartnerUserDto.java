package com.airjustice.partner.dto;

public record PartnerUserDto(
        Long id,
        Long accountId,
        String fullName,
        String email,
        String role
) {}
