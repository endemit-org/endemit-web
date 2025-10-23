import { EMAIL_NEWSLETTER_GENERAL_LIST_ID } from "@/lib/services/emailOctopus/emailOctopus";
import { isEmailSubscribedToList } from "@/domain/newsletter/actions/isEmailSubscribedToList";

export const isEmailSubscribedToGeneralList = async (email: string) =>
  isEmailSubscribedToList(email, EMAIL_NEWSLETTER_GENERAL_LIST_ID);
