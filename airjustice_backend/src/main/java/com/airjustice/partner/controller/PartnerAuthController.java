package com.airjustice.partner.controller;

import com.airjustice.partner.dto.*;
import com.airjustice.partner.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/partner/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class PartnerAuthController {

    private final PartnerService service;
    public PartnerAuthController(PartnerService service) { this.service = service; }

    @PostMapping("/login")
    public PartnerAuthResponse login(@Valid @RequestBody PartnerLoginRequest req) {
        return service.login(req);
    }

    @PostMapping("/verify-otp")
    public PartnerAuthResponse verifyOtp(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody OtpVerifyRequest req
    ) {
        String tempToken = authHeader.replace("Bearer ", "");
        return service.verifyOtp(tempToken, req);
    }
}