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

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
@AllArgsConstructor
public class PolicyDraftService {

    private static final Set<String> ALLOWED = Set.of("application/pdf", "image/jpeg", "image/png");
    private static final long MAX_BYTES = 10 * 1024 * 1024; // 10MB per file (MVP)
    private static final Pattern FLIGHT_NO = Pattern.compile("^[A-Z]{2}\\d{1,4}[A-Z]?$");

    private final PolicyDraftRepo draftRepo;
    private final DraftDocumentRepo docRepo;
    private final PartnerUserRepo userRepo;
    private final ObjectMapper om = new ObjectMapper();

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
     * MVP extraction: mock based on filename patterns.
     * Later: OCR/AI pipeline.
     */
    @Transactional
    public DraftExtractionDto extract(String authEmail, Long draftId) {
        PartnerUser u = currentUser(authEmail);
        ensureAgent(u);

        PolicyDraft d = draftRepo.findByIdAndAccountId(draftId, u.getAccount().getId())
                .orElseThrow(() -> new RuntimeException("Draft introuvable."));

        var docs = docRepo.findByDraftIdOrderByUploadedAtDesc(draftId);
        if (docs.isEmpty()) throw new RuntimeException("Aucun document uploadé.");

        // mock extraction
        String passenger = "Passager";
        boolean noFlight = true;

        List<ExtractedSegmentDto> segs = new ArrayList<>();

        for (DraftDocument doc : docs) {
            String name = Optional.ofNullable(doc.getFilename()).orElse("").toUpperCase();

            // try to find something like "TU123"
            String foundFlight = findFlightNo(name);
            if (foundFlight != null) {
                noFlight = false;
                segs.add(new ExtractedSegmentDto(
                        foundFlight,
                        "TUN",
                        "CDG",
                        "AIRLINE",
                        LocalDateTime.now().plusDays(7).withHour(10).withMinute(30).toString(),
                        0.85, 0.6, 0.55
                ));
            }
        }

        DraftExtractionDto out = new DraftExtractionDto(
                new ExtractedPassengerDto(passenger, 0.55),
                segs,
                false,
                noFlight
        );

        try {
            d.setExtractedJson(om.writeValueAsString(out));
        } catch (Exception ignored) {}

        d.setStatus(noFlight ? DraftStatus.UPLOADED : DraftStatus.EXTRACTED);
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

    private String findFlightNo(String text) {
        // brute find tokens
        for (String token : text.replaceAll("[^A-Z0-9]", " ").split("\\s+")) {
            if (FLIGHT_NO.matcher(token).matches()) return token;
        }
        return null;
    }

    private DraftDto toDto(PolicyDraft d, List<DraftFileDto> files) {
        return new DraftDto(d.getId(), d.getStatus(), d.getCreatedAt(), d.getUpdatedAt(), files);
    }

    private DraftFileDto toFileDto(DraftDocument doc) {
        return new DraftFileDto(doc.getId(), doc.getFilename(), doc.getContentType(), doc.getSizeBytes(), doc.getUploadedAt());
    }
}