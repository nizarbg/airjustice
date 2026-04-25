package com.airjustice.partner.repo;

import com.airjustice.partner.entity.PartnerAccount;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PartnerAccountRepo extends JpaRepository<PartnerAccount, Long> {
    boolean existsByContactEmailIgnoreCase(String contactEmail);
}
