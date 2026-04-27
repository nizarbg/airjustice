package com.airjustice.admin.controller;

import com.airjustice.admin.service.OwnerAdminService;
import com.airjustice.partner.entity.PartnerDocument;
import com.airjustice.partner.repo.PartnerDocumentRepo;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/partners")
@CrossOrigin(origins = "http://localhost:5173")
@AllArgsConstructor
@PreAuthorize("hasRole('OWNER_ADMIN')")
public class OwnerAdminPartnerController {

    private final OwnerAdminService service;
    private final PartnerDocumentRepo documentRepo;

    /** Centralized queue with filtering, sorting, and audit logging. */
    @GetMapping("/applications")
    public List<OwnerAdminService.AdminPartnerApplicationDto> list(
            @RequestParam(defaultValue = "")          String statuses,
            @RequestParam(defaultValue = "")          String country,
            @RequestParam(defaultValue = "")          String dateFrom,
            @RequestParam(defaultValue = "")          String dateTo,
            @RequestParam(defaultValue = "submittedAt") String sortBy,
            @RequestParam(defaultValue = "asc")       String sortDir,
            Authentication auth
    ) {
        String adminId = auth != null ? auth.getName() : "unknown";
        service.logQueueViewAccessed(adminId);
        return service.listApplications(statuses, country, dateFrom, dateTo, sortBy, sortDir);
    }

    /** Full details of one application with audit logging. */
    @GetMapping("/applications/{id}")
    public OwnerAdminService.AdminPartnerApplicationDetailsDto details(
            @PathVariable Long id,
            Authentication auth
    ) {
        String adminId = auth != null ? auth.getName() : "unknown";
        service.logComplianceReviewAccessed(adminId, id);
        return service.getApplication(id);
    }

    @PutMapping("/applications/{id}/verify")
    public OwnerAdminService.AdminPartnerApplicationDetailsDto verify(
            @PathVariable Long id,
            @Valid @RequestBody OwnerAdminService.AdminVerifyPartnerRequest req
    ) {
        return service.verifyApplication(id, req);
    }

    @PutMapping("/applications/{id}/approve")
    public OwnerAdminService.AdminPartnerApplicationDetailsDto approve(@PathVariable Long id) {
        return service.approveApplication(id);
    }

    @DeleteMapping("/applications/{id}")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        service.rejectApplication(id);
        return ResponseEntity.ok(Map.of("message", "Dossier rejeté et compte supprimé."));
    }

    @PutMapping("/applications/{id}/status")
    public OwnerAdminService.AdminPartnerApplicationDetailsDto setStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        return service.setApplicationStatus(id, body.get("status"));
    }

    /** Update compliance checklist and review notes. */
    @PutMapping("/applications/{id}/checklist")
    public OwnerAdminService.AdminPartnerApplicationDetailsDto updateChecklist(
            @PathVariable Long id,
            @RequestBody OwnerAdminService.AdminChecklistRequest req
    ) {
        return service.updateChecklist(id, req);
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long documentId) {
        PartnerDocument doc = documentRepo.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document introuvable."));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(
                        doc.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : doc.getContentType()))
                .body(doc.getContent());
    }
}
