package com.airjustice.partner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record PartnerApplyRequest(
        @NotBlank String agencyName,
        @NotBlank String managerName,
        @Email @NotBlank String email,
        @NotBlank String phone,
        @NotBlank String city,
        @NotBlank String country,
        @NotBlank String language
) {}
