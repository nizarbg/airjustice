package com.airjustice.partner.policies.draft;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "draft_document")
public class DraftDocument {

    // getters/setters
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private PolicyDraft draft;

    private String filename;
    private String contentType;
    private long sizeBytes;

    @Lob
    private byte[] data;

    private Instant uploadedAt = Instant.now();
}