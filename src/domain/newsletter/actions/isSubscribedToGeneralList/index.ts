import { EMAIL_OCTOPUS_GENERAL_LIST_ID } from "@/app/services/emailOctopus/emailOctopus";
import { isEmailSubscribedToList } from "@/domain/newsletter/actions/isEmailSubscribedToList";

export const isEmailSubscribedToGeneralList = async (email: string) =>
  isEmailSubscribedToList(email, EMAIL_OCTOPUS_GENERAL_LIST_ID);
