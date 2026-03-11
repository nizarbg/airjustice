package com.airjustice.partner.policies.draft;

import com.airjustice.partner.entity.PartnerRole;
import com.airjustice.partner.entity.PartnerUser;
import com.airjustice.partner.policies.*;
import com.airjustice.partner.policies.draft.dto.CreatePolicyFromDraftRequest;
import com.airjustice.partner.policies.draft.dto.CreatePolicyResponse;
import com.airjustice.partner.repo.PartnerUserRepo;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class PolicyFromDraftService {

    private final PolicyDraftRepo draftRepo;
    private final DraftDocumentRepo draftDocRepo;

    private final PartnerPolicyRepo policyRepo;
    private final PolicySegmentRepo segmentRepo;
    private final PolicyDocumentRepo policyDocRepo;

    private final PartnerUserRepo userRepo;

    public PolicyFromDraftService(
            PolicyDraftRepo draftRepo,
            DraftDocumentRepo draftDocRepo,
            PartnerPolicyRepo policyRepo,
            PolicySegmentRepo segmentRepo,
            PolicyDocumentRepo policyDocRepo,
            PartnerUserRepo userRepo
    ) {
        this.draftRepo = draftRepo;
        this.draftDocRepo = draftDocRepo;
        this.policyRepo = policyRepo;
        this.segmentRepo = segmentRepo;
        this.policyDocRepo = policyDocRepo;
        this.userRepo = userRepo;
    }

    private PartnerUser currentUser(String email) {
        return userRepo.findByEmailIgnoreCase(email).orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));
    }

    private void ensureAgent(PartnerUser u) {
        if (u.getRole() != PartnerRole.PARTNER_PRINCIPAL && u.getRole() != PartnerRole.PARTNER_COLLAB)
            throw new RuntimeException("Accès refusé.");
    }

    @Transactional
    public CreatePolicyResponse createFromDraft(String authEmail, Long draftId, CreatePolicyFromDraftRequest req) {
        PartnerUser actor = currentUser(authEmail);
        ensureAgent(actor);

        PolicyDraft draft = draftRepo.findByIdAndAccountId(draftId, actor.getAccount().getId())
                .orElseThrow(() -> new RuntimeException("Draft introuvable."));

        var docs = draftDocRepo.findByDraftIdOrderByUploadedAtDesc(draftId);
        if (docs.isEmpty()) throw new RuntimeException("Aucun document uploadé.");

        // Create PartnerPolicy using your existing entity
        PartnerPolicy p = new PartnerPolicy();
        p.setAccount(actor.getAccount());

        // Use your existing fields (clientName/email/phone/flight/date/route/price)
        p.setClientName(req.passengerFullName());
        p.setClientEmail(req.clientEmail());
        p.setClientPhone(req.clientPhone());

        // Use first segment as primary flight fields
        var first = req.segments().get(0);
        p.setFlightNumber(first.flightNumber().toUpperCase());
        p.setFlightDate(LocalDate.parse(first.departureDateTime().substring(0, 10)));
        p.setDepIata(first.depIata().toUpperCase());
        p.setArrIata(first.arrIata().toUpperCase());

        p.setPrice(req.price());
        p.setCurrency(req.currency().toUpperCase());

        // Auto assignment: actor is assigned agent (collab “sell service”)
        p.setAutoAssigned(true);
        p.setAssignedAgent(actor);
        p.setCreatedBy(actor);

        // Optional: store notify flag in policy if you add a field; for MVP we just return it
        policyRepo.save(p);

        // Segments
        for (var s : req.segments()) {
            PolicySegment seg = new PolicySegment();
            seg.setPolicy(p);
            seg.setFlightNumber(s.flightNumber().toUpperCase());
            seg.setDepIata(s.depIata().toUpperCase());
            seg.setArrIata(s.arrIata().toUpperCase());
            seg.setAirline(s.airline());
            seg.setDepartureDateTime(LocalDateTime.parse(s.departureDateTime()));
            segmentRepo.save(seg);
        }

        // Attach docs to policy
        for (var d : docs) {
            PolicyDocument pd = new PolicyDocument();
            pd.setPolicy(p);
            pd.setFilename(d.getFilename());
            pd.setContentType(d.getContentType());
            pd.setSizeBytes(d.getSizeBytes());
            pd.setData(d.getData());
            policyDocRepo.save(pd);
        }

        // Mark draft converted
        draft.setStatus(DraftStatus.CONVERTED);
        draftRepo.save(draft);

        // Notification stub (you can wire real Email/SMS later)
        if (req.notifyClient()) {
            System.out.println("[NOTIFY CLIENT] email=" + req.clientEmail() + " phone=" + req.clientPhone()
                    + " policyId=" + p.getId() + " status=Activement surveillé");
        }

        return new CreatePolicyResponse(p.getId(), "ACTIVELY_MONITORED",
                "Police créée. Statut: Activement surveillé.");
    }
}