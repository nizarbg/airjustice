package com.airjustice.partner.policies.draft;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PolicyDraftRepo extends JpaRepository<PolicyDraft, Long> {
    List<PolicyDraft> findByAccountIdOrderByCreatedAtDesc(Long accountId);
    Optional<PolicyDraft> findByIdAndAccountId(Long id, Long accountId);
}