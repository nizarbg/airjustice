package com.airjustice.partner.dto;

import jakarta.validation.constraints.NotBlank;

public record PartnerLoginRequest(
        @NotBlank String identifier, // email OR username
        @NotBlank String password
) {}