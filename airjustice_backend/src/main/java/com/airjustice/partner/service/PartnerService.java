package com.airjustice.partner.service;

import com.airjustice.partner.dto.*;
import com.airjustice.partner.entity.*;
import com.airjustice.partner.repo.*;
import com.airjustice.security.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class PartnerService {

    private final PartnerUserRepo userRepo;
    private final PartnerAccountRepo accountRepo;
    private final PartnerDocumentRepo docRepo;
    private final HashService hash;
    private final OtpService otpService;
    private final JwtService jwt;
    private final long otpExpiryMinutes;

    public PartnerService(
            PartnerUserRepo userRepo,
            PartnerAccountRepo accountRepo,
            PartnerDocumentRepo docRepo,
            HashService hash,
            OtpService otpService,
            JwtService jwt,
            @Value("${app.jwt.otpExpiryMinutes}") long otpExpiryMinutes
    ) {
        this.userRepo = userRepo;
        this.accountRepo = accountRepo;
        this.docRepo = docRepo;
        this.hash = hash;
        this.otpService = otpService;
        this.jwt = jwt;
        this.otpExpiryMinutes = otpExpiryMinutes;
    }

    // Step 1: partner apply -> creates account + principal user (status PENDING)
    @Transactional
    public void apply(PartnerApplyRequest req) {
        var acc = new PartnerAccount();
        acc.setAgencyName(req.agencyName());
        acc.setCity(req.city());
        acc.setCountry(req.country());
        acc.setPreferredLanguage(req.language());
        acc.setContactEmail(req.email());
        acc.setContactPhone(req.phone());
        acc.setStatus(PartnerStatus.SUBMITTED);
        accountRepo.save(acc);

        var principal = new PartnerUser();
        principal.setAccount(acc);
        principal.setRole(PartnerRole.PARTNER_PRINCIPAL);
        principal.setFullName(req.managerName());
        principal.setEmail(req.email().toLowerCase());
        principal.setPhone(req.phone());
        principal.setPasswordHash(hash.hash(req.password()));
        principal.setTwoFactorEnabled(true);
        principal.setUsername(generateUsername(req.managerName(), req.agencyName()));

        userRepo.save(principal);
    }

    public PartnerAuthResponse login(PartnerLoginRequest req) {
        PartnerUser user;
        String id = req.identifier().trim();

        if (id.contains("@")) {
            user = userRepo.findByEmailIgnoreCase(id).orElseThrow(() -> new RuntimeException("Compte introuvable."));
        } else {
            user = userRepo.findByUsernameIgnoreCase(id).orElseThrow(() -> new RuntimeException("Compte introuvable."));
        }

        if (hash.matches(req.password(), user.getPasswordHash()))
            throw new RuntimeException("Email ou mot de passe incorrect.");

        PartnerStatus status = user.getAccount().getStatus();
        if (status == PartnerStatus.REJECTED) {
            throw new RuntimeException("Votre demande a été refusée par l'administrateur.");
        }
        if (!status.canLogin()) {
            String msg = switch (status) {
                case SUBMITTED              -> "Votre demande a été soumise et est en attente de traitement.";
                case CONTACT_IN_PROGRESS    -> "AirJustice est en train de prendre contact avec vous.";
                case DOCUMENTS_REQUESTED    -> "Des documents supplémentaires ont été demandés. Veuillez les transmettre.";
                case DOCUMENTS_RECEIVED     -> "Vos documents ont été reçus et sont en attente de vérification.";
                case VERIFICATION_IN_PROGRESS -> "Votre dossier est en cours de vérification.";
                default                     -> "Votre compte n'est pas encore activé.";
            };
            throw new RuntimeException(msg);
        }

        // Track login
        user.setLastLoginAt(Instant.now());
        userRepo.save(user);

        // If 2FA enabled => return tempToken and send OTP
        if (user.isTwoFactorEnabled()) {
            String otp = otpService.generate6();
            user.setOtpHash(hash.hash(otp));
            user.setOtpExpiresAt(Instant.now().plusSeconds(otpExpiryMinutes * 60));
            userRepo.save(user);

            String dest = (user.getTwoFactorMethod() == TwoFactorMethod.SMS)
                    ? (user.getPhone() == null ? user.getEmail() : user.getPhone())
                    : user.getEmail();

            otpService.sendOtp(dest, otp);

            String tempToken = jwt.createToken(user.getEmail(), Map.of(
                    "role", user.getRole().name(),
                    "otp_pending", true
            ));

            return new PartnerAuthResponse(true, tempToken, null, null, status.name());
        }

        activateIfVerified(user);
        return new PartnerAuthResponse(false, null, issueToken(user), toDto(user), user.getAccount().getStatus().name());
    }

    public PartnerAuthResponse verifyOtp(String tempToken, OtpVerifyRequest req) {
        Claims c = jwt.parse(tempToken);
        Boolean pending = (Boolean) c.getOrDefault("otp_pending", false);
        if (!Boolean.TRUE.equals(pending)) throw new RuntimeException("Token OTP invalide.");

        String email = c.getSubject();
        var user = userRepo.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Compte introuvable."));

        if (user.getOtpExpiresAt() == null || Instant.now().isAfter(user.getOtpExpiresAt()))
            throw new RuntimeException("OTP expiré. Reconnectez-vous.");

        if (user.getOtpHash() == null || hash.matches(req.otp(), user.getOtpHash()))
            throw new RuntimeException("OTP incorrect.");

        // Clear otp
        user.setOtpHash(null);
        user.setOtpExpiresAt(null);
        userRepo.save(user);

        activateIfVerified(user);
        return new PartnerAuthResponse(false, null, issueToken(user), toDto(user), user.getAccount().getStatus().name());
    }

    public PartnerAccountLimitedDto getAccountLimited(String email) {
        var u = currentUser(email);
        var acc = u.getAccount();

        boolean low = acc.getPrepaidBalance().compareTo(acc.getLowBalanceThreshold()) < 0;
        return new PartnerAccountLimitedDto(
                acc.getAgencyName(),
                acc.getPrepaidBalance(),
                acc.getLowBalanceThreshold(),
                low
        );
    }

    public MeDto getMe(String email) {
        var u = currentUser(email);
        return new MeDto(
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                u.getPhone(),
                u.getRole().name(),
                u.getTwoFactorMethod() == null ? "EMAIL" : u.getTwoFactorMethod().name(),
                u.isTwoFactorEnabled(),
                u.isNotifyEmail(),
                u.isNotifySms(),
                u.isNotifySystem()
        );
    }

    @Transactional
    public void changeMyPassword(String email, String currentPassword, String newPassword) {
        var u = currentUser(email);
        if (hash.matches(currentPassword, u.getPasswordHash())) {
            throw new RuntimeException("Mot de passe actuel incorrect.");
        }
        u.setPasswordHash(hash.hash(newPassword));
        userRepo.save(u);
    }

    @Transactional
    public void setMy2faMethod(String email, String method) {
        var u = currentUser(email);

        TwoFactorMethod m;
        try {
            m = TwoFactorMethod.valueOf(method.toUpperCase());
        } catch (Exception e) {
            throw new RuntimeException("Méthode invalide. Utilisez EMAIL ou SMS.");
        }

        u.setTwoFactorMethod(m);
        userRepo.save(u);
    }

    @Transactional
    public void updateNotificationPreferences(String email, boolean notifyEmail, boolean notifySms, boolean notifySystem) {
        var u = currentUser(email);
        u.setNotifyEmail(notifyEmail);
        u.setNotifySms(notifySms);
        u.setNotifySystem(notifySystem);
        userRepo.save(u);
    }

    @Transactional
    public MeDto updateMyProfile(String email, String phone, String newEmail) {
        var u = currentUser(email);
        if (phone != null) u.setPhone(phone.trim());
        if (newEmail != null && !newEmail.isBlank()) {
            String lower = newEmail.trim().toLowerCase();
            if (!lower.equals(u.getEmail())) {
                if (userRepo.findByEmailIgnoreCase(lower).isPresent())
                    throw new RuntimeException("Cet email est déjà utilisé.");
                u.setEmail(lower);
            }
        }
        userRepo.save(u);
        return getMe(u.getEmail());
    }

    // Principal resets collaborator password
    @Transactional
    public void resetCollaboratorPassword(String principalEmail, Long collaboratorId, String newPassword) {
        var principal = currentUser(principalEmail);
        ensurePrincipal(principal);

        var target = userRepo.findById(collaboratorId)
                .orElseThrow(() -> new RuntimeException("Collaborateur introuvable."));

        if (!target.getAccount().getId().equals(principal.getAccount().getId()))
            throw new RuntimeException("Accès refusé.");

        if (target.getRole() != PartnerRole.PARTNER_COLLAB)
            throw new RuntimeException("Cible invalide.");

        target.setPasswordHash(hash.hash(newPassword));
        userRepo.save(target);
    }

    private String issueToken(PartnerUser user) {
        return jwt.createToken(user.getEmail(), Map.of(
                "role", user.getRole().name(),
                "accountId", user.getAccount().getId(),
                "userId", user.getId()
        ));
    }

    private PartnerUserDto toDto(PartnerUser u) {
        return new PartnerUserDto(u.getId(), u.getAccount().getId(), u.getFullName(), u.getEmail(), u.getRole().name(), u.getLastLoginAt());
    }

    private PartnerUser currentUser(String email) {
        return userRepo.findByEmailIgnoreCase(email).orElseThrow();
    }

    // Account view (both principal + collaborators)
    public PartnerAccountDto getAccount(String email) {
        var u = currentUser(email);
        var acc = u.getAccount();

        String principalName = userRepo.findAll().stream()
                .filter(x -> x.getAccount().getId().equals(acc.getId()))
                .filter(x -> x.getRole() == PartnerRole.PARTNER_PRINCIPAL)
                .map(PartnerUser::getFullName)
                .findFirst().orElse("");

        return new PartnerAccountDto(
                acc.getId(),
                acc.getStatus().name(),
                principalName,
                acc.getAgencyName(),
                acc.getCity(),
                acc.getCountry(),
                acc.getContactEmail(),
                acc.getContactPhone(),
                acc.getPreferredLanguage(),
                acc.getRcNumber(),
                acc.getFiscalNumber(),
                acc.getIataCode(),
                acc.getPrepaidBalance(),
                acc.getLowBalanceThreshold()
        );
    }

    private void ensurePrincipal(PartnerUser u) {
        if (u.getRole() != PartnerRole.PARTNER_PRINCIPAL) {
            throw new RuntimeException("Accès refusé: Responsable principal uniquement.");
        }
    }

    @Transactional
    public PartnerAccountDto updateContact(String email, UpdateContactRequest req) {
        var u = currentUser(email);
        ensurePrincipal(u);

        var acc = u.getAccount();
        acc.setContactEmail(req.contactEmail());
        acc.setContactPhone(req.contactPhone());
        acc.setPreferredLanguage(req.preferredLanguage());
        accountRepo.save(acc);
        return getAccount(email);
    }

    @Transactional
    public PartnerAccountDto updateAgency(String email, UpdateAgencyRequest req) {
        var u = currentUser(email);
        ensurePrincipal(u);

        var acc = u.getAccount();
        acc.setAgencyName(req.agencyName());
        acc.setCity(req.city());
        acc.setCountry(req.country());
        accountRepo.save(acc);
        return getAccount(email);
    }

    // Balance + alerts
    public Map<String, Object> getBalance(String email) {
        var u = currentUser(email);
        var acc = u.getAccount();

        boolean low = acc.getPrepaidBalance().compareTo(acc.getLowBalanceThreshold()) < 0;

        return Map.of(
                "prepaidBalance", acc.getPrepaidBalance(),
                "lowBalanceThreshold", acc.getLowBalanceThreshold(),
                "lowBalanceAlert", low
        );
    }

    @Transactional
    public Map<String, Object> setLowBalanceThreshold(String email, BigDecimal threshold) {
        var u = currentUser(email);
        ensurePrincipal(u);
        var acc = u.getAccount();
        acc.setLowBalanceThreshold(threshold);
        accountRepo.save(acc);
        return getBalance(email);
    }

    // Collaborators (principal only)
    @Transactional
    public PartnerUserDto addCollaborator(String email, AddCollaboratorRequest req) {
        var principal = currentUser(email);
        ensurePrincipal(principal);

        if (userRepo.findByEmailIgnoreCase(req.email()).isPresent())
            throw new RuntimeException("Email déjà utilisé.");

        var c = new PartnerUser();
        c.setAccount(principal.getAccount());
        c.setRole(PartnerRole.PARTNER_COLLAB);
        c.setFullName(req.fullName());
        c.setEmail(req.email().toLowerCase());
        c.setPhone(req.phone());
        c.setPasswordHash(hash.hash(req.tempPassword()));
        c.setTwoFactorEnabled(true);
        c.setUsername(generateUsername(req.fullName(), principal.getAccount().getAgencyName()));
        userRepo.save(c);

        return toDto(c);
    }

    public List<PartnerUserDto> listCollaborators(String email) {
        var u = currentUser(email);
        var accId = u.getAccount().getId();

        return userRepo.findAll().stream()
                .filter(x -> x.getAccount().getId().equals(accId))
                .filter(x -> x.getRole() == PartnerRole.PARTNER_COLLAB)
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void deleteCollaborator(String email, Long collaboratorId) {
        var principal = currentUser(email);
        ensurePrincipal(principal);

        var target = userRepo.findById(collaboratorId)
                .orElseThrow(() -> new RuntimeException("Collaborateur introuvable."));

        if (!target.getAccount().getId().equals(principal.getAccount().getId()))
            throw new RuntimeException("Accès refusé.");

        if (target.getRole() != PartnerRole.PARTNER_COLLAB)
            throw new RuntimeException("Impossible de supprimer le Responsable principal.");

        userRepo.delete(target);
    }

    // Documents
    @Transactional
    public DocumentDto uploadAuthorization(String email, MultipartFile file) throws Exception {
        var u = currentUser(email);
        ensurePrincipal(u); // only principal uploads official docs

        var doc = new PartnerDocument();
        doc.setAccount(u.getAccount());
        doc.setType("AUTHORIZATION");
        doc.setFilename(file.getOriginalFilename());
        doc.setContentType(file.getContentType());
        doc.setContent(file.getBytes());

        docRepo.save(doc);

        return new DocumentDto(doc.getId(), doc.getType(), doc.getFilename(), doc.getUploadedAt());
    }

    public List<DocumentDto> listDocuments(String email) {
        var u = currentUser(email);
        return docRepo.findByAccountIdOrderByUploadedAtDesc(u.getAccount().getId())
                .stream()
                .map(d -> new DocumentDto(d.getId(), d.getType(), d.getFilename(), d.getUploadedAt()))
                .toList();
    }

    public PartnerDocument getDocument(String email, Long id) {
        var u = currentUser(email);
        var d = docRepo.findById(id).orElseThrow(() -> new RuntimeException("Document introuvable."));
        if (!d.getAccount().getId().equals(u.getAccount().getId()))
            throw new RuntimeException("Accès refusé.");
        return d;
    }

    // 2FA toggle (principal only for now)
    @Transactional
    public void setTwoFactor(String email, boolean enabled) {
        var u = currentUser(email);
        ensurePrincipal(u);
        u.setTwoFactorEnabled(enabled);
        userRepo.save(u);
    }

    private String generateUsername(String managerName, String agencyName) {
        String base = (managerName + "." + agencyName)
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", ".");
        base = base.replaceAll("^\\.|\\.$", "");
        return base.length() > 30 ? base.substring(0, 30) : base;
    }

    @Transactional
    protected void activateIfVerified(PartnerUser user) {
        PartnerStatus s = user.getAccount().getStatus();
        if (s == PartnerStatus.VERIFIED || s == PartnerStatus.VERIFICATION_IN_PROGRESS) {
            user.getAccount().setStatus(PartnerStatus.APPROVED);
            accountRepo.save(user.getAccount());
        }
    }

    @Transactional
    public void submitVerification(
            String principalEmail,
            String rcNumber,
            String fiscalNumber,
            String iataCode,
            MultipartFile file
    ) throws Exception {
        var principal = userRepo.findByEmailIgnoreCase(principalEmail.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Compte partenaire introuvable."));

        if (principal.getRole() != PartnerRole.PARTNER_PRINCIPAL) {
            throw new RuntimeException("Compte principal requis.");
        }

        var acc = principal.getAccount();
        acc.setRcNumber(rcNumber == null || rcNumber.isBlank() ? null : rcNumber.trim());
        acc.setFiscalNumber(fiscalNumber == null || fiscalNumber.isBlank() ? null : fiscalNumber.trim());
        acc.setIataCode(iataCode == null || iataCode.isBlank() ? null : iataCode.trim());
        acc.setStatus(PartnerStatus.DOCUMENTS_RECEIVED);        accountRepo.save(acc);

        var doc = new PartnerDocument();
        doc.setAccount(acc);
        doc.setType("AUTHORIZATION");
        doc.setFilename(file.getOriginalFilename());
        doc.setContentType(file.getContentType());
        doc.setContent(file.getBytes());
        docRepo.save(doc);

        new DocumentDto(doc.getId(), doc.getType(), doc.getFilename(), doc.getUploadedAt());
    }
}

