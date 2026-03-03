package com.airjustice.guest.controller;

import com.airjustice.guest.dto.*;
import com.airjustice.guest.service.GuestCaseService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "http://localhost:5173")
public class PublicGuestController {

    private final GuestCaseService service;

    public PublicGuestController(GuestCaseService service) {
        this.service = service;
    }

    @PostMapping("/flight/search")
    public List<FlightOptionDto> search(@Valid @RequestBody FlightSearchRequest req) {
        return service.search(req);
    }

    @PostMapping("/flight/checkout")
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest req) {
        return service.checkout(req);
    }

    @GetMapping("/cases/{trackingCode}")
    public PublicCaseDto getCase(@PathVariable String trackingCode) {
        return service.getCase(trackingCode);
    }

    @GetMapping("/cases/{trackingCode}/result")
    public PublicResultDto getResult(@PathVariable String trackingCode) {
        return service.getResult(trackingCode);
    }

    // DEV only (demo trigger)
    @PostMapping("/dev/cases/{trackingCode}/trigger-review")
    public Map<String, Object> trigger(@PathVariable String trackingCode) {
        service.runReviewNow(trackingCode);
        return Map.of("triggered", true);
    }
}