package com.airjustice.partner.policies.draft;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DraftDocumentRepo extends JpaRepository<DraftDocument, Long> {
    List<DraftDocument> findByDraftIdOrderByUploadedAtDesc(Long draftId);
}