package com.airjustice.partner.policies;

import com.airjustice.partner.entity.PartnerUser;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="policy_audit_event")
@Getter @Setter
public class PolicyAuditEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private PartnerPolicy policy;

    @Enumerated(EnumType.STRING)
    private AuditAction action;

    @ManyToOne
    private PartnerUser actor;

    @Lob
    private String details;

    private Instant createdAt = Instant.now();
}