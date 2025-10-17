import { NextResponse } from "next/server";
import { fetchProductFromCms } from "@/domain/cms/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const product = await fetchProductFromCms(uid);

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching product from Prismic:", error);
    return NextResponse.json(
      { error: "Product not found" + (await params).uid },
      { status: 404 }
    );
  }
}
