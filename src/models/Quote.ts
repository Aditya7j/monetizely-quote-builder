import mongoose, {
  type Model,
  Schema,
} from "mongoose";

import {
  QUOTE_TERMS,
  type QuoteTerm,
} from "@/types/quote";

interface QuoteLineItemDocument {
  type: "BASE_PRODUCT" | "ADD_ON";
  name: string;
  calculation: string;
  amountCents: number;
}

export interface QuoteDocument {
  publicId: string;

  quoteName: string;
  customerName: string;

  productId: string;
  productName: string;

  tierId: string;
  tierName: string;

  productSeats: number;

  term: QuoteTerm;
  termMonths: number;
  termDiscountPercent: number;

  quoteDiscountPercent: number;

  lineItems: QuoteLineItemDocument[];

  subtotalCents: number;
  quoteDiscountAmountCents: number;
  totalCents: number;

  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quoteLineItemSchema =
  new Schema<QuoteLineItemDocument>(
    {
      type: {
        type: String,
        enum: ["BASE_PRODUCT", "ADD_ON"],
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      calculation: {
        type: String,
        required: true,
      },
      amountCents: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      _id: false,
    },
  );

const quoteSchema = new Schema<QuoteDocument>(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    quoteName: {
      type: String,
      required: true,
      trim: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    productId: {
      type: String,
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    tierId: {
      type: String,
      required: true,
    },

    tierName: {
      type: String,
      required: true,
    },

    productSeats: {
      type: Number,
      required: true,
      min: 1,
    },

    term: {
      type: String,
      enum: QUOTE_TERMS,
      required: true,
    },

    termMonths: {
      type: Number,
      required: true,
    },

    termDiscountPercent: {
      type: Number,
      required: true,
    },

    quoteDiscountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    lineItems: {
      type: [quoteLineItemSchema],
      required: true,
    },

    subtotalCents: {
      type: Number,
      required: true,
      min: 0,
    },

    quoteDiscountAmountCents: {
      type: Number,
      required: true,
      min: 0,
    },

    totalCents: {
      type: Number,
      required: true,
      min: 0,
    },

    validUntil: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const QuoteModel =
  (mongoose.models.Quote as
    | Model<QuoteDocument>
    | undefined) ??
  mongoose.model<QuoteDocument>(
    "Quote",
    quoteSchema,
  );

export default QuoteModel;