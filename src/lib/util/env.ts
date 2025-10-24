import {
  PUBLIC_CURRENT_ENV,
  PUBLIC_VERCEL_ENV,
} from "@/lib/services/env/public";

export const isProduction = () => {
  return PUBLIC_CURRENT_ENV === "production";
};

export const isStaging = () => {
  return PUBLIC_CURRENT_ENV === "staging";
};

export const isDevelopment = () => {
  return PUBLIC_CURRENT_ENV === "development";
};

export const isPreview = () => {
  return PUBLIC_VERCEL_ENV === "preview" || PUBLIC_VERCEL_ENV === "staging";
};
