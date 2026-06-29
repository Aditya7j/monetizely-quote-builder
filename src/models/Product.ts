import mongoose, {
  type Model,
  Schema,
} from "mongoose";

import {
  ADD_ON_PRICING_MODELS,
  FEATURE_AVAILABILITIES,
  type AddOnPricingModel,
  type FeatureAvailability,
} from "@/types/catalog";

interface ProductTierDocument {
  id: string;
  name: string;
  basePriceCents: number;
}

interface FeatureTierConfigurationDocument {
  tierId: string;
  availability: FeatureAvailability;
  pricingModel?: AddOnPricingModel;
  priceCents?: number;
  percentage?: number;
}

interface ProductFeatureDocument {
  id: string;
  name: string;
  tierConfigurations: FeatureTierConfigurationDocument[];
}

export interface ProductDocument {
  name: string;
  tiers: ProductTierDocument[];
  features: ProductFeatureDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const productTierSchema =
  new Schema<ProductTierDocument>(
    {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      basePriceCents: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      _id: false,
    },
  );

const featureTierConfigurationSchema =
  new Schema<FeatureTierConfigurationDocument>(
    {
      tierId: {
        type: String,
        required: true,
      },
      availability: {
        type: String,
        enum: FEATURE_AVAILABILITIES,
        required: true,
      },
      pricingModel: {
        type: String,
        enum: ADD_ON_PRICING_MODELS,
      },
      priceCents: {
        type: Number,
        min: 0,
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
    {
      _id: false,
    },
  );

const productFeatureSchema =
  new Schema<ProductFeatureDocument>(
    {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      tierConfigurations: {
        type: [featureTierConfigurationSchema],
        required: true,
      },
    },
    {
      _id: false,
    },
  );

const productSchema = new Schema<ProductDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tiers: {
      type: [productTierSchema],
      required: true,
    },
    features: {
      type: [productFeatureSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const ProductModel =
  (mongoose.models.Product as
    | Model<ProductDocument>
    | undefined) ??
  mongoose.model<ProductDocument>(
    "Product",
    productSchema,
  );

export default ProductModel;