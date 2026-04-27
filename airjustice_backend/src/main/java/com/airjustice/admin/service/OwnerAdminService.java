package com.airjustice.admin.service;

import com.airjustice.admin.entity.AdminAuditLog;
import com.airjustice.admin.repo.AdminAuditLogRepo;
import com.airjustice.partner.entity.PartnerAccount;
import com.airjustice.partner.entity.PartnerDocument;
import com.airjustice.partner.entity.PartnerStatus;
import com.airjustice.partner.entity.PartnerUser;
import com.airjustice.partner.entity.PartnerRole;
import com.airjustice.partner.repo.PartnerAccountRepo;
import com.airjustice.partner.repo.PartnerDocumentRepo;
import com.airjustice.partner.repo.PartnerUserRepo;
import com.airjustice.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OwnerAdminService {

    /** Non-terminal statuses that form the default "active queue" */
    private static final Set<PartnerStatus> ACTIVE_QUEUE = Set.of(
            PartnerStatus.SUBMITTED,
            PartnerStatus.CONTACT_IN_PROGRESS,
            PartnerStatus.DOCUMENTS_REQUESTED,
            PartnerStatus.DOCUMENTS_RECEIVED,
            PartnerStatus.VERIFICATION_IN_PROGRESS,
            PartnerStatus.PENDING
    );

    private final PartnerAccountRepo accountRepo;
    private final PartnerUserRepo userRepo;
    private final PartnerDocumentRepo documentRepo;
    private final AdminAuditLogRepo auditLogRepo;
    private final JwtService jwtService;
    private final String adminEmail;
    private final String adminPassword;

    public OwnerAdminService(
            PartnerAccountRepo accountRepo,
            PartnerUserRepo userRepo,
            PartnerDocumentRepo documentRepo,
            AdminAuditLogRepo auditLogRepo,
            JwtService jwtService,
            @Value("${app.owner-admin.email:owner@airjustice.local}") String adminEmail,
            @Value("${app.owner-admin.password:Owner123!}") String adminPassword
    ) {
        this.accountRepo = accountRepo;
        this.userRepo = userRepo;
        this.documentRepo = documentRepo;
        this.auditLogRepo = auditLogRepo;
        this.jwtService = jwtService;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    /* ══════════════════════════ Auth ══════════════════════════ */

    public AdminAuthResponse login(AdminLoginRequest req) {
        String email = req.email() == null ? "" : req.email().trim().toLowerCase();
        if (!adminEmail.equalsIgnoreCase(email) || !adminPassword.equals(req.password())) {
            throw new RuntimeException("Identifiants admin invalides.");
        }
        String token = jwtService.createToken(adminEmail, Map.of(
                "role", "OWNER_ADMIN",
                "scope", "owner-admin"
        ));
        return new AdminAuthResponse(token, new AdminUserDto(adminEmail, "OWNER_ADMIN", "Owner Admin"));
    }

    /* ══════════════════════════ Queue listing ══════════════════════════ */

    /**
     * @param statuses  comma-separated PartnerStatus names, blank → active queue, "ALL" → no filter
     * @param country   ISO alpha-2 filter, blank → all
     * @param dateFrom  yyyy-MM-dd lower bound on submittedAt, blank → none
     * @param dateTo    yyyy-MM-dd upper bound on submittedAt, blank → none
     * @param sortBy    "submittedAt" (default ASC) | "country" | "agencyName"
     * @param sortDir   "asc" (default) | "desc"
     */
    public List<AdminPartnerApplicationDto> listApplications(
            String statuses, String country,
            String dateFrom, String dateTo,
            String sortBy, String sortDir
    ) {
        List<PartnerAccount> accounts = accountRepo.findAll();

        // Status filter
        Set<PartnerStatus> allowed = resolveStatuses(statuses);
        if (!allowed.isEmpty()) {
            accounts = accounts.stream()
                    .filter(a -> allowed.contains(a.getStatus()))
                    .collect(Collectors.toList());
        }

        // Country filter
        if (country != null && !country.isBlank() && !"ALL".equalsIgnoreCase(country)) {
            String c = country.trim().toUpperCase();
            accounts = accounts.stream()
                    .filter(a -> c.equals(a.getCountry()))
                    .collect(Collectors.toList());
        }

        // Date range filter
        if (dateFrom != null && !dateFrom.isBlank()) {
            Instant from = LocalDate.parse(dateFrom.trim()).atStartOfDay(ZoneOffset.UTC).toInstant();
            accounts = accounts.stream()
                    .filter(a -> a.getSubmittedAt() == null || !a.getSubmittedAt().isBefore(from))
                    .collect(Collectors.toList());
        }
        if (dateTo != null && !dateTo.isBlank()) {
            Instant to = LocalDate.parse(dateTo.trim()).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
            accounts = accounts.stream()
                    .filter(a -> a.getSubmittedAt() == null || a.getSubmittedAt().isBefore(to))
                    .collect(Collectors.toList());
        }

        // Sort
        Comparator<PartnerAccount> cmp = buildComparator(sortBy);
        if ("desc".equalsIgnoreCase(sortDir)) cmp = cmp.reversed();
        accounts = accounts.stream().sorted(cmp).collect(Collectors.toList());

        return accounts.stream().map(this::toSummary).toList();
    }

    private Set<PartnerStatus> resolveStatuses(String statuses) {
        if (statuses == null || statuses.isBlank()) return ACTIVE_QUEUE;
        if ("ALL".equalsIgnoreCase(statuses.trim())) return Set.of();
        Set<PartnerStatus> result = new LinkedHashSet<>();
        for (String s : statuses.split(",")) {
            String part = s.trim();
            if (part.isBlank()) continue;
            try { result.add(PartnerStatus.valueOf(part.toUpperCase())); }
            catch (IllegalArgumentException ex) { throw new RuntimeException("Statut invalide: " + part); }
        }
        return result;
    }

    private Comparator<PartnerAccount> buildComparator(String sortBy) {
        if ("country".equalsIgnoreCase(sortBy))
            return Comparator.comparing(a -> a.getCountry() == null ? "" : a.getCountry().toLowerCase());
        if ("agencyName".equalsIgnoreCase(sortBy))
            return Comparator.comparing(a -> a.getAgencyName() == null ? "" : a.getAgencyName().toLowerCase());
        // default: submittedAt ASC
        return Comparator.comparing(a -> a.getSubmittedAt() == null ? Instant.EPOCH : a.getSubmittedAt());
    }

    /* ══════════════════════════ Details ═══════════════���══════════ */

    public AdminPartnerApplicationDetailsDto getApplication(Long accountId) {
        PartnerAccount account = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Dossier partenaire introuvable."));
        PartnerUser principal = principalOf(account.getId());
        List<AdminDocumentDto> documents = documentRepo.findByAccountIdOrderByUploadedAtDesc(account.getId())
                .stream().map(this::toDocumentDto).toList();
        List<String> duplicateAlerts = detectDuplicates(account);

        return new AdminPartnerApplicationDetailsDto(
                account.getId(), account.getStatus().name(),
                account.getAgencyName(), account.getCity(), account.getCountry(), account.getAddress(),
                account.getContactEmail(), account.getContactPhone(), account.getContactPersonName(),
                account.getPreferredLanguage(),
                account.getRcNumber(), account.getFiscalNumber(), account.getIataCode(),
                account.getTradeRegisterNumber(), account.getTaxIdentificationNumber(),
                account.isConsentStatus(), account.getConsentTimestamp(), account.getPrivacyPolicyVersion(),
                account.getSubmittedAt(),
                account.isIdentityVerified(), account.isLicenseValid(), account.isCompanyRegistered(),
                account.getReviewNotes(),
                principal == null ? "" : principal.getFullName(),
                principal == null ? "" : principal.getEmail(),
                principal == null ? "" : principal.getPhone(),
                documents, duplicateAlerts
        );
    }

    private List<String> detectDuplicates(PartnerAccount current) {
        List<String> alerts = new ArrayList<>();
        accountRepo.findAll().stream()
                .filter(a -> !a.getId().equals(current.getId()))
                .forEach(other -> {
                    if (current.getAgencyName() != null
                            && current.getAgencyName().equalsIgnoreCase(other.getAgencyName())) {
                        alerts.add("Nom d'agence en doublon avec le dossier #" + other.getId()
                                + " — " + other.getStatus().name());
                    }
                    if (current.getTradeRegisterNumber() != null
                            && !current.getTradeRegisterNumber().isBlank()
                            && current.getTradeRegisterNumber().equalsIgnoreCase(other.getTradeRegisterNumber())) {
                        alerts.add("Numéro RNE en doublon avec le dossier #" + other.getId()
                                + " — " + other.getStatus().name());
                    }
                });
        return alerts;
    }

    /* ══════════════════════════ Verify / Approve / Reject ══════════════════════════ */

    @Transactional
    public AdminPartnerApplicationDetailsDto verifyApplication(Long accountId, AdminVerifyPartnerRequest req) {
        PartnerAccount account = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Dossier partenaire introuvable."));
        account.setRcNumber(trimToNull(req.rcNumber()));
        account.setFiscalNumber(trimToNull(req.fiscalNumber()));
        account.setIataCode(trimToNull(req.iataCode()));
        account.setStatus(PartnerStatus.VERIFICATION_IN_PROGRESS);
        accountRepo.save(account);
        return getApplication(accountId);
    }

    @Transactional
    public AdminPartnerApplicationDetailsDto approveApplication(Long accountId) {
        PartnerAccount account = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Dossier partenaire introuvable."));
        account.setStatus(PartnerStatus.APPROVED);
        accountRepo.save(account);
        return getApplication(accountId);
    }

    @Transactional
    public AdminPartnerApplicationDetailsDto setApplicationStatus(Long accountId, String newStatus) {
        PartnerAccount account = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Dossier partenaire introuvable."));
        PartnerStatus target;
        try { target = PartnerStatus.valueOf(newStatus.toUpperCase()); }
        catch (IllegalArgumentException ex) { throw new RuntimeException("Statut invalide: " + newStatus); }
        account.setStatus(target);
        accountRepo.save(account);
        return getApplication(accountId);
    }

    @Transactional
    public void rejectApplication(Long accountId) {
        PartnerAccount account = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Dossier partenaire introuvable."));
        List<PartnerUser> users = userRepo.findAll().stream()
                .filter(u -> u.getAccount() != null && accountId.equals(u.getAccount().getId())).toList();
        List<PartnerDocument> documents = documentRepo.findByAccountIdOrderByUploadedAtDesc(accountId);
        if (!documents.isEmpty()) documentRepo.deleteAll(documents);
        if (!users.isEmpty()) userRepo.deleteAll(users);
        accountRepo.delete(account);
    }

    /* ══════════════════════════ Checklist ══════════════════════════ */

    @Transactional
    public AdminPartnerApplicationDetailsDto updateChecklist(Long accountId, AdminChecklistRequest req) {
        PartnerAccount account = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Dossier partenaire introuvable."));
        account.setIdentityVerified(req.identityVerified());
        account.setLicenseValid(req.licenseValid());
        account.setCompanyRegistered(req.companyRegistered());
        account.setReviewNotes(trimToNull(req.reviewNotes()));
        accountRepo.save(account);
        return getApplication(accountId);
    }

    /* ══════════════════════════ Audit logging ══════════════════════════ */

    public void logQueueViewAccessed(String adminId) {
        auditLog("queue_view_accessed", adminId, null);
    }

    public void logComplianceReviewAccessed(String adminId, Long agencyId) {
        auditLog("compliance_review_accessed", adminId, agencyId);
    }

    private void auditLog(String eventType, String adminId, Long agencyId) {
        AdminAuditLog entry = new AdminAuditLog();
        entry.setEventType(eventType);
        entry.setAdminId(adminId != null ? adminId : "unknown");
        entry.setAgencyId(agencyId);
        entry.setTimestamp(Instant.now());
        auditLogRepo.save(entry);
    }

    /* ══════════════════════════ Private helpers ══════════════════════════ */

    private AdminPartnerApplicationDto toSummary(PartnerAccount account) {
        PartnerUser principal = principalOf(account.getId());
        int documentsCount = documentRepo.findByAccountIdOrderByUploadedAtDesc(account.getId()).size();
        return new AdminPartnerApplicationDto(
                account.getId(), account.getStatus().name(),
                account.getAgencyName(), account.getCity(), account.getCountry(),
                principal == null ? "" : principal.getFullName(),
                account.getContactEmail(), documentsCount,
                account.getSubmittedAt()
        );
    }

    private AdminDocumentDto toDocumentDto(PartnerDocument document) {
        return new AdminDocumentDto(document.getId(), document.getType(),
                document.getFilename(), document.getUploadedAt());
    }

    private PartnerUser principalOf(Long accountId) {
        return userRepo.findAll().stream()
                .filter(u -> u.getAccount() != null && accountId.equals(u.getAccount().getId()))
                .filter(u -> u.getRole() == PartnerRole.PARTNER_PRINCIPAL)
                .findFirst().orElse(null);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    /* ══════════════════════════ Records ═════════════════��════════ */

    public record AdminLoginRequest(String email, String password) {}
    public record AdminUserDto(String email, String role, String displayName) {}
    public record AdminAuthResponse(String token, AdminUserDto user) {}
    public record AdminDocumentDto(Long id, String type, String filename, Instant uploadedAt) {}

    public record AdminPartnerApplicationDto(
            Long id, String status, String agencyName, String city, String country,
            String managerName, String contactEmail, int documentsCount, Instant submittedAt
    ) {}

    public record AdminPartnerApplicationDetailsDto(
            Long id, String status, String agencyName, String city, String country,
            String address, String contactEmail, String contactPhone, String contactPersonName,
            String preferredLanguage, String rcNumber, String fiscalNumber, String iataCode,
            String tradeRegisterNumber, String taxIdentificationNumber,
            boolean consentStatus, Instant consentTimestamp, String privacyPolicyVersion,
            Instant submittedAt,
            boolean identityVerified, boolean licenseValid, boolean companyRegistered,
            String reviewNotes,
            String managerName, String managerEmail, String managerPhone,
            List<AdminDocumentDto> documents,
            List<String> duplicateAlerts
    ) {}

    public record AdminVerifyPartnerRequest(String rcNumber, String fiscalNumber, String iataCode) {}

    public record AdminChecklistRequest(
            boolean identityVerified, boolean licenseValid,
            boolean companyRegistered, String reviewNotes
    ) {}
}
