package com.airjustice.partner.dto;

import jakarta.validation.constraints.NotBlank;

public record OtpVerifyRequest(@NotBlank String otp) {}