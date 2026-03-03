package com.airjustice.partner.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAgencyRequest(
        @NotBlank String agencyName,
        @NotBlank String city,
        @NotBlank String country
) {}
