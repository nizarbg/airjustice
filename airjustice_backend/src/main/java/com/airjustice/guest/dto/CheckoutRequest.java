package com.airjustice.guest.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CheckoutRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @NotBlank String phone,

        @NotBlank String flightNumber,
        @NotNull LocalDate flightDate,
        @NotBlank String depIata,
        @NotBlank String arrIata,
        String airline,
        @NotNull LocalDateTime scheduledDeparture,
        @NotNull LocalDateTime scheduledArrival
) {}