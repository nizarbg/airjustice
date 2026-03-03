package com.airjustice.partner.controller;

import com.airjustice.partner.dto.AddCollaboratorRequest;
import com.airjustice.partner.dto.PartnerUserDto;
import com.airjustice.partner.dto.ResetPasswordRequest;
import com.airjustice.partner.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partner/collaborators")
@CrossOrigin(origins = "http://localhost:5173")
public class CollaboratorsController {

    private final PartnerService service;
    public CollaboratorsController(PartnerService service) { this.service = service; }

    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @PostMapping
    public PartnerUserDto add(Authentication auth, @Valid @RequestBody AddCollaboratorRequest req) {
        return service.addCollaborator(auth.getName(), req);
    }

    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @GetMapping
    public List<PartnerUserDto> list(Authentication auth) {
        return service.listCollaborators(auth.getName());
    }

    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(Authentication auth, @PathVariable Long id) {
        service.deleteCollaborator(auth.getName(), id);
        return Map.of("deleted", true);
    }

    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @PostMapping("/{id}/reset-password")
    public Map<String, Object> resetPassword(Authentication auth, @PathVariable Long id, @Valid @RequestBody ResetPasswordRequest req) {
        service.resetCollaboratorPassword(auth.getName(), id, req.newPassword());
        return Map.of("reset", true);
    }
}