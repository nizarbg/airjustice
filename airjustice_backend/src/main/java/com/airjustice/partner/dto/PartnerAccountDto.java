package com.airjustice.partner.dto;

import java.math.BigDecimal;

public record PartnerAccountDto(
        Long id,
        String status,
        String principalName,
        String agencyName,
        String city,
        String country,
        String contactEmail,
        String contactPhone,
        String preferredLanguage,
        String rcNumber,
        String fiscalNumber,
        String iataCode,
        BigDecimal prepaidBalance,
        BigDecimal lowBalanceThreshold
) {}
