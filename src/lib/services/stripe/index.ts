import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "@/lib/services/env/private";

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});
