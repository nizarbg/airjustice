package com.airjustice.partner.policies;

import jakarta.validation.constraints.NotBlank;

public record DisablePolicyRequest(@NotBlank String reason) {}