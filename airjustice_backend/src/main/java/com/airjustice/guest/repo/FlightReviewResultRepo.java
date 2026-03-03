package com.airjustice.guest.repo;

import com.airjustice.guest.entity.FlightReviewResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FlightReviewResultRepo extends JpaRepository<FlightReviewResult, Long> {
    Optional<FlightReviewResult> findByFlightCaseTrackingCode(String trackingCode);
    Optional<FlightReviewResult> findByFlightCaseId(Long caseId);
}