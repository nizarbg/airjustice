package com.airjustice.guest.repo;

import com.airjustice.guest.entity.FlightCase;
import com.airjustice.guest.entity.CaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlightCaseRepo extends JpaRepository<FlightCase, Long> {
    Optional<FlightCase> findByTrackingCode(String trackingCode);

    List<FlightCase> findByPaidTrueAndStatusAndScheduledArrivalBefore(
            CaseStatus status, LocalDateTime time
    );
}