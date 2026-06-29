import { randomUUID } from "node:crypto";
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { calculateQuote } from "@/lib/pricing/calculateQuote";
import ProductModel from "@/models/Product";
import QuoteModel from "@/models/Quote";
import type { SelectedAddOn } from "@/types/quote";
import { quoteInputSchema } from "@/validations/quote";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const requestBody: unknown =
      await request.json();

    const validationResult =
      quoteInputSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return Response.json(
        {
          error: "Validation failed.",
          issues: validationResult.error.issues,
        },
        {
          status: 400,
        },
      );
    }

    const input = validationResult.data;

    if (!isValidObjectId(input.productId)) {
      return Response.json(
        {
          error: "Invalid product ID.",
        },
        {
          status: 400,
        },
      );
    }

    await connectToDatabase();

    const product = await ProductModel.findById(
      input.productId,
    );

    if (!product) {
      return Response.json(
        {
          error: "Product not found.",
        },
        {
          status: 404,
        },
      );
    }

    const tier = product.tiers.find(
      (item) => item.id === input.tierId,
    );

    if (!tier) {
      return Response.json(
        {
          error:
            "The selected tier does not exist.",
        },
        {
          status: 400,
        },
      );
    }

    const pricingAddOns: SelectedAddOn[] = [];

    for (const selectedInput of input.selectedAddOns) {
      const feature = product.features.find(
        (item) =>
          item.id === selectedInput.featureId,
      );

      if (!feature) {
        return Response.json(
          {
            error:
              "A selected feature does not exist.",
          },
          {
            status: 400,
          },
        );
      }

      const configuration =
        feature.tierConfigurations.find(
          (item) => item.tierId === tier.id,
        );

      if (
        !configuration ||
        configuration.availability !==
          "ADD_ON" ||
        !configuration.pricingModel
      ) {
        return Response.json(
          {
            error: `${feature.name} is not an available add-on for ${tier.name}.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        configuration.pricingModel ===
        "PER_SEAT_MONTHLY"
      ) {
        if (
          selectedInput.quantity === undefined ||
          selectedInput.quantity <= 0
        ) {
          return Response.json(
            {
              error: `Enter a seat quantity for ${feature.name}.`,
            },
            {
              status: 400,
            },
          );
        }
      }

      pricingAddOns.push({
        featureId: feature.id,
        featureName: feature.name,
        pricingModel:
          configuration.pricingModel,
        priceCents: configuration.priceCents,
        percentage: configuration.percentage,
        quantity: selectedInput.quantity,
      });
    }

    const calculation = calculateQuote({
      productName: product.name,
      tierName: tier.name,
      productSeats: input.productSeats,
      basePricePerSeatCents:
        tier.basePriceCents,
      term: input.term,
      selectedAddOns: pricingAddOns,
      quoteDiscountPercent:
        input.quoteDiscountPercent,
    });

    const createdAt = new Date();

    const validUntil = new Date(createdAt);

    validUntil.setDate(
      validUntil.getDate() + 30,
    );

    const quote = await QuoteModel.create({
      publicId: randomUUID(),

      quoteName: input.quoteName,
      customerName: input.customerName,

      productId: product._id.toString(),
      productName: product.name,

      tierId: tier.id,
      tierName: tier.name,

      productSeats: input.productSeats,

      term: input.term,
      termMonths: calculation.termMonths,
      termDiscountPercent:
        calculation.termDiscountPercent,

      quoteDiscountPercent:
        calculation.quoteDiscountPercent,

      lineItems: calculation.lineItems,

      subtotalCents:
        calculation.subtotalCents,

      quoteDiscountAmountCents:
        calculation.quoteDiscountAmountCents,

      totalCents: calculation.totalCents,

      validUntil,
    });

    return Response.json(
      {
        quote: {
          id: quote._id.toString(),
          publicId: quote.publicId,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/quotes failed:",
      error,
    );

    return Response.json(
      {
        error: "Unable to create the quote.",
      },
      {
        status: 500,
      },
    );
  }
}