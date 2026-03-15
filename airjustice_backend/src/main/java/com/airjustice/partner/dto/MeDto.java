package com.airjustice.partner.dto;

public record MeDto(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        String twoFactorMethod,
        boolean twoFactorEnabled,
        boolean notifyEmail,
        boolean notifySms,
        boolean notifySystem
) {}