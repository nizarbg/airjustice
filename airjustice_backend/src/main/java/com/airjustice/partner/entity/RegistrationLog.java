package com.airjustice.partner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
public class RegistrationLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String eventType;       // registration_submitted, document_uploaded
    private Instant timestamp = Instant.now();
    private Long agencyId;
    private String companyName;
    private String userEmail;

    // Document upload specific fields
    private String documentType;
    private String fileName;
    private String uploadStatus;    // success / failed
}

