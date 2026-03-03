package com.airjustice.partner.policies;

import com.airjustice.partner.entity.PartnerRole;
import com.airjustice.partner.entity.PartnerUser;
import com.airjustice.partner.repo.PartnerUserRepo;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@AllArgsConstructor
public class PolicyService {

    private final PartnerPolicyRepo policyRepo;
    private final PolicyAuditRepo auditRepo;
    private final PartnerUserRepo userRepo;

    private PartnerUser currentUser(String email) {
        return userRepo.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));
    }

    private void ensureSameAccount(PartnerUser u, PartnerPolicy p) {
        if (!p.getAccount().getId().equals(u.getAccount().getId()))
            throw new RuntimeException("Accès refusé.");
    }

    private PolicyDto toDto(PartnerPolicy p) {
        return new PolicyDto(
                p.getId(),
                p.getClientName(),
                p.getClientEmail(),
                p.getClientPhone(),
                p.getFlightNumber(),
                p.getFlightDate(),
                p.getDepIata(),
                p.getArrIata(),
                p.getPrice(),
                p.getCurrency(),
                p.isAutoAssigned(),
                p.getAssignedAgent() == null ? null : p.getAssignedAgent().getId(),
                p.getAssignedAgent() == null ? null : p.getAssignedAgent().getFullName(),
                p.getStatus(),
                p.getDisableReason(),
                p.getCreatedAt()
        );
    }

    private void audit(PartnerPolicy policy, AuditAction action, PartnerUser actor, String details) {
        PolicyAuditEvent ev = new PolicyAuditEvent();
        ev.setPolicy(policy);
        ev.setAction(action);
        ev.setActor(actor);
        ev.setDetails(details);
        auditRepo.save(ev);
    }

    @Transactional
    public PolicyDto create(String authEmail, CreatePolicyRequest req) {
        PartnerUser actor = currentUser(authEmail);

        // Principal AND Collab can “sell the service”
        if (actor.getRole() != PartnerRole.PARTNER_PRINCIPAL && actor.getRole() != PartnerRole.PARTNER_COLLAB)
            throw new RuntimeException("Accès refusé.");

        PartnerPolicy p = new PartnerPolicy();
        p.setAccount(actor.getAccount());

        p.setClientName(req.clientName());
        p.setClientEmail(req.clientEmail());
        p.setClientPhone(req.clientPhone());

        p.setFlightNumber(req.flightNumber().toUpperCase());
        p.setFlightDate(req.flightDate());
        p.setDepIata(req.depIata().toUpperCase());
        p.setArrIata(req.arrIata().toUpperCase());

        p.setPrice(req.price());
        p.setCurrency(req.currency().toUpperCase());

        boolean auto = Boolean.TRUE.equals(req.autoAssign());
        p.setAutoAssigned(auto);

        if (auto) {
            // MVP: auto-assign = actor (collab creates => assigned to that collab; principal creates => assigned to principal)
            p.setAssignedAgent(actor);
        } else {
            // Manual assign only for principal
            if (actor.getRole() != PartnerRole.PARTNER_PRINCIPAL)
                throw new RuntimeException("Attribution manuelle réservée au Responsable principal.");

            if (req.assignedAgentId() == null) throw new RuntimeException("assignedAgentId requis.");
            PartnerUser agent = userRepo.findById(req.assignedAgentId())
                    .orElseThrow(() -> new RuntimeException("Agent introuvable."));
            if (!agent.getAccount().getId().equals(actor.getAccount().getId()))
                throw new RuntimeException("Agent invalide (compte différent).");

            p.setAssignedAgent(agent);
        }

        p.setCreatedBy(actor);
        policyRepo.save(p);

        audit(p, AuditAction.POLICY_CREATED, actor, "Création police: vol " + p.getFlightNumber());
        return toDto(p);
    }

    public List<PolicyDto> list(String authEmail, String q, String status) {
        PartnerUser actor = currentUser(authEmail);

        List<PartnerPolicy> all = policyRepo.findByAccountOrderByCreatedAtDesc(actor.getAccount());

        String qq = (q == null) ? "" : q.trim().toLowerCase();
        String ss = (status == null) ? "ALL" : status.trim().toUpperCase();

        return all.stream()
                .filter(p -> {
                    if (!qq.isBlank()) {
                        boolean match = (p.getClientName() != null && p.getClientName().toLowerCase().contains(qq))
                                || (p.getFlightNumber() != null && p.getFlightNumber().toLowerCase().contains(qq));
                        if (!match) return false;
                    }
                    if (!"ALL".equals(ss) && !p.getStatus().name().equals(ss)) return false;

                    // Collab sees only their own assigned policies (limited dashboard)
                    if (actor.getRole() == PartnerRole.PARTNER_COLLAB) {
                        return p.getAssignedAgent() != null && p.getAssignedAgent().getId().equals(actor.getId());
                    }
                    return true;
                })
                .map(this::toDto)
                .toList();
    }

    public PolicyDto getOne(String authEmail, Long id) {
        PartnerUser actor = currentUser(authEmail);
        PartnerPolicy p = policyRepo.findById(id).orElseThrow(() -> new RuntimeException("Police introuvable."));
        ensureSameAccount(actor, p);

        // Collab: must be assigned to them
        if (actor.getRole() == PartnerRole.PARTNER_COLLAB) {
            if (p.getAssignedAgent() == null || !p.getAssignedAgent().getId().equals(actor.getId()))
                throw new RuntimeException("Accès refusé.");
        }

        audit(p, AuditAction.POLICY_VIEWED, actor, "Consultation");
        return toDto(p);
    }

    @Transactional
    public PolicyDto disable(String authEmail, Long id, DisablePolicyRequest req) {
        PartnerUser actor = currentUser(authEmail);

        // Only principal can disable
        if (actor.getRole() != PartnerRole.PARTNER_PRINCIPAL)
            throw new RuntimeException("Désactivation réservée au Responsable principal.");

        PartnerPolicy p = policyRepo.findById(id).orElseThrow(() -> new RuntimeException("Police introuvable."));
        ensureSameAccount(actor, p);

        if (p.getStatus() == PolicyStatus.DISABLED) return toDto(p);

        p.setStatus(PolicyStatus.DISABLED);
        p.setDisableReason(req.reason());
        p.setDisabledAt(Instant.now());
        policyRepo.save(p);

        audit(p, AuditAction.POLICY_DISABLED, actor, "Justification: " + req.reason());
        return toDto(p);
    }

    public List<AuditDto> auditTrail(String authEmail, Long policyId) {
        PartnerUser actor = currentUser(authEmail);

        PartnerPolicy p = policyRepo.findById(policyId).orElseThrow(() -> new RuntimeException("Police introuvable."));
        ensureSameAccount(actor, p);

        // Collab: must be assigned to them
        if (actor.getRole() == PartnerRole.PARTNER_COLLAB) {
            if (p.getAssignedAgent() == null || !p.getAssignedAgent().getId().equals(actor.getId()))
                throw new RuntimeException("Accès refusé.");
        }

        return auditRepo.findByPolicyIdOrderByCreatedAtDesc(policyId).stream()
                .map(ev -> new AuditDto(
                        ev.getId(),
                        ev.getAction(),
                        ev.getActor() == null ? null : ev.getActor().getEmail(),
                        ev.getDetails(),
                        ev.getCreatedAt()
                ))
                .toList();
    }
}