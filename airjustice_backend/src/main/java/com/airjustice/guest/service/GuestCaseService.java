package com.airjustice.guest.service;

import com.airjustice.guest.dto.*;
import com.airjustice.guest.entity.*;
import com.airjustice.guest.repo.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GuestCaseService {

    private final FlightCaseRepo caseRepo;
    private final FlightReviewResultRepo resultRepo;
    private final NotificationService notifications;

    public GuestCaseService(FlightCaseRepo caseRepo, FlightReviewResultRepo resultRepo, NotificationService notifications) {
        this.caseRepo = caseRepo;
        this.resultRepo = resultRepo;
        this.notifications = notifications;
    }

    // MVP flight search: return a couple of fake options based on input
    public List<FlightOptionDto> search(FlightSearchRequest req) {
        LocalDateTime dep = req.date().atTime(10, 30);
        LocalDateTime arr = req.date().atTime(13, 15);

        String fn = (req.flightNumber() == null || req.flightNumber().isBlank())
                ? "TU123"
                : req.flightNumber().toUpperCase();

        return List.of(
                new FlightOptionDto(fn, "Tunisair", req.depIata().toUpperCase(), req.arrIata().toUpperCase(), dep, arr),
                new FlightOptionDto(fn + "A", "Tunisair", req.depIata().toUpperCase(), req.arrIata().toUpperCase(), dep.plusHours(2), arr.plusHours(2))
        );
    }

    @Transactional
    public CheckoutResponse checkout(CheckoutRequest req) {
        FlightCase fc = new FlightCase();
        fc.setFullName(req.fullName());
        fc.setEmail(req.email());
        fc.setPhone(req.phone());

        fc.setFlightNumber(req.flightNumber().toUpperCase());
        fc.setFlightDate(req.flightDate());
        fc.setDepIata(req.depIata().toUpperCase());
        fc.setArrIata(req.arrIata().toUpperCase());
        fc.setAirline(req.airline());

        fc.setScheduledDeparture(req.scheduledDeparture());
        fc.setScheduledArrival(req.scheduledArrival());

        // Payment: mocked as paid=true for MVP
        fc.setPaid(true);
        fc.setStatus(CaseStatus.MONITORING);
        caseRepo.save(fc);

        // Notify: review started
        notifications.notifyBoth(fc, NotifyType.REVIEW_STARTED,
                "AirJustice: votre vol sera analysé après le voyage. Code de suivi: " + fc.getTrackingCode());

        return new CheckoutResponse(fc.getTrackingCode(),
                "Paiement confirmé. Votre vol sera suivi. Code: " + fc.getTrackingCode());
    }

    public PublicCaseDto getCase(String trackingCode) {
        FlightCase fc = caseRepo.findByTrackingCode(trackingCode)
                .orElseThrow(() -> new RuntimeException("Code de suivi introuvable."));

        return new PublicCaseDto(
                fc.getTrackingCode(),
                fc.getStatus(),
                fc.getFlightNumber(),
                fc.getFlightDate(),
                fc.getDepIata(),
                fc.getArrIata(),
                fc.getAirline(),
                fc.getScheduledDeparture(),
                fc.getScheduledArrival()
        );
    }

    public PublicResultDto getResult(String trackingCode) {
        FlightReviewResult r = resultRepo.findByFlightCaseTrackingCode(trackingCode)
                .orElseThrow(() -> new RuntimeException("Résultat non disponible pour le moment."));
        return new PublicResultDto(
                r.getOutcome(),
                r.getDelayMinutes(),
                r.isEligible(),
                r.getCompensationBand(),
                r.getUserMessage(),
                r.getClaimLink()
        );
    }

    // DEV / MVP review simulation
    @Transactional
    public void runReviewNow(String trackingCode) {
        FlightCase fc = caseRepo.findByTrackingCode(trackingCode)
                .orElseThrow(() -> new RuntimeException("Code de suivi introuvable."));

        // Simulate: if flightNumber ends with odd char => disruption
        boolean disruption = (fc.getFlightNumber().hashCode() & 1) == 1;

        FlightReviewResult r = resultRepo.findByFlightCaseId(fc.getId()).orElseGet(() -> {
            FlightReviewResult nr = new FlightReviewResult();
            nr.setFlightCase(fc);
            return nr;
        });

        if (!disruption) {
            fc.setStatus(CaseStatus.CLEARED);
            r.setOutcome(ReviewOutcome.NO_ISSUE);
            r.setEligible(false);
            r.setDelayMinutes(0);
            r.setCompensationBand(null);
            r.setUserMessage("Bonne nouvelle: aucune perturbation éligible détectée pour votre vol.");
            r.setClaimLink(null);
            resultRepo.save(r);

            notifications.notifyBoth(fc, NotifyType.POST_FLIGHT_NO_ISSUE, r.getUserMessage());
            return;
        }

        // Disruption example
        fc.setStatus(CaseStatus.DISRUPTION_FOUND);
        r.setOutcome(ReviewOutcome.DELAY);
        r.setDelayMinutes(190);
        r.setEligible(true);
        r.setCompensationBand(250); // placeholder band
        r.setUserMessage(
                "Votre vol semble avoir subi une perturbation. Vous pourriez être éligible à une indemnisation (ex: " +
                        r.getCompensationBand() + "€). Consultez les règles et déposez une réclamation via le lien."
        );
        r.setClaimLink("https://example.com/claim?ref=" + fc.getTrackingCode()); // replace with AirHelp affiliate
        resultRepo.save(r);

        notifications.notifyBoth(fc, NotifyType.POST_FLIGHT_ELIGIBLE,
                r.getUserMessage() + " Lien: " + r.getClaimLink());
    }
}