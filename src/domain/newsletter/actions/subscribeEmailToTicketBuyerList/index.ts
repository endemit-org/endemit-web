import { EMAIL_OCTOPUS_TICKET_BUYERS_LIST_ID } from "@/services/emailOctopus/emailOctopus";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";

export const subscribeEmailToTicketBuyerList = async (
  email: string,
  eventTag: string
) => subscribeEmailToList(email, EMAIL_OCTOPUS_TICKET_BUYERS_LIST_ID, eventTag);
