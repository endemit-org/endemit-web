import { EMAIL_NEWSLETTER_FESTIVAL_LIST_ID } from "@/lib/services/emailOctopus/emailOctopus";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";

export const subscribeEmailToFestivalList = async (email: string) =>
  subscribeEmailToList(email, EMAIL_NEWSLETTER_FESTIVAL_LIST_ID);
