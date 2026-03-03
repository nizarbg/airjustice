package com.airjustice.partner.dto;

import java.math.BigDecimal;

public record PartnerAccountLimitedDto(
        String agencyName,
        BigDecimal prepaidBalance,
        BigDecimal lowBalanceThreshold,
        boolean lowBalanceAlert
) {}
