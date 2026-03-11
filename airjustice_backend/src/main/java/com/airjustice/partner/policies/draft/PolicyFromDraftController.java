package com.airjustice.partner.policies.draft;

import com.airjustice.partner.policies.draft.dto.CreatePolicyFromDraftRequest;
import com.airjustice.partner.policies.draft.dto.CreatePolicyResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/partner/policies")
@CrossOrigin(origins = "http://localhost:5173")
@AllArgsConstructor
public class PolicyFromDraftController {

    private final PolicyFromDraftService service;

    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @PostMapping("/from-draft/{draftId}")
    public CreatePolicyResponse create(Authentication auth, @PathVariable Long draftId,
                                       @Valid @RequestBody CreatePolicyFromDraftRequest req) {
        return service.createFromDraft(auth.getName(), draftId, req);
    }
}