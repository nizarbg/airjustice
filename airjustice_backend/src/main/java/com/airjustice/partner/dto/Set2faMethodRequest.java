package com.airjustice.partner.dto;

import jakarta.validation.constraints.NotBlank;

public record Set2faMethodRequest(@NotBlank String twoFactorMethod) {}