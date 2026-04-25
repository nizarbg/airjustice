package com.airjustice.partner.controller;

import com.airjustice.partner.dto.PartnerApplyRequest;
import com.airjustice.partner.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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

    /**
     * Upload registration documents (RNE, ID document, travel agency license).
     * Called after /apply returns the accountId (via email lookup or returned in response).
     */
    @PostMapping(value = "/apply/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadDocuments(
            @RequestPart("email") String email,
            @RequestPart("files") List<MultipartFile> files,
            @RequestPart(value = "documentTypes", required = false) String documentTypesStr
    ) {
        // Look up the account by email
        List<String> docTypes = documentTypesStr != null
                ? List.of(documentTypesStr.split(","))
                : List.of();
        service.uploadRegistrationDocumentsByEmail(email.trim().toLowerCase(), files, docTypes);
        return ResponseEntity.ok().body(
                java.util.Map.of("message", "Documents téléversés avec succès.")
        );
    }

    @PostMapping(value = "/verify-submission", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitVerification(
            @RequestPart("email") String email,
            @RequestPart("rcNumber") String rcNumber,
            @RequestPart("fiscalNumber") String fiscalNumber,
            @RequestPart(value = "iataCode", required = false) String iataCode,
            @RequestPart("file") MultipartFile file
    ) throws Exception {
        service.submitVerification(email, rcNumber, fiscalNumber, iataCode, file);
        return ResponseEntity.ok().body(
                java.util.Map.of("message", "Documents reçus. Votre dossier est en attente de validation admin.")
        );
    }
}
