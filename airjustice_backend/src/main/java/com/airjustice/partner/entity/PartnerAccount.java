package com.airjustice.partner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Getter
@Setter
public class PartnerAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private PartnerStatus status = PartnerStatus.PENDING;

    // Submission timestamp
    @Column(updatable = false)
    private Instant submittedAt = Instant.now();

    // Agency info
    private String agencyName;
    private String city;
    private String country;        // ISO 3166-1 alpha-2
    private String address;

    // Contact person (may differ from admin user)
    private String contactPersonName;
    @Column(unique = true)
    private String contactEmail;
    private String contactPhone;
    private String preferredLanguage; // "fr" / "ar"

    // Company legal data
    private String tradeRegisterNumber; // RNE / registre de commerce
    private String taxIdentificationNumber;

    // Legacy fields kept for backward compat
    private String rcNumber;
    private String fiscalNumber;
    private String iataCode;

    // Privacy & consent
    private boolean consentStatus;
    private Instant consentTimestamp;
    private String privacyPolicyVersion;

    // Balance + alerts
    private BigDecimal prepaidBalance = BigDecimal.ZERO;
    private BigDecimal lowBalanceThreshold = new BigDecimal("50");

    // Compliance checklist (set by admin reviewer)
    private boolean identityVerified = false;
    private boolean licenseValid = false;
    private boolean companyRegistered = false;

    @Column(columnDefinition = "TEXT")
    private String reviewNotes;
}
