package com.airjustice.partner.policies;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PolicyAuditRepo extends JpaRepository<PolicyAuditEvent, Long> {
    List<PolicyAuditEvent> findByPolicyIdOrderByCreatedAtDesc(Long policyId);
}