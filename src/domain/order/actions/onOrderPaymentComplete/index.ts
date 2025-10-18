import {
  getTicketsFromOrder,
  queueNewOrderAutomation,
  updateOrderStatusPaid,
} from "@/domain/order/actions";
import { queueTicketIssueAutomation } from "@/domain/ticket/actions";
import { fetchEventFromCmsById } from "@/domain/cms/actions";
import { subscribeEmailToTicketBuyerList } from "@/domain/newsletter/actions";
import { notifyOnNewSubscriber } from "@/domain/notification/actions";

export const onOrderPaymentComplete = async (paymentSessionId: string) => {
  const order = await updateOrderStatusPaid(paymentSessionId);

  await queueNewOrderAutomation({ orderId: order.id });
  const ticketItems = getTicketsFromOrder(order);

  if (ticketItems) {
    for (const ticketItem of ticketItems) {
      const ticketHolders = ticketItem.metadata?.ticketHolders as string[];
      const relatedEvent = ticketItem.relatedEvent;

      if (!relatedEvent) {
        console.error("Missing related event for ticket item", {
          paymentSessionId,
          ticketItem,
        });
        return;
      }

      const eventData = await fetchEventFromCmsById(relatedEvent);
      if (!ticketHolders || !eventData) {
        console.error("Missing ticket holders or event data", {
          paymentSessionId,
          ticketHolders,
          eventData,
        });
        return;
      }

      const subscriptionResponse = await subscribeEmailToTicketBuyerList(
        order.email,
        eventData.uid
      );
      if (subscriptionResponse) {
        await notifyOnNewSubscriber(order.email, "Ticket buyers Newsletter");
      }

      ticketHolders.forEach(ticketHolderName => {
        queueTicketIssueAutomation({
          eventId: eventData.id,
          eventName: eventData.name,
          ticketHolderName,
          ticketPayerEmail: order.email,
          price: ticketItem.price,
          orderId: order.id,
          metadata: {
            productName: ticketItem.name ?? "Default",
            eventUid: eventData.uid,
          },
        });
      });
    }
  }

  return order;
};
