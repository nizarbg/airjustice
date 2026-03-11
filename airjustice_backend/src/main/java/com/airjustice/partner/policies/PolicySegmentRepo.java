package com.airjustice.partner.policies;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PolicySegmentRepo extends JpaRepository<PolicySegment, Long> {
    List<PolicySegment> findByPolicyId(Long policyId);
}