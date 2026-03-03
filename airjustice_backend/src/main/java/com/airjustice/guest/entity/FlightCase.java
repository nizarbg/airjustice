package com.airjustice.guest.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.*;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name="flight_case")
public class FlightCase {
    // getters/setters (generate)
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String trackingCode;

    // Passenger contact (no account)
    private String fullName;
    private String email;
    private String phone;

    // Flight
    private String flightNumber;
    private LocalDate flightDate;
    private String depIata;
    private String arrIata;
    private String airline;

    // Simple scheduling for monitoring (MVP)
    private LocalDateTime scheduledDeparture;
    private LocalDateTime scheduledArrival;

    private boolean paid;

    @Enumerated(EnumType.STRING)
    private CaseStatus status = CaseStatus.PENDING_REVIEW;

    private Instant createdAt = Instant.now();

    @PrePersist
    public void ensureTrackingCode() {
        if (trackingCode == null || trackingCode.isBlank()) {
            trackingCode = "AJ-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        }
    }
}