package com.airjustice.partner.repo;

import com.airjustice.partner.entity.PartnerDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PartnerDocumentRepo extends JpaRepository<PartnerDocument, Long> {
    List<PartnerDocument> findByAccountIdOrderByUploadedAtDesc(Long accountId);
}
