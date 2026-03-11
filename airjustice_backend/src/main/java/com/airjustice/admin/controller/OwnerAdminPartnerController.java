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
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/partners")
@CrossOrigin(origins = "http://localhost:5173")
@AllArgsConstructor
@PreAuthorize("hasRole('OWNER_ADMIN')")
public class OwnerAdminPartnerController {

    private final OwnerAdminService service;
    private final PartnerDocumentRepo documentRepo;

    @GetMapping("/applications")
    public List<OwnerAdminService.AdminPartnerApplicationDto> list(@RequestParam(defaultValue = "ALL") String status) {
        return service.listApplications(status);
    }

    @GetMapping("/applications/{id}")
    public OwnerAdminService.AdminPartnerApplicationDetailsDto details(@PathVariable Long id) {
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
        return ResponseEntity.ok(java.util.Map.of("message", "Dossier rejeté et compte supprimé."));
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long documentId) {
        PartnerDocument doc = documentRepo.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document introuvable."));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(doc.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : doc.getContentType()))
                .body(doc.getContent());
    }
}

