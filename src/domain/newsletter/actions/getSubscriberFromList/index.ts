import { EMAIL_NEWSLETTER_API_KEY } from "@/lib/services/emailOctopus/emailOctopus";
import { createHash } from "crypto";

interface SubscriberFields {
  FirstName?: string;
  LastName?: string;
  Events?: string;
  LastEvent?: string;
  EventCount?: string;
  LastEventDate?: string;
  [key: string]: string | undefined;
}

interface SubscriberData {
  id: string;
  email_address: string;
  fields: SubscriberFields;
  tags: string[];
  status: string;
  created_at: string;
}

interface GetSubscriberResult {
  exists: boolean;
  subscriber?: SubscriberData;
  error?: string;
}

function getMemberId(email: string): string {
  return createHash("md5").update(email.toLowerCase()).digest("hex");
}

/**
 * Fetches subscriber data from Email Octopus by email address.
 * Returns the subscriber's current fields (including Events) and tags.
 *
 * @param email - Email address to look up
 * @param listId - Email Octopus list ID
 * @returns Subscriber data if exists, or exists: false if not found
 */
export async function getSubscriberFromList(
  email: string,
  listId: string
): Promise<GetSubscriberResult> {
  try {
    const memberId = getMemberId(email);

    const response = await fetch(
      `https://api.emailoctopus.com/lists/${listId}/contacts/${memberId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${EMAIL_NEWSLETTER_API_KEY}`,
        },
      }
    );

    if (response.status === 404) {
      return { exists: false };
    }

    if (!response.ok) {
      const data = await response.json();
      return {
        exists: false,
        error: data.error?.message || `Failed to fetch subscriber: ${response.status}`,
      };
    }

    const subscriber = await response.json() as SubscriberData;
    return {
      exists: true,
      subscriber,
    };
  } catch (error) {
    console.error("Error fetching subscriber:", error);
    return {
      exists: false,
      error: "An unexpected error occurred while fetching subscriber",
    };
  }
}
