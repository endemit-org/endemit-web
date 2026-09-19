import {
  PickupSelection,
  ShippingAddress,
} from "@/domain/checkout/types/checkout";

export const transformToCheckoutDescription = (
  shippingAddress?: ShippingAddress,
  email?: string,
  pickup?: PickupSelection
) => {
  if (!shippingAddress) {
    return "-";
  }

  if (pickup) {
    return `Pickup order (${pickup.eventName ?? "by agreement"}):
${shippingAddress.name}

Email: ${email}
Phone: ${shippingAddress.phone}`;
  }

  return `Ship order to:
${shippingAddress.name}
${shippingAddress.address}
${shippingAddress.postalCode} ${shippingAddress.city}
${shippingAddress.country}

Email: ${email}
Phone: ${shippingAddress.phone}`;
};
