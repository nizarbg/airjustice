package com.airjustice.partner.controller;

import com.airjustice.partner.dto.PartnerApplyRequest;
import com.airjustice.partner.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/partner")
@CrossOrigin(origins = "http://localhost:5173")
public class PartnerApplyController {

    private final PartnerService service;
    public PartnerApplyController(PartnerService service) { this.service = service; }

    @PostMapping("/apply")
    public ResponseEntity<?> apply(@Valid @RequestBody PartnerApplyRequest req) {
        service.apply(req);
        return ResponseEntity.ok().body(
                java.util.Map.of("message", "Inscription reçue. Notre équipe vous contactera sous 24h.")
        );
    }
}
