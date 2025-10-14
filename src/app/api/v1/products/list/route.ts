import { NextResponse } from "next/server";
import { fetchProductsFromCms } from "@/domain/cms/actions";

export async function GET() {
  try {
    const products = await fetchProductsFromCms({});

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("Error fetching products from Prismic:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
