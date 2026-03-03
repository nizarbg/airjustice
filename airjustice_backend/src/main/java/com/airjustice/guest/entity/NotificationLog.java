package com.airjustice.guest.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Entity
@Setter
public class NotificationLog {
    // getters/setters
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private FlightCase flightCase;

    @Enumerated(EnumType.STRING)
    private NotifyChannel channel;

    @Enumerated(EnumType.STRING)
    private NotifyType type;

    @Lob
    private String payload;

    private Instant sentAt = Instant.now();

}