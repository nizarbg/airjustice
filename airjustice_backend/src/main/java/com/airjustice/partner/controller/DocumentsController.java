package com.airjustice.partner.controller;

import com.airjustice.partner.dto.DocumentDto;
import com.airjustice.partner.service.PartnerService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/partner/documents")
@CrossOrigin(origins = "http://localhost:5173")
public class DocumentsController {

    private final PartnerService service;
    public DocumentsController(PartnerService service) { this.service = service; }

    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @PostMapping(value="/authorization", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentDto upload(Authentication auth, @RequestPart("file") MultipartFile file) throws Exception {
        return service.uploadAuthorization(auth.getName(), file);
    }

    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @GetMapping
    public List<DocumentDto> list(Authentication auth) {
        return service.listDocuments(auth.getName());
    }

    @PreAuthorize("hasRole('PARTNER_PRINCIPAL')")
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(Authentication auth, @PathVariable Long id) {
        var doc = service.getDocument(auth.getName(), id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFilename() + "\"")
                .contentType(MediaType.parseMediaType(doc.getContentType() == null ? "application/octet-stream" : doc.getContentType()))
                .body(doc.getContent());
    }
}