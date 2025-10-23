import { PUBLIC_API_PATH } from "@/lib/services/env/public";

export const getApiPath = (path: string) => `${PUBLIC_API_PATH}${path}`;
