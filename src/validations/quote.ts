import { z } from "zod";

import { QUOTE_TERMS } from "@/types/quote";

const selectedAddOnSchema = z.object({
  featureId: z
    .string()
    .trim()
    .min(1, "Feature ID is required."),

  quantity: z
    .number()
    .int()
    .positive(
      "Add-on quantity must be a positive integer.",
    )
    .optional(),
});

export const quoteInputSchema = z
  .object({
    quoteName: z
      .string()
      .trim()
      .min(2, "Quote name is required.")
      .max(150, "Quote name is too long."),

    customerName: z
      .string()
      .trim()
      .min(2, "Customer name is required.")
      .max(150, "Customer name is too long."),

    productId: z
      .string()
      .trim()
      .min(1, "Select a product."),

    tierId: z
      .string()
      .trim()
      .min(1, "Select a tier."),

    productSeats: z
      .number()
      .int()
      .positive(
        "Product seats must be a positive integer.",
      ),

    term: z.enum(QUOTE_TERMS),

    selectedAddOns: z.array(
      selectedAddOnSchema,
    ),

    quoteDiscountPercent: z
      .number()
      .min(0, "Discount cannot be negative.")
      .max(100, "Discount cannot exceed 100%."),
  })
  .superRefine((quote, context) => {
    const featureIds = quote.selectedAddOns.map(
      (addOn) => addOn.featureId,
    );

    if (
      new Set(featureIds).size !==
      featureIds.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["selectedAddOns"],
        message:
          "The same add-on cannot be selected twice.",
      });
    }
  });

export type QuoteInput = z.infer<
  typeof quoteInputSchema
>;