import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import { productInputSchema } from "@/validations/product";

export const runtime = "nodejs";

interface ProductRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  context: ProductRouteContext,
) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
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
      id,
    ).lean();

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

    return Response.json({
      product,
    });
  } catch (error) {
    console.error(
      "GET /api/products/[id] failed:",
      error,
    );

    return Response.json(
      {
        error: "Unable to load the product.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: ProductRouteContext,
) {
  try {
    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return Response.json(
        {
          error: "Invalid product ID.",
        },
        {
          status: 400,
        },
      );
    }

    const requestBody: unknown =
      await request.json();

    const validationResult =
      productInputSchema.safeParse(requestBody);

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

    await connectToDatabase();

    const product =
      await ProductModel.findByIdAndUpdate(
        id,
        {
          $set: validationResult.data,
        },
        {
          new: true,
          runValidators: true,
        },
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

    return Response.json({
      product,
    });
  } catch (error) {
    console.error(
      "PATCH /api/products/[id] failed:",
      error,
    );

    return Response.json(
      {
        error: "Unable to update the product.",
      },
      {
        status: 500,
      },
    );
  }
}