import { connectToDatabase } from "@/lib/mongodb";
import ProductModel from "@/models/Product";
import { productInputSchema } from "@/validations/product";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();

    const products = await ProductModel.find({})
      .sort({
        createdAt: -1,
      })
      .lean();

    return Response.json({
      products,
    });
  } catch (error) {
    console.error("GET /api/products failed:", error);

    return Response.json(
      {
        error: "Unable to load products.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const product = await ProductModel.create(
      validationResult.data,
    );

    return Response.json(
      {
        product,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("POST /api/products failed:", error);

    return Response.json(
      {
        error: "Unable to create the product.",
      },
      {
        status: 500,
      },
    );
  }
}