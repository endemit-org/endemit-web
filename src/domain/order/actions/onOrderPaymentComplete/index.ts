import {
  getTicketsFromOrder,
  queueNewOrderAutomation,
  updateOrderStatusPaid,
} from "@/domain/order/actions";
import {
  getRelatedEventFromTicket,
  getTicketHoldersForTicket,
  queueTicketIssueAutomation,
} from "@/domain/ticket/actions";

export const onOrderPaymentComplete = async (paymentSessionId: string) => {
  const order = await updateOrderStatusPaid(paymentSessionId);

  await queueNewOrderAutomation({ orderId: order.id });

  const ticketItems = getTicketsFromOrder(order);

  if (ticketItems) {
    ticketItems.forEach(ticketItem => {
      const ticketHolders = getTicketHoldersForTicket(ticketItem, order.email);
      const eventData = getRelatedEventFromTicket(ticketItem);

      if (!ticketHolders || !eventData) {
        console.error("Missing ticket holders or event data", {
          paymentSessionId,
          ticketHolders,
          eventData,
        });
        return;
      }

      ticketHolders.forEach(ticketHolderName => {
        queueTicketIssueAutomation({
          eventId: eventData.id,
          eventName: eventData.title,
          ticketHolderName,
          ticketPayerEmail: order.email,
          orderId: order.id,
          metadata: {
            productName: ticketItem.price_data?.product_data?.name ?? "Default",
          },
        });
      });
    });

    // get order, get items, create tickets, send emails, send discord, add to airtable?
    // TODO
    // Ticket creation
  }

  return order;
};
