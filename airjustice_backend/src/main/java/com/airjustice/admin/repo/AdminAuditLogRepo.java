package com.airjustice.admin.repo;

import com.airjustice.admin.entity.AdminAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAuditLogRepo extends JpaRepository<AdminAuditLog, Long> {
}

