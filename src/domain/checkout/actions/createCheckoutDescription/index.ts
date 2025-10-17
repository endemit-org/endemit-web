import { ShippingAddress } from "@/domain/checkout/types/checkout";

export const createCheckoutDescription = (
  shippingAddress?: ShippingAddress,
  email?: string
) => {
  if (!shippingAddress) {
    return "-";
  }

  return `Ship order to:
${shippingAddress.name}
${shippingAddress.address}
${shippingAddress.postalCode} ${shippingAddress.city}
${shippingAddress.country}

Email: ${email}
Phone: ${shippingAddress.phone}`;
};
