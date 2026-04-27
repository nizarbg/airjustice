package com.airjustice.admin.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** e.g. queue_view_accessed, compliance_review_accessed */
    private String eventType;

    /** Admin email (JWT subject) */
    private String adminId;

    /** Nullable – only set for compliance_review_accessed */
    private Long agencyId;

    private Instant timestamp = Instant.now();
}

