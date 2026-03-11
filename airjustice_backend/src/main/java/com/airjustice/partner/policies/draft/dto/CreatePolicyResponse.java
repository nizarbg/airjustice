package com.airjustice.partner.policies.draft.dto;

public record CreatePolicyResponse(
        Long policyId,
        String status,
        String message
) {}