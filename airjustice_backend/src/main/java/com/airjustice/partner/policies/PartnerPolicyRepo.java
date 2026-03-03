package com.airjustice.partner.policies;

import com.airjustice.partner.entity.PartnerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PartnerPolicyRepo extends JpaRepository<PartnerPolicy, Long> {
    List<PartnerPolicy> findByAccountOrderByCreatedAtDesc(PartnerAccount account);
    Optional<PartnerPolicy> findByIdAndAccount(Long id, PartnerAccount account);
}