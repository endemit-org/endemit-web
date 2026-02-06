import { ComplementaryTicketField } from "@/domain/checkout/types/checkout";

export const getTicketHoldersFromData = ({
  complementaryTicketData,
  quantity,
  id,
  ticketQuantity = 1,
}: {
  complementaryTicketData: ComplementaryTicketField;
  quantity: number;
  id: string;
  ticketQuantity?: number;
}) => {
  const totalSlots = quantity * ticketQuantity;
  const ticketHolders = Array.from(
    { length: totalSlots },
    (_, index) => `ticket-${id}-${index + 1}-name`
  ).map(key => complementaryTicketData[key]);

  return ticketHolders;
};
