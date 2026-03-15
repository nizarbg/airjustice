package com.airjustice.partner.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name="partner_user")
@Getter
@Setter
public class PartnerUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    @ManyToOne(optional = false)
    private PartnerAccount account;

    @Enumerated(EnumType.STRING)
    private PartnerRole role = PartnerRole.PARTNER_COLLAB;

    @Column(unique = true, nullable = false)
    private String email;

    private String phone;
    private String fullName;

    private String passwordHash;

    // 2FA
    private boolean twoFactorEnabled = true;
    private String otpHash;
    private Instant otpExpiresAt;

    @Enumerated(EnumType.STRING)
    private TwoFactorMethod twoFactorMethod = TwoFactorMethod.EMAIL;

    // Notification preferences
    private boolean notifyEmail = true;
    private boolean notifySms = false;
    private boolean notifySystem = true;

    // Login tracking
    private Instant lastLoginAt;
}
