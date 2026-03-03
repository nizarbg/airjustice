package com.airjustice.partner.policies;

import com.airjustice.partner.entity.PartnerAccount;
import com.airjustice.partner.entity.PartnerUser;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Entity
@Table(name = "partner_policy")
@Setter
public class PartnerPolicy {

    // getters/setters (generate in IDE)
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private PartnerAccount account;

    // Données client
    private String clientName;
    private String clientEmail;
    private String clientPhone;

    // Données de vol
    private String flightNumber;
    private LocalDate flightDate;
    private String depIata;
    private String arrIata;

    // Prix
    private BigDecimal price;
    private String currency; // "TND" / "EUR"

    // Attribution
    @ManyToOne
    private PartnerUser assignedAgent; // nullable if AUTO
    private boolean autoAssigned;

    @Enumerated(EnumType.STRING)
    private PolicyStatus status = PolicyStatus.ACTIVE;

    // Disable
    private String disableReason;
    private Instant disabledAt;

    // Audit/meta
    @ManyToOne
    private PartnerUser createdBy;
    private Instant createdAt = Instant.now();
}