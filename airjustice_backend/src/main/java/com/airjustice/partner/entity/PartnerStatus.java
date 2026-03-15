package com.airjustice.partner.entity;

public enum PartnerStatus {
    SUBMITTED,               // 1. Demande soumise
    CONTACT_IN_PROGRESS,     // 2. Prise de contact en cours
    DOCUMENTS_REQUESTED,     // 3. Documents demandés
    DOCUMENTS_RECEIVED,      // 4. Documents reçus
    VERIFICATION_IN_PROGRESS,// 5. Vérification en cours
    APPROVED,                // 6. Approuvé – accès plateforme
    REJECTED,                // 7. Rejeté

    // Legacy aliases kept for backward compat
    PENDING,                 // maps to SUBMITTED
    VERIFIED,                // maps to VERIFICATION_IN_PROGRESS
    ACTIVE;                  // maps to APPROVED

    /** Normalize legacy values to the new flow. */
    public PartnerStatus normalize() {
        return switch (this) {
            case PENDING -> SUBMITTED;
            case VERIFIED -> VERIFICATION_IN_PROGRESS;
            case ACTIVE -> APPROVED;
            default -> this;
        };
    }

    /** Is the partner allowed to log in? */
    public boolean canLogin() {
        return this == APPROVED || this == ACTIVE;
    }
}
