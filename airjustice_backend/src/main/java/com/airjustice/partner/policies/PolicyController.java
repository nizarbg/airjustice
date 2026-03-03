package com.airjustice.partner.policies;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partner/policies")
@CrossOrigin(origins = "http://localhost:5173")
public class PolicyController {

    private final PolicyService service;

    public PolicyController(PolicyService service) {
        this.service = service;
    }

    // Principal + Collab (sell service)
    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @PostMapping
    public PolicyDto create(Authentication auth, @Valid @RequestBody CreatePolicyRequest req) {
        return service.create(auth.getName(), req);
    }

    // Principal sees all; Collab sees own only
    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @GetMapping
    public List<PolicyDto> list(
            Authentication auth,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status
    ) {
        return service.list(auth.getName(), q, status);
    }

    // View details (audited)
    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @GetMapping("/{id}")
    public PolicyDto getOne(Authentication auth, @PathVariable Long id) {
        return service.getOne(auth.getName(), id);
    }

    // Disable (principal only)
    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @PutMapping("/{id}/disable")
    public PolicyDto disable(Authentication auth, @PathVariable Long id, @Valid @RequestBody DisablePolicyRequest req) {
        return service.disable(auth.getName(), id, req);
    }

    // Audit trail
    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @GetMapping("/{id}/audit")
    public List<AuditDto> audit(Authentication auth, @PathVariable("id") Long policyId) {
        return service.auditTrail(auth.getName(), policyId);
    }
}