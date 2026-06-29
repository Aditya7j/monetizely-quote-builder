import { z } from "zod";

import {
  ADD_ON_PRICING_MODELS,
  FEATURE_AVAILABILITIES,
} from "@/types/catalog";

const productTierSchema = z.object({
  id: z.string().trim().min(1, "Tier ID is required."),

  name: z
    .string()
    .trim()
    .min(1, "Tier name is required.")
    .max(80, "Tier name is too long."),

  basePriceCents: z
    .number()
    .int()
    .nonnegative(
      "Base price must be zero or greater.",
    ),
});

const featureTierConfigurationSchema = z.object({
  tierId: z
    .string()
    .trim()
    .min(1, "Tier ID is required."),

  availability: z.enum(FEATURE_AVAILABILITIES),

  pricingModel: z
    .enum(ADD_ON_PRICING_MODELS)
    .optional(),

  priceCents: z
    .number()
    .int()
    .positive(
      "Add-on price must be greater than zero.",
    )
    .optional(),

  percentage: z
    .number()
    .positive(
      "Percentage must be greater than zero.",
    )
    .max(100, "Percentage cannot exceed 100.")
    .optional(),
});

const productFeatureSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Feature ID is required."),

  name: z
    .string()
    .trim()
    .min(1, "Feature name is required.")
    .max(120, "Feature name is too long."),

  tierConfigurations: z.array(
    featureTierConfigurationSchema,
  ),
});

export const productInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Product name must contain 2 characters.")
      .max(120, "Product name is too long."),

    tiers: z
      .array(productTierSchema)
      .min(1, "Create at least one tier."),

    features: z
      .array(productFeatureSchema)
      .min(1, "Create at least one feature."),
  })
  .superRefine((product, context) => {
    const tierIds = product.tiers.map(
      (tier) => tier.id,
    );

    const uniqueTierIds = new Set(tierIds);

    if (uniqueTierIds.size !== tierIds.length) {
      context.addIssue({
        code: "custom",
        path: ["tiers"],
        message: "Tier IDs must be unique.",
      });
    }

    const normalizedTierNames = product.tiers.map(
      (tier) => tier.name.trim().toLowerCase(),
    );

    if (
      new Set(normalizedTierNames).size !==
      normalizedTierNames.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["tiers"],
        message: "Tier names must be unique.",
      });
    }

    const normalizedFeatureNames =
      product.features.map((feature) =>
        feature.name.trim().toLowerCase(),
      );

    if (
      new Set(normalizedFeatureNames).size !==
      normalizedFeatureNames.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["features"],
        message: "Feature names must be unique.",
      });
    }

    product.features.forEach(
      (feature, featureIndex) => {
        const configuredTierIds =
          feature.tierConfigurations.map(
            (configuration) =>
              configuration.tierId,
          );

        if (
          new Set(configuredTierIds).size !==
          configuredTierIds.length
        ) {
          context.addIssue({
            code: "custom",
            path: [
              "features",
              featureIndex,
              "tierConfigurations",
            ],
            message:
              "A feature cannot contain duplicate tier configurations.",
          });
        }

        for (const tierId of tierIds) {
          if (!configuredTierIds.includes(tierId)) {
            context.addIssue({
              code: "custom",
              path: [
                "features",
                featureIndex,
                "tierConfigurations",
              ],
              message:
                "Every feature must be configured for every tier.",
            });
          }
        }

        for (const configuredTierId of configuredTierIds) {
          if (!uniqueTierIds.has(configuredTierId)) {
            context.addIssue({
              code: "custom",
              path: [
                "features",
                featureIndex,
                "tierConfigurations",
              ],
              message:
                "Feature configuration contains an unknown tier.",
            });
          }
        }

        feature.tierConfigurations.forEach(
          (configuration, configurationIndex) => {
            if (
              configuration.availability !== "ADD_ON"
            ) {
              return;
            }

            const basePath = [
              "features",
              featureIndex,
              "tierConfigurations",
              configurationIndex,
            ];

            if (!configuration.pricingModel) {
              context.addIssue({
                code: "custom",
                path: [
                  ...basePath,
                  "pricingModel",
                ],
                message:
                  "Select a pricing model for the add-on.",
              });

              return;
            }

            if (
              configuration.pricingModel ===
                "FIXED_MONTHLY" ||
              configuration.pricingModel ===
                "PER_SEAT_MONTHLY"
            ) {
              if (
                configuration.priceCents === undefined
              ) {
                context.addIssue({
                  code: "custom",
                  path: [
                    ...basePath,
                    "priceCents",
                  ],
                  message:
                    "A price is required for this add-on.",
                });
              }
            }

            if (
              configuration.pricingModel ===
                "PERCENT_OF_PRODUCT" &&
              configuration.percentage === undefined
            ) {
              context.addIssue({
                code: "custom",
                path: [
                  ...basePath,
                  "percentage",
                ],
                message:
                  "A percentage is required for this add-on.",
              });
            }
          },
        );
      },
    );
  });

export type ProductInput = z.infer<
  typeof productInputSchema
>;