package com.airjustice.partner.policies;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Setter
@Getter
@Table(name="partner_policy_document")
public class PolicyDocument {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private PartnerPolicy policy;

    private String filename;
    private String contentType;
    private long sizeBytes;

    @Lob
    private byte[] data;

    private Instant uploadedAt = Instant.now();
}