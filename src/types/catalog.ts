export const FEATURE_AVAILABILITIES = [
  "INCLUDED",
  "ADD_ON",
  "NOT_AVAILABLE",
] as const;

export type FeatureAvailability =
  (typeof FEATURE_AVAILABILITIES)[number];

export const ADD_ON_PRICING_MODELS = [
  "FIXED_MONTHLY",
  "PER_SEAT_MONTHLY",
  "PERCENT_OF_PRODUCT",
] as const;

export type AddOnPricingModel =
  (typeof ADD_ON_PRICING_MODELS)[number];

export interface ProductTier {
  id: string;
  name: string;
  basePriceCents: number;
}

export interface FeatureTierConfiguration {
  tierId: string;
  availability: FeatureAvailability;

  pricingModel?: AddOnPricingModel;

  /**
   * Used by FIXED_MONTHLY and PER_SEAT_MONTHLY.
   * Stored in cents.
   */
  priceCents?: number;

  /**
   * Used by PERCENT_OF_PRODUCT.
   * Example: 10 means 10%.
   */
  percentage?: number;
}

export interface ProductFeature {
  id: string;
  name: string;
  tierConfigurations: FeatureTierConfiguration[];
}

export interface Product {
  _id?: string;
  name: string;
  tiers: ProductTier[];
  features: ProductFeature[];
  createdAt?: string;
  updatedAt?: string;
}