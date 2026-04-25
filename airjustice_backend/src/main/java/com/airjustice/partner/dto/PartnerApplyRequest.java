package com.airjustice.partner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PartnerApplyRequest(
        // Company info
        @NotBlank String agencyName,
        @NotBlank @Pattern(regexp = "^[A-Z]{2}$", message = "Country must be ISO 3166-1 alpha-2") String country,
        @NotBlank String address,

        // Contact person
        @NotBlank String contactPersonName,
        @Email @NotBlank String contactEmail,
        @NotBlank @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Phone must follow E.164 format") String contactPhone,

        // Admin user
        @NotBlank String managerName,
        @Email @NotBlank String email,
        @NotBlank @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Phone must follow E.164 format") String phone,

        // Company legal data
        @NotBlank String tradeRegisterNumber,
        @NotBlank String taxIdentificationNumber,

        // Legacy optional fields
        String city,
        String language,
        @NotBlank String password,

        // Consent
        boolean consentAccepted,
        String privacyPolicyVersion
) {}
