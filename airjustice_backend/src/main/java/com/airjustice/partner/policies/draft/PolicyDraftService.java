package com.airjustice.partner.policies.draft;

import com.airjustice.partner.entity.PartnerRole;
import com.airjustice.partner.entity.PartnerUser;
import com.airjustice.partner.policies.draft.dto.*;
import com.airjustice.partner.repo.PartnerUserRepo;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

@Service
@AllArgsConstructor
public class PolicyDraftService {

    private static final Set<String> ALLOWED = Set.of("application/pdf", "image/jpeg", "image/png");
    private static final long MAX_BYTES = 10 * 1024 * 1024; // 10MB per file

    private final PolicyDraftRepo draftRepo;
    private final DraftDocumentRepo docRepo;
    private final PartnerUserRepo userRepo;
    private final FlightTicketAiExtractor aiExtractor;
    private final ObjectMapper om;

    private PartnerUser currentUser(String email) {
        return userRepo.findByEmailIgnoreCase(email).orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));
    }

    private void ensureAgent(PartnerUser u) {
        if (u.getRole() != PartnerRole.PARTNER_PRINCIPAL && u.getRole() != PartnerRole.PARTNER_COLLAB)
            throw new RuntimeException("Accès refusé.");
    }

    @Transactional
    public DraftDto createDraft(String authEmail) {
        PartnerUser u = currentUser(authEmail);
        ensureAgent(u);

        PolicyDraft d = new PolicyDraft();
        d.setAccount(u.getAccount());
        d.setCreatedBy(u);
        d.setStatus(DraftStatus.CREATED);
        draftRepo.save(d);

        return toDto(d, List.of());
    }

    @Transactional
    public DraftDto upload(String authEmail, Long draftId, List<MultipartFile> files) {
        PartnerUser u = currentUser(authEmail);
        ensureAgent(u);

        PolicyDraft d = draftRepo.findByIdAndAccountId(draftId, u.getAccount().getId())
                .orElseThrow(() -> new RuntimeException("Draft introuvable."));

        if (files == null || files.isEmpty()) throw new RuntimeException("Aucun fichier.");

        for (MultipartFile f : files) {
            if (f.isEmpty()) continue;

            String ct = Optional.ofNullable(f.getContentType()).orElse("");
            if (!ALLOWED.contains(ct)) throw new RuntimeException("Format non supporté: " + ct);

            if (f.getSize() > MAX_BYTES) throw new RuntimeException("Fichier trop volumineux (max 10MB).");

            try {
                DraftDocument doc = new DraftDocument();
                doc.setDraft(d);
                doc.setFilename(Optional.ofNullable(f.getOriginalFilename()).orElse("document"));
                doc.setContentType(ct);
                doc.setSizeBytes(f.getSize());
                doc.setData(f.getBytes());
                docRepo.save(doc);
            } catch (Exception e) {
                throw new RuntimeException("Erreur upload.");
            }
        }

        d.setStatus(DraftStatus.UPLOADED);
        draftRepo.save(d);

        return toDto(d, docRepo.findByDraftIdOrderByUploadedAtDesc(d.getId()).stream().map(this::toFileDto).toList());
    }

    /**
     * Extract flight data from uploaded documents using Tesseract OCR + regex (on-premise).
     * Privacy: see FlightTicketAiExtractor for RGPD/DSG compliance notes.
     */
    @Transactional
    public DraftExtractionDto extract(String authEmail, Long draftId) {
        PartnerUser u = currentUser(authEmail);
        ensureAgent(u);

        PolicyDraft d = draftRepo.findByIdAndAccountId(draftId, u.getAccount().getId())
                .orElseThrow(() -> new RuntimeException("Draft introuvable."));

        var docs = docRepo.findByDraftIdOrderByUploadedAtDesc(draftId);
        if (docs.isEmpty()) throw new RuntimeException("Aucun document uploadé.");

        // Delegate to OCR extractor (handles PDF text + image OCR + regex parsing)
        DraftExtractionDto out = aiExtractor.extract(docs);

        // Persist extracted JSON (structured only – no raw OCR text stored)
        try {
            d.setExtractedJson(om.writeValueAsString(out));
        } catch (Exception ignored) {}

        d.setStatus(out.noFlightDetected() ? DraftStatus.UPLOADED : DraftStatus.EXTRACTED);
        draftRepo.save(d);
        return out;
    }

    public DraftDto getDraft(String authEmail, Long draftId) {
        PartnerUser u = currentUser(authEmail);
        ensureAgent(u);

        PolicyDraft d = draftRepo.findByIdAndAccountId(draftId, u.getAccount().getId())
                .orElseThrow(() -> new RuntimeException("Draft introuvable."));
        var files = docRepo.findByDraftIdOrderByUploadedAtDesc(draftId).stream().map(this::toFileDto).toList();
        return toDto(d, files);
    }


    private DraftDto toDto(PolicyDraft d, List<DraftFileDto> files) {
        return new DraftDto(d.getId(), d.getStatus(), d.getCreatedAt(), d.getUpdatedAt(), files);
    }

    private DraftFileDto toFileDto(DraftDocument doc) {
        return new DraftFileDto(doc.getId(), doc.getFilename(), doc.getContentType(), doc.getSizeBytes(), doc.getUploadedAt());
    }
}