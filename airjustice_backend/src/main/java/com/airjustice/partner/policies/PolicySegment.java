package com.airjustice.partner.policies;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name="partner_policy_segment")
public class PolicySegment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private PartnerPolicy policy;

    private String flightNumber;
    private String depIata;
    private String arrIata;
    private String airline;

    private LocalDateTime departureDateTime;

}