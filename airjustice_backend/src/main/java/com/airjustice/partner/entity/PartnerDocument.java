package com.airjustice.partner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Entity
@Setter
public class PartnerDocument {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private PartnerAccount account;

    private String type;
    private String filename;
    private Instant uploadedAt = Instant.now();

    @Lob
    @Column(columnDefinition = "BLOB")
    private byte[] content;

    private String contentType;
}