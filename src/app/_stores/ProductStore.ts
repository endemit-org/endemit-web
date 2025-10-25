import { Product } from "@/domain/product/types/product";
import { create } from "zustand";
import { getAllProducts } from "@/domain/product/actions/getProducts";
import { useEffect } from "react";

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  fetchProducts: () => Promise<void>;
  setProducts: (products: Product[]) => void;
  getProductByUid: (uid: string) => Product | undefined;
  getAllProducts: () => Product[];
  clearProducts: () => void;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await getAllProducts();
      set({ isLoading: false, products, isInitialized: true });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  setProducts: (products: Product[]) => set({ products }),

  getProductByUid: (uid: string) => {
    return get().products.find((product: Product) => product.uid === uid);
  },

  getAllProducts: () => {
    return get().products;
  },

  clearProducts: () => set({ products: [], error: null }),
}));

// Custom hook with auto-fetch on mount
export const useProducts = () => {
  const store = useProductsStore();

  useEffect(() => {
    if (!store.isInitialized && !store.isLoading) {
      store.fetchProducts();
    }
  }, [store]);

  return {
    products: store.products,
    isLoading: store.isLoading,
    error: store.error,
    fetchProducts: store.fetchProducts,
    setProducts: store.setProducts,
    getProductByUid: store.getProductByUid,
    getAllProducts: store.getAllProducts,
    clearProducts: store.clearProducts,
  };
};

// Selector hooks for performance optimization
export const useProductsList = () => useProductsStore(state => state.products);
export const useProductsLoading = () =>
  useProductsStore(state => state.isLoading);
export const useProductsError = () => useProductsStore(state => state.error);

export const useProductsActions = () => {
  const fetchProducts = useProductsStore(state => state.fetchProducts);
  const setProducts = useProductsStore(state => state.setProducts);
  const getProductByUid = useProductsStore(state => state.getProductByUid);
  const getAllProducts = useProductsStore(state => state.getAllProducts);
  const clearProducts = useProductsStore(state => state.clearProducts);

  return {
    fetchProducts,
    setProducts,
    getProductByUid,
    getAllProducts,
    clearProducts,
  };
};
