import type {
  QuoteCalculation,
  QuoteLineItem,
  QuotePricingInput,
  QuoteTerm,
  SelectedAddOn,
} from "../../types/quote";

interface TermConfiguration {
  months: number;
  discountPercent: number;
}

export const TERM_CONFIGURATION: Record<
  QuoteTerm,
  TermConfiguration
> = {
  MONTHLY: {
    months: 1,
    discountPercent: 0,
  },
  ANNUAL: {
    months: 12,
    discountPercent: 15,
  },
  TWO_YEAR: {
    months: 24,
    discountPercent: 25,
  },
};

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function calculatePercentage(
  amountCents: number,
  percentage: number,
): number {
  return Math.round((amountCents * percentage) / 100);
}

function validatePercentage(
  percentage: number,
  fieldName: string,
): void {
  if (
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100
  ) {
    throw new Error(
      `${fieldName} must be between 0 and 100.`,
    );
  }
}

function validateMoney(
  amountCents: number | undefined,
  fieldName: string,
): asserts amountCents is number {
  if (
    amountCents === undefined ||
    !Number.isInteger(amountCents) ||
    amountCents < 0
  ) {
    throw new Error(
      `${fieldName} must be a non-negative integer in cents.`,
    );
  }
}

function calculateAddOn(
  addOn: SelectedAddOn,
  termMonths: number,
  discountedBaseProductCents: number,
): QuoteLineItem {
  switch (addOn.pricingModel) {
    case "FIXED_MONTHLY": {
      validateMoney(
        addOn.priceCents,
        `${addOn.featureName} price`,
      );

      const amountCents = addOn.priceCents * termMonths;

      return {
        type: "ADD_ON",
        name: addOn.featureName,
        calculation:
          `${formatUsd(addOn.priceCents)} × ` +
          `${termMonths} month${termMonths === 1 ? "" : "s"}`,
        amountCents,
      };
    }

    case "PER_SEAT_MONTHLY": {
      validateMoney(
        addOn.priceCents,
        `${addOn.featureName} price`,
      );

      if (
        addOn.quantity === undefined ||
        !Number.isInteger(addOn.quantity) ||
        addOn.quantity <= 0
      ) {
        throw new Error(
          `${addOn.featureName} quantity must be a positive integer.`,
        );
      }

      const amountCents =
        addOn.quantity * addOn.priceCents * termMonths;

      return {
        type: "ADD_ON",
        name: addOn.featureName,
        calculation:
          `${addOn.quantity} seats × ` +
          `${formatUsd(addOn.priceCents)} × ` +
          `${termMonths} month${termMonths === 1 ? "" : "s"}`,
        amountCents,
      };
    }

    case "PERCENT_OF_PRODUCT": {
      if (addOn.percentage === undefined) {
        throw new Error(
          `${addOn.featureName} percentage is required.`,
        );
      }

      validatePercentage(
        addOn.percentage,
        `${addOn.featureName} percentage`,
      );

      const amountCents = calculatePercentage(
        discountedBaseProductCents,
        addOn.percentage,
      );

      return {
        type: "ADD_ON",
        name: addOn.featureName,
        calculation:
          `${addOn.percentage}% × discounted base product ` +
          `(${formatUsd(discountedBaseProductCents)})`,
        amountCents,
      };
    }

    default: {
      const unsupportedModel: never = addOn.pricingModel;

      throw new Error(
        `Unsupported pricing model: ${unsupportedModel}`,
      );
    }
  }
}

export function calculateQuote(
  input: QuotePricingInput,
): QuoteCalculation {
  if (
    !Number.isInteger(input.productSeats) ||
    input.productSeats <= 0
  ) {
    throw new Error(
      "Product seats must be a positive integer.",
    );
  }

  validateMoney(
    input.basePricePerSeatCents,
    "Base price per seat",
  );

  validatePercentage(
    input.quoteDiscountPercent,
    "Quote discount",
  );

  const termConfiguration = TERM_CONFIGURATION[input.term];

  if (!termConfiguration) {
    throw new Error("Invalid quote term.");
  }

  const baseProductBeforeDiscountCents =
    input.productSeats *
    input.basePricePerSeatCents *
    termConfiguration.months;

  const termDiscountAmountCents = calculatePercentage(
    baseProductBeforeDiscountCents,
    termConfiguration.discountPercent,
  );

  const baseProductAmountCents =
    baseProductBeforeDiscountCents -
    termDiscountAmountCents;

  const baseCalculationParts = [
    `${input.productSeats} seats`,
    formatUsd(input.basePricePerSeatCents),
    `${termConfiguration.months} month${
      termConfiguration.months === 1 ? "" : "s"
    }`,
  ];

  let baseCalculation = baseCalculationParts.join(" × ");

  if (termConfiguration.discountPercent > 0) {
    baseCalculation +=
      ` − ${termConfiguration.discountPercent}% term discount`;
  }

  const lineItems: QuoteLineItem[] = [
    {
      type: "BASE_PRODUCT",
      name: `${input.productName} — ${input.tierName}`,
      calculation: baseCalculation,
      amountCents: baseProductAmountCents,
    },
  ];

  for (const addOn of input.selectedAddOns) {
    lineItems.push(
      calculateAddOn(
        addOn,
        termConfiguration.months,
        baseProductAmountCents,
      ),
    );
  }

  const addOnTotalCents = lineItems
    .filter((lineItem) => lineItem.type === "ADD_ON")
    .reduce(
      (total, lineItem) => total + lineItem.amountCents,
      0,
    );

  const subtotalCents =
    baseProductAmountCents + addOnTotalCents;

  const quoteDiscountAmountCents = calculatePercentage(
    subtotalCents,
    input.quoteDiscountPercent,
  );

  const totalCents =
    subtotalCents - quoteDiscountAmountCents;

  return {
    termMonths: termConfiguration.months,
    termDiscountPercent:
      termConfiguration.discountPercent,

    baseProductBeforeDiscountCents,
    termDiscountAmountCents,
    baseProductAmountCents,

    addOnTotalCents,
    subtotalCents,

    quoteDiscountPercent: input.quoteDiscountPercent,
    quoteDiscountAmountCents,

    totalCents,
    lineItems,
  };
}