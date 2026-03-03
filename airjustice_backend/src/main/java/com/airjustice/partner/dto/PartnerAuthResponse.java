package com.airjustice.partner.dto;

public record PartnerAuthResponse(
        boolean twoFactorRequired,
        String tempToken,
        String token,
        PartnerUserDto user
) {}
