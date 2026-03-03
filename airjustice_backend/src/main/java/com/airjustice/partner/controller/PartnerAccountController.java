package com.airjustice.partner.controller;

import com.airjustice.partner.dto.PartnerAccountDto;
import com.airjustice.partner.dto.PartnerAccountLimitedDto;
import com.airjustice.partner.dto.UpdateAgencyRequest;
import com.airjustice.partner.dto.UpdateContactRequest;
import com.airjustice.partner.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/partner")
@CrossOrigin(origins = "http://localhost:5173")
public class PartnerAccountController {

    private final PartnerService service;
    public PartnerAccountController(PartnerService service) { this.service = service; }

    // ✅ Principal only (status + full account settings)
    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @GetMapping("/account")
    public PartnerAccountDto getAccount(Authentication auth) {
        return service.getAccount(auth.getName());
    }

    // ✅ Collab safe
    @GetMapping("/account/limited")
    public PartnerAccountLimitedDto getAccountLimited(Authentication auth) {
        return service.getAccountLimited(auth.getName());
    }

    // ✅ Principal only
    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @PutMapping("/account/contact")
    public PartnerAccountDto updateContact(Authentication auth, @Valid @RequestBody UpdateContactRequest req) {
        return service.updateContact(auth.getName(), req);
    }

    // ✅ Principal only
    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @PutMapping("/account/agency")
    public PartnerAccountDto updateAgency(Authentication auth, @Valid @RequestBody UpdateAgencyRequest req) {
        return service.updateAgency(auth.getName(), req);
    }

    // ✅ Both roles (collab read-only in UI)
    @GetMapping("/account/balance")
    public Map<String, Object> balance(Authentication auth) {
        return service.getBalance(auth.getName());
    }

    // ✅ Principal only
    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @PutMapping("/account/balance/threshold")
    public Map<String, Object> setThreshold(Authentication auth, @RequestBody Map<String, Object> body) {
        BigDecimal threshold = new BigDecimal(body.get("lowBalanceThreshold").toString());
        return service.setLowBalanceThreshold(auth.getName(), threshold);
    }

    // ✅ Principal only: enable/disable 2FA
    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @PutMapping("/account/2fa")
    public Map<String, Object> set2fa(Authentication auth, @RequestBody Map<String, Object> body) {
        boolean enabled = Boolean.parseBoolean(body.get("enabled").toString());
        service.setTwoFactor(auth.getName(), enabled);
        return Map.of("enabled", enabled);
    }
}