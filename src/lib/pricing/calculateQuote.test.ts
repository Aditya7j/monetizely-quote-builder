import { describe, expect, it } from "vitest";

import { calculateQuote } from "./calculateQuote";

describe("calculateQuote", () => {
  it("calculates a monthly base product without a term discount", () => {
    const result = calculateQuote({
      productName: "Analytics Suite",
      tierName: "Starter",
      productSeats: 10,
      basePricePerSeatCents: 2500,
      term: "MONTHLY",
      selectedAddOns: [],
      quoteDiscountPercent: 0,
    });

    expect(result.termMonths).toBe(1);
    expect(result.termDiscountPercent).toBe(0);
    expect(result.baseProductAmountCents).toBe(25000);
    expect(result.totalCents).toBe(25000);
  });

  it("applies the 15% annual discount to the base product", () => {
    const result = calculateQuote({
      productName: "Analytics Suite",
      tierName: "Growth",
      productSeats: 25,
      basePricePerSeatCents: 5000,
      term: "ANNUAL",
      selectedAddOns: [],
      quoteDiscountPercent: 0,
    });

    expect(result.baseProductBeforeDiscountCents).toBe(
      1500000,
    );

    expect(result.termDiscountAmountCents).toBe(225000);
    expect(result.baseProductAmountCents).toBe(1275000);
  });

  it("applies the 25% two-year discount", () => {
    const result = calculateQuote({
      productName: "Analytics Suite",
      tierName: "Enterprise",
      productSeats: 10,
      basePricePerSeatCents: 10000,
      term: "TWO_YEAR",
      selectedAddOns: [],
      quoteDiscountPercent: 0,
    });

    expect(result.baseProductBeforeDiscountCents).toBe(
      2400000,
    );

    expect(result.termDiscountAmountCents).toBe(600000);
    expect(result.baseProductAmountCents).toBe(1800000);
  });

  it("calculates a fixed monthly add-on", () => {
    const result = calculateQuote({
      productName: "Analytics Suite",
      tierName: "Growth",
      productSeats: 25,
      basePricePerSeatCents: 5000,
      term: "ANNUAL",
      selectedAddOns: [
        {
          featureId: "sso",
          featureName: "Single Sign-On",
          pricingModel: "FIXED_MONTHLY",
          priceCents: 20000,
        },
      ],
      quoteDiscountPercent: 0,
    });

    expect(result.addOnTotalCents).toBe(240000);
  });

  it("calculates a per-seat add-on using its own quantity", () => {
    const result = calculateQuote({
      productName: "Analytics Suite",
      tierName: "Growth",
      productSeats: 25,
      basePricePerSeatCents: 5000,
      term: "ANNUAL",
      selectedAddOns: [
        {
          featureId: "api",
          featureName: "API access",
          pricingModel: "PER_SEAT_MONTHLY",
          priceCents: 5000,
          quantity: 5,
        },
      ],
      quoteDiscountPercent: 0,
    });

    expect(result.addOnTotalCents).toBe(300000);
  });

  it("calculates a percentage add-on from the discounted base product", () => {
    const result = calculateQuote({
      productName: "Analytics Suite",
      tierName: "Growth",
      productSeats: 25,
      basePricePerSeatCents: 5000,
      term: "ANNUAL",
      selectedAddOns: [
        {
          featureId: "anomaly-detection",
          featureName: "Advanced anomaly detection",
          pricingModel: "PERCENT_OF_PRODUCT",
          percentage: 10,
        },
      ],
      quoteDiscountPercent: 0,
    });

    expect(result.baseProductAmountCents).toBe(1275000);
    expect(result.addOnTotalCents).toBe(127500);
    expect(result.totalCents).toBe(1402500);
  });

  it("matches the provided sample quote total of $18,150", () => {
    const result = calculateQuote({
      productName: "Analytics Suite",
      tierName: "Growth",
      productSeats: 25,
      basePricePerSeatCents: 5000,
      term: "ANNUAL",
      selectedAddOns: [
        {
          featureId: "sso",
          featureName: "Single Sign-On",
          pricingModel: "FIXED_MONTHLY",
          priceCents: 20000,
        },
        {
          featureId: "api",
          featureName: "API access",
          pricingModel: "PER_SEAT_MONTHLY",
          priceCents: 5000,
          quantity: 5,
        },
      ],
      quoteDiscountPercent: 0,
    });

    expect(result.baseProductAmountCents).toBe(1275000);
    expect(result.addOnTotalCents).toBe(540000);
    expect(result.subtotalCents).toBe(1815000);
    expect(result.totalCents).toBe(1815000);
  });

  it("applies the quote-level discount after adding all line items", () => {
    const result = calculateQuote({
      productName: "Analytics Suite",
      tierName: "Growth",
      productSeats: 25,
      basePricePerSeatCents: 5000,
      term: "ANNUAL",
      selectedAddOns: [
        {
          featureId: "sso",
          featureName: "Single Sign-On",
          pricingModel: "FIXED_MONTHLY",
          priceCents: 20000,
        },
        {
          featureId: "api",
          featureName: "API access",
          pricingModel: "PER_SEAT_MONTHLY",
          priceCents: 5000,
          quantity: 5,
        },
      ],
      quoteDiscountPercent: 10,
    });

    expect(result.subtotalCents).toBe(1815000);
    expect(result.quoteDiscountAmountCents).toBe(181500);
    expect(result.totalCents).toBe(1633500);
  });

  it("rejects invalid product seat quantities", () => {
    expect(() =>
      calculateQuote({
        productName: "Analytics Suite",
        tierName: "Growth",
        productSeats: 0,
        basePricePerSeatCents: 5000,
        term: "MONTHLY",
        selectedAddOns: [],
        quoteDiscountPercent: 0,
      }),
    ).toThrow("Product seats must be a positive integer.");
  });

  it("rejects discounts above 100%", () => {
    expect(() =>
      calculateQuote({
        productName: "Analytics Suite",
        tierName: "Growth",
        productSeats: 10,
        basePricePerSeatCents: 5000,
        term: "MONTHLY",
        selectedAddOns: [],
        quoteDiscountPercent: 110,
      }),
    ).toThrow("Quote discount must be between 0 and 100.");
  });
});