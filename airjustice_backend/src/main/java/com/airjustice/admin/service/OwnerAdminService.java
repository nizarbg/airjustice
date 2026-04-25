package com.airjustice.admin.service;

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

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
public class OwnerAdminService {

    private final PartnerAccountRepo accountRepo;
    private final PartnerUserRepo userRepo;
    private final PartnerDocumentRepo documentRepo;
    private final JwtService jwtService;
    private final String adminEmail;
    private final String adminPassword;

    public OwnerAdminService(
            PartnerAccountRepo accountRepo,
            PartnerUserRepo userRepo,
            PartnerDocumentRepo documentRepo,
            JwtService jwtService,
            @Value("${app.owner-admin.email:owner@airjustice.local}") String adminEmail,
            @Value("${app.owner-admin.password:Owner123!}") String adminPassword
    ) {
        this.accountRepo = accountRepo;
        this.userRepo = userRepo;
        this.documentRepo = documentRepo;
        this.jwtService = jwtService;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

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

    public List<AdminPartnerApplicationDto> listApplications(String status) {
        List<PartnerAccount> accounts = accountRepo.findAll().stream()
                .sorted(Comparator.comparing(PartnerAccount::getId).reversed())
                .toList();

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            PartnerStatus target;
            try {
                target = PartnerStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new RuntimeException("Statut invalide.");
            }
            accounts = accounts.stream().filter(a -> a.getStatus() == target).toList();
        }

        return accounts.stream().map(this::toSummary).toList();
    }

    public AdminPartnerApplicationDetailsDto getApplication(Long accountId) {
        PartnerAccount account = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Dossier partenaire introuvable."));

        PartnerUser principal = principalOf(account.getId());
        List<AdminDocumentDto> documents = documentRepo.findByAccountIdOrderByUploadedAtDesc(account.getId())
                .stream()
                .map(this::toDocumentDto)
                .toList();

        return new AdminPartnerApplicationDetailsDto(
                account.getId(),
                account.getStatus().name(),
                account.getAgencyName(),
                account.getCity(),
                account.getCountry(),
                account.getAddress(),
                account.getContactEmail(),
                account.getContactPhone(),
                account.getContactPersonName(),
                account.getPreferredLanguage(),
                account.getRcNumber(),
                account.getFiscalNumber(),
                account.getIataCode(),
                account.getTradeRegisterNumber(),
                account.getTaxIdentificationNumber(),
                account.isConsentStatus(),
                account.getConsentTimestamp(),
                account.getPrivacyPolicyVersion(),
                principal == null ? "" : principal.getFullName(),
                principal == null ? "" : principal.getEmail(),
                principal == null ? "" : principal.getPhone(),
                documents
        );
    }

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
        try {
            target = PartnerStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Statut invalide: " + newStatus);
        }
        account.setStatus(target);
        accountRepo.save(account);
        return getApplication(accountId);
    }

    @Transactional
    public void rejectApplication(Long accountId) {
        PartnerAccount account = accountRepo.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Dossier partenaire introuvable."));
        List<PartnerUser> users = userRepo.findAll().stream()
                .filter(user -> user.getAccount() != null && accountId.equals(user.getAccount().getId()))
                .toList();
        List<PartnerDocument> documents = documentRepo.findByAccountIdOrderByUploadedAtDesc(accountId);
        if (!documents.isEmpty()) {
            documentRepo.deleteAll(documents);
        }
        if (!users.isEmpty()) {
            userRepo.deleteAll(users);
        }
        accountRepo.delete(account);
    }

    private AdminPartnerApplicationDto toSummary(PartnerAccount account) {
        PartnerUser principal = principalOf(account.getId());
        int documentsCount = documentRepo.findByAccountIdOrderByUploadedAtDesc(account.getId()).size();
        return new AdminPartnerApplicationDto(
                account.getId(),
                account.getStatus().name(),
                account.getAgencyName(),
                account.getCity(),
                account.getCountry(),
                principal == null ? "" : principal.getFullName(),
                account.getContactEmail(),
                documentsCount
        );
    }

    private AdminDocumentDto toDocumentDto(PartnerDocument document) {
        return new AdminDocumentDto(
                document.getId(),
                document.getType(),
                document.getFilename(),
                document.getUploadedAt()
        );
    }

    private PartnerUser principalOf(Long accountId) {
        return userRepo.findAll().stream()
                .filter(user -> user.getAccount() != null && accountId.equals(user.getAccount().getId()))
                .filter(user -> user.getRole() == PartnerRole.PARTNER_PRINCIPAL)
                .findFirst()
                .orElse(null);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public record AdminLoginRequest(String email, String password) {}
    public record AdminUserDto(String email, String role, String displayName) {}
    public record AdminAuthResponse(String token, AdminUserDto user) {}
    public record AdminDocumentDto(Long id, String type, String filename, java.time.Instant uploadedAt) {}
    public record AdminPartnerApplicationDto(
            Long id,
            String status,
            String agencyName,
            String city,
            String country,
            String managerName,
            String contactEmail,
            int documentsCount
    ) {}
    public record AdminPartnerApplicationDetailsDto(
            Long id,
            String status,
            String agencyName,
            String city,
            String country,
            String address,
            String contactEmail,
            String contactPhone,
            String contactPersonName,
            String preferredLanguage,
            String rcNumber,
            String fiscalNumber,
            String iataCode,
            String tradeRegisterNumber,
            String taxIdentificationNumber,
            boolean consentStatus,
            java.time.Instant consentTimestamp,
            String privacyPolicyVersion,
            String managerName,
            String managerEmail,
            String managerPhone,
            List<AdminDocumentDto> documents
    ) {}
    public record AdminVerifyPartnerRequest(String rcNumber, String fiscalNumber, String iataCode) {}
}


