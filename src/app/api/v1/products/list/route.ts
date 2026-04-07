import { NextResponse } from "next/server";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { isProductVisible } from "@/domain/product/businessLogic";

export async function GET() {
  try {
    const products = await fetchProductsFromCms({});
    const visibleProducts = products?.filter(isProductVisible) ?? [];

    return NextResponse.json(visibleProducts, { status: 200 });
  } catch (error) {
    console.error("Error fetching products from Prismic:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
