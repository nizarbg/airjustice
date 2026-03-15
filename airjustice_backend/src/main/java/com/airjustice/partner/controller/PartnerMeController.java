package com.airjustice.partner.controller;

import com.airjustice.partner.dto.*;
import com.airjustice.partner.service.PartnerService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/partner/me")
@CrossOrigin(origins = "http://localhost:5173")
public class PartnerMeController {

    private final PartnerService service;
    public PartnerMeController(PartnerService service) { this.service = service; }

    @GetMapping
    public MeDto me(Authentication auth) {
        return service.getMe(auth.getName());
    }

    @PutMapping("/password")
    public Map<String, Object> changePassword(Authentication auth, @Valid @RequestBody ChangePasswordRequest req) {
        service.changeMyPassword(auth.getName(), req.currentPassword(), req.newPassword());
        return Map.of("changed", true);
    }

    @PutMapping("/2fa-method")
    public Map<String, Object> set2faMethod(Authentication auth, @Valid @RequestBody Set2faMethodRequest req) {
        service.setMy2faMethod(auth.getName(), req.twoFactorMethod());
        return Map.of("twoFactorMethod", req.twoFactorMethod().toUpperCase());
    }

    @PutMapping("/notifications")
    public Map<String, Object> updateNotifications(Authentication auth, @RequestBody Map<String, Object> body) {
        boolean notifyEmail  = Boolean.TRUE.equals(body.get("notifyEmail"));
        boolean notifySms    = Boolean.TRUE.equals(body.get("notifySms"));
        boolean notifySystem = Boolean.TRUE.equals(body.get("notifySystem"));
        service.updateNotificationPreferences(auth.getName(), notifyEmail, notifySms, notifySystem);
        return Map.of("notifyEmail", notifyEmail, "notifySms", notifySms, "notifySystem", notifySystem);
    }

    @PutMapping("/profile")
    public MeDto updateProfile(Authentication auth, @RequestBody Map<String, Object> body) {
        String phone = body.get("phone") != null ? body.get("phone").toString() : null;
        String email = body.get("email") != null ? body.get("email").toString() : null;
        return service.updateMyProfile(auth.getName(), phone, email);
    }
}