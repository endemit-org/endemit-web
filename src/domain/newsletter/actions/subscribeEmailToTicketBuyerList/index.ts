import { EMAIL_NEWSLETTER_TICKET_BUYERS_LIST_ID } from "@/lib/services/emailOctopus/emailOctopus";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";

export const subscribeEmailToTicketBuyerList = async (
  email: string,
  eventTag: string
) =>
  subscribeEmailToList(email, EMAIL_NEWSLETTER_TICKET_BUYERS_LIST_ID, eventTag);
