import { EMAIL_NEWSLETTER_FESTIVAL_LIST_ID } from "@/lib/services/emailOctopus/emailOctopus";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";
import { getSubscriberFromList } from "@/domain/newsletter/actions/getSubscriberFromList";

export const subscribeEmailToFestivalList = async (
  email: string
): Promise<{ success: boolean; isNew: boolean; error?: string }> => {
  const listId = EMAIL_NEWSLETTER_FESTIVAL_LIST_ID;

  // Check if subscriber already exists
  const existingSubscriber = await getSubscriberFromList(email, listId);
  const isNew = !existingSubscriber.exists;

  const result = await subscribeEmailToList(email, listId);
  return { ...result, isNew };
};
