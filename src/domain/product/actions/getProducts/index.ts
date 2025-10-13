import { Product } from "@/types/product";
import { getApiPath } from "@/lib/api";
import { filterVisibleProducts } from "@/domain/product/actions/getVisibleProducts";

async function getProducts(): Promise<Product[]> {
  try {
    // Use absolute URL for server-side fetching
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    console.log(`${baseUrl}${getApiPath("products/list")}`);
    const response = await fetch(`${baseUrl}${getApiPath("products/list")}`, {
      cache: "force-cache", // or 'force-cache' for static generation
      next: { revalidate: 60 * 60 * 24 }, // Revalidate every 24 hours
    });

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getVisibleProducts(): Promise<Product[]> {
  const products = await getProducts();
  return filterVisibleProducts(products);
}

export async function getAllProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products;
}
