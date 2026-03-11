package com.airjustice.notifications;

import org.springframework.stereotype.Service;

/**
 * Minimal interface assumed by PolicyService.
 * If you already have this service with different methods/signatures,
 * adapt PolicyService calls accordingly.
 *
 * This file is provided as a complete implementation template.
 */
@Service
public class NotificationsService {

    public void notifyBoth(String email, String phone, NotifyType type, String message) {
        // MVP: implement real email + sms here
        System.out.println("[NotifyBoth] " + type + " email=" + email + " phone=" + phone + " msg=" + message);
    }

    public void notifyEmail(String email, NotifyType type, String message) {
        System.out.println("[NotifyEmail] " + type + " email=" + email + " msg=" + message);
    }

    public void notifySms(String phone, NotifyType type, String message) {
        System.out.println("[NotifySms] " + type + " phone=" + phone + " msg=" + message);
    }
}