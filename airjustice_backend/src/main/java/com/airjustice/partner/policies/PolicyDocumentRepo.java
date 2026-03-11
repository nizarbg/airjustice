package com.airjustice.partner.policies;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PolicyDocumentRepo extends JpaRepository<PolicyDocument, Long> {
    List<PolicyDocument> findByPolicyIdOrderByUploadedAtDesc(Long policyId);
}