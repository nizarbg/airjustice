package com.airjustice.partner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateContactRequest(
        @Email @NotBlank String contactEmail,
        @NotBlank String contactPhone,
        @NotBlank String preferredLanguage
) {}
