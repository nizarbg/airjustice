package com.airjustice.admin.controller;

import com.airjustice.admin.service.OwnerAdminService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
@CrossOrigin(origins = "http://localhost:5173")
@AllArgsConstructor
public class OwnerAdminAuthController {

    private final OwnerAdminService service;

    @PostMapping("/login")
    public OwnerAdminService.AdminAuthResponse login(@Valid @RequestBody OwnerAdminService.AdminLoginRequest req) {
        return service.login(req);
    }
}

