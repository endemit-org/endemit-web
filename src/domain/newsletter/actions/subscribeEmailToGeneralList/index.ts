import { EMAIL_OCTOPUS_GENERAL_LIST_ID } from "@/app/services/emailOctopus/emailOctopus";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";

export const subscribeEmailToGeneralList = async (email: string) =>
  subscribeEmailToList(email, EMAIL_OCTOPUS_GENERAL_LIST_ID);
