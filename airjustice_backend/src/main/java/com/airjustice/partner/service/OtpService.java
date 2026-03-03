package com.airjustice.partner.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class OtpService {
    private final SecureRandom rnd = new SecureRandom();

    public String generate6() {
        int n = rnd.nextInt(1_000_000);
        return String.format("%06d", n);
    }

    // In v1: just log to console (later replace by real email/SMS)
    public void sendOtp(String destination, String otp) {
        System.out.println("OTP to " + destination + " = " + otp);
    }
}
