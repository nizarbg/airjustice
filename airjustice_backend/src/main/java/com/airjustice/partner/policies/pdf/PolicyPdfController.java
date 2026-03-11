package com.airjustice.partner.policies.pdf;

import com.airjustice.partner.entity.PartnerUser;
import com.airjustice.partner.policies.PartnerPolicy;
import com.airjustice.partner.policies.PartnerPolicyRepo;
import com.airjustice.partner.repo.PartnerUserRepo;
import lombok.AllArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/partner/policies")
@CrossOrigin(origins = "http://localhost:5173")
@AllArgsConstructor
public class PolicyPdfController {

    private final PartnerPolicyRepo policyRepo;
    private final PartnerUserRepo userRepo;
    private final PolicyPdfService pdf;

    private PartnerUser currentUser(String email) {
        return userRepo.findByEmailIgnoreCase(email).orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));
    }

    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @GetMapping("/{policyId}/pdf")
    public ResponseEntity<byte[]> download(Authentication auth, @PathVariable Long policyId) {
        PartnerUser u = currentUser(auth.getName());
        PartnerPolicy p = policyRepo.findById(policyId).orElseThrow(() -> new RuntimeException("Police introuvable."));

        // same account check
        if (!p.getAccount().getId().equals(u.getAccount().getId()))
            throw new RuntimeException("Accès refusé.");

        byte[] bytes = pdf.buildPolicyPdf(p);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=policy-" + policyId + ".pdf")
                .body(bytes);
    }
}