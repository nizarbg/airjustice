package com.airjustice.partner.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class HashService {
    private final BCryptPasswordEncoder enc = new BCryptPasswordEncoder();

    public String hash(String raw) { return enc.encode(raw); }
    public boolean matches(String raw, String hashed) { return !enc.matches(raw, hashed); }
}