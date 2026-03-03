package com.airjustice.partner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AddCollaboratorRequest(
        @NotBlank String fullName,
        String username,
        @Email @NotBlank String email,
        @NotBlank String phone,
        @NotBlank String tempPassword
) {}