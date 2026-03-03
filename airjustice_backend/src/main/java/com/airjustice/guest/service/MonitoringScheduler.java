package com.airjustice.guest.service;

import com.airjustice.guest.entity.CaseStatus;
import com.airjustice.guest.repo.FlightCaseRepo;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@EnableScheduling
@Component
public class MonitoringScheduler {

    private final FlightCaseRepo caseRepo;
    private final GuestCaseService service;
    private final long bufferMinutes;

    public MonitoringScheduler(
            FlightCaseRepo caseRepo,
            GuestCaseService service,
            @Value("${airjustice.monitoring.bufferMinutesAfterFlight}") long bufferMinutes
    ) {
        this.caseRepo = caseRepo;
        this.service = service;
        this.bufferMinutes = bufferMinutes;
    }

    @Scheduled(fixedDelay = 60_000) // every 1 min
    public void monitor() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(bufferMinutes);
        var due = caseRepo.findByPaidTrueAndStatusAndScheduledArrivalBefore(CaseStatus.MONITORING, cutoff);

        for (var fc : due) {
            try {
                service.runReviewNow(fc.getTrackingCode()); // MVP uses simulation
            } catch (Exception e) {
                System.out.println("Monitor error for " + fc.getTrackingCode() + ": " + e.getMessage());
            }
        }
    }
}