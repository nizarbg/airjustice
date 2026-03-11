package com.airjustice.partner.policies.draft;

import com.airjustice.partner.entity.PartnerAccount;
import com.airjustice.partner.entity.PartnerUser;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "policy_draft")
public class PolicyDraft {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private PartnerAccount account;

    @ManyToOne(optional = false)
    private PartnerUser createdBy;

    @Enumerated(EnumType.STRING)
    private DraftStatus status = DraftStatus.CREATED;

    // extracted (stored to keep extraction without recalculating)
    @Lob
    private String extractedJson;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() { updatedAt = Instant.now(); }
}