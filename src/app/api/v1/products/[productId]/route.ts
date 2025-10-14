import { NextResponse } from "next/server";
import { fetchProductFromCms } from "@/domain/cms/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const product = await fetchProductFromCms(productId);

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching product from Prismic:", error);
    return NextResponse.json(
      { error: "Product not found" + (await params).productId },
      { status: 404 }
    );
  }
}
