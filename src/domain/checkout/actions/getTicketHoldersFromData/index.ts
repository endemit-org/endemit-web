import { ComplementaryTicketField } from "@/domain/checkout/types/checkout";

export const getTicketHoldersFromData = ({
  complementaryTicketData,
  quantity,
  id,
}: {
  complementaryTicketData: ComplementaryTicketField;
  quantity: number;
  id: string;
}) => {
  const ticketHolders = Array.from(
    { length: quantity },
    (_, index) => `ticket-${id}-${index + 1}-name`
  ).map(key => complementaryTicketData[key]);

  return ticketHolders;
};
