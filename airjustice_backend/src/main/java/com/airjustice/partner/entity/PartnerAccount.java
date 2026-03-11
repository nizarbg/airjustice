package com.airjustice.partner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
public class PartnerAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private PartnerStatus status = PartnerStatus.PENDING;

    // Agency info (editable by principal)
    private String agencyName;
    private String city;
    private String country;

    // Contact info (editable by principal)
    private String contactEmail;
    private String contactPhone;
    private String preferredLanguage; // "fr" / "ar"

    // Administrative verification fields (filled after initial apply, then displayed read-only in UIs)
    private String rcNumber;

    private String fiscalNumber;

    private String iataCode;

    // Balance + alerts
    private BigDecimal prepaidBalance = BigDecimal.ZERO;
    private BigDecimal lowBalanceThreshold = new BigDecimal("50"); // default

}
