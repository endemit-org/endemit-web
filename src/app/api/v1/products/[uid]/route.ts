import { NextResponse } from "next/server";
import { fetchProductFromCmsByUid } from "@/domain/cms/operations/fetchProductFromCms";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const product = await fetchProductFromCmsByUid(uid);

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Error fetching product from Prismic:", error);
    return NextResponse.json(
      { error: "Product not found" + (await params).uid },
      { status: 404 }
    );
  }
}
