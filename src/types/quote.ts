import type { AddOnPricingModel } from "./catalog";

export const QUOTE_TERMS = [
  "MONTHLY",
  "ANNUAL",
  "TWO_YEAR",
] as const;

export type QuoteTerm = (typeof QUOTE_TERMS)[number];

export interface SelectedAddOn {
  featureId: string;
  featureName: string;
  pricingModel: AddOnPricingModel;
  priceCents?: number;
  percentage?: number;
  quantity?: number;
}

export interface QuoteLineItem {
  type: "BASE_PRODUCT" | "ADD_ON";
  name: string;
  calculation: string;
  amountCents: number;
}

export interface QuotePricingInput {
  productName: string;
  tierName: string;
  productSeats: number;
  basePricePerSeatCents: number;
  term: QuoteTerm;
  selectedAddOns: SelectedAddOn[];
  quoteDiscountPercent: number;
}

export interface QuoteCalculation {
  termMonths: number;
  termDiscountPercent: number;
  baseProductBeforeDiscountCents: number;
  termDiscountAmountCents: number;
  baseProductAmountCents: number;
  addOnTotalCents: number;
  subtotalCents: number;
  quoteDiscountPercent: number;
  quoteDiscountAmountCents: number;
  totalCents: number;
  lineItems: QuoteLineItem[];
}

export interface QuoteAddOnInput {
  featureId: string;
  quantity?: number;
}

export interface CreateQuoteInput {
  quoteName: string;
  customerName: string;
  productId: string;
  tierId: string;
  productSeats: number;
  term: QuoteTerm;
  selectedAddOns: QuoteAddOnInput[];
  quoteDiscountPercent: number;
}