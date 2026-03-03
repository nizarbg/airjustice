package com.airjustice.guest.repo;

import com.airjustice.guest.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationLogRepo extends JpaRepository<NotificationLog, Long> {}