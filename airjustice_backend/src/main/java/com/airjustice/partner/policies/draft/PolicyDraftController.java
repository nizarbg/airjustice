package com.airjustice.partner.policies.draft;

import com.airjustice.partner.policies.draft.dto.*;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping("/api/partner/policy-drafts")
@CrossOrigin(origins = "http://localhost:5173")
public class PolicyDraftController {

    private final PolicyDraftService service;

    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @PostMapping
    public DraftDto create(Authentication auth) {
        return service.createDraft(auth.getName());
    }

    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @GetMapping("/{draftId}")
    public DraftDto get(Authentication auth, @PathVariable Long draftId) {
        return service.getDraft(auth.getName(), draftId);
    }

    // Step 1: upload multiple files
    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @PostMapping(value = "/{draftId}/upload", consumes = "multipart/form-data")
    public DraftDto upload(Authentication auth, @PathVariable Long draftId,
                           @RequestPart("files") List<MultipartFile> files) {
        return service.upload(auth.getName(), draftId, files);
    }

    // Step 2: extract (mock)
    @PreAuthorize("hasAnyRole('PARTNER_PRINCIPAL','PARTNER_COLLAB')")
    @PostMapping("/{draftId}/extract")
    public DraftExtractionDto extract(Authentication auth, @PathVariable Long draftId) {
        return service.extract(auth.getName(), draftId);
    }
}