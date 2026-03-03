package com.airjustice.guest.service;

import com.airjustice.guest.entity.*;
import com.airjustice.guest.repo.NotificationLogRepo;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final NotificationLogRepo repo;

    public NotificationService(NotificationLogRepo repo) {
        this.repo = repo;
    }

    public void notifyBoth(FlightCase fc, NotifyType type, String message) {
        if (fc.getEmail() != null && !fc.getEmail().isBlank()) {
            send(fc, NotifyChannel.EMAIL, type, message);
        }
        if (fc.getPhone() != null && !fc.getPhone().isBlank()) {
            send(fc, NotifyChannel.SMS, type, message);
        }
    }

    private void send(FlightCase fc, NotifyChannel ch, NotifyType type, String message) {
        // Persist
        NotificationLog log = new NotificationLog();
        log.setFlightCase(fc);
        log.setChannel(ch);
        log.setType(type);
        log.setPayload(message);
        repo.save(log);

        // Mock “real sending”
        String dest = (ch == NotifyChannel.EMAIL) ? fc.getEmail() : fc.getPhone();
        System.out.println("[NOTIFY " + ch + "] to " + dest + " :: " + type + " :: " + message);
    }
}