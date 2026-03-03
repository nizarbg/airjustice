package com.airjustice.partner.dto;

public record MeDto(
        Long id,
        String fullName,
        String email,
        String role,
        String twoFactorMethod
) {}