import { EMAIL_OCTOPUS_FESTIVAL_LIST_ID } from "@/app/services/emailOctopus/emailOctopus";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";

export const subscribeEmailToFestivalList = async (email: string) =>
  subscribeEmailToList(email, EMAIL_OCTOPUS_FESTIVAL_LIST_ID);
