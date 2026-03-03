package com.airjustice.guest.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
public class FlightReviewResult {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    private FlightCase flightCase;

    @Enumerated(EnumType.STRING)
    private ReviewOutcome outcome;

    private Integer delayMinutes;
    private boolean eligible;
    private Integer compensationBand; // 250 / 400 / 600 (or null)

    @Lob
    private String userMessage;

    private String claimLink;
    private Instant createdAt = Instant.now();
}