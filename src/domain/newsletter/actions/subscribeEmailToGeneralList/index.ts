import { EMAIL_NEWSLETTER_GENERAL_LIST_ID } from "@/lib/services/emailOctopus/emailOctopus";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";

export const subscribeEmailToGeneralList = async (email: string) =>
  subscribeEmailToList(email, EMAIL_NEWSLETTER_GENERAL_LIST_ID);
