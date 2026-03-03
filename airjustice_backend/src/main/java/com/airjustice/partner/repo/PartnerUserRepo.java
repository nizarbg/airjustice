package com.airjustice.partner.repo;

import com.airjustice.partner.entity.PartnerUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PartnerUserRepo extends JpaRepository<PartnerUser, Long> {
    Optional<PartnerUser> findByEmailIgnoreCase(String email);
    Optional<PartnerUser> findByUsernameIgnoreCase(String username);
}
