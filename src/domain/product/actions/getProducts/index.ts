import { Product } from "@/domain/product/types/product";
import { getApiPath } from "@/lib/util/api";
import { filterVisibleProducts } from "@/domain/product/actions/getVisibleProducts";
import { PUBLIC_API_URL } from "@/lib/services/env/public";

async function getProducts(): Promise<Product[]> {
  try {
    const baseUrl = PUBLIC_API_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}${getApiPath("products/list")}`, {
      cache: "force-cache", // or 'force-cache' for static generation
      next: { revalidate: 60 * 60 * 2 }, // Revalidate every 2 hours
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
