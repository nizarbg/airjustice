package com.airjustice.guest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record FlightSearchRequest(
        @NotBlank String depIata,
        @NotBlank String arrIata,
        @NotNull LocalDate date,
        String flightNumber
) {}