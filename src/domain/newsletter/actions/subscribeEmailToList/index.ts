import { EMAIL_NEWSLETTER_API_KEY } from "@/lib/services/emailOctopus/emailOctopus";

interface SubscribeOptions {
  tags?: string[];
  fields?: {
    FirstName?: string;
    LastName?: string;
    Events?: string;
    LastEvent?: string;
    EventCount?: string;
    LastEventDate?: string;
  };
}

type UpsertPayload = {
  email_address: string;
  status: "subscribed" | "unsubscribed" | "pending";
  tags?: Record<string, boolean>;
  fields?: Record<string, string>;
};

/**
 * Subscribes an email to an Email Octopus list using the v2 API upsert endpoint.
 * - Creates contact if new, updates if existing
 * - Tags are added (existing tags are preserved)
 *
 * @param email - Email address to subscribe
 * @param listId - Email Octopus list ID
 * @param options - Optional tags and fields to set
 */
export const subscribeEmailToList = async (
  email: string,
  listId: string,
  options?: SubscribeOptions
) => {
  try {
    const payload: UpsertPayload = {
      email_address: email,
      status: "subscribed",
    };

    // Add tags as key-value pairs (tag: true to add)
    if (options?.tags && options.tags.length > 0) {
      payload.tags = {};
      for (const tag of options.tags) {
        payload.tags[tag] = true;
      }
    }

    // Add fields
    if (options?.fields) {
      payload.fields = {};
      if (options.fields.FirstName) {
        payload.fields.FirstName = options.fields.FirstName;
      }
      if (options.fields.LastName) {
        payload.fields.LastName = options.fields.LastName;
      }
      if (options.fields.Events) {
        payload.fields.Events = options.fields.Events;
      }
      if (options.fields.LastEvent) {
        payload.fields.LastEvent = options.fields.LastEvent;
      }
      if (options.fields.EventCount) {
        payload.fields.EventCount = options.fields.EventCount;
      }
      if (options.fields.LastEventDate) {
        payload.fields.LastEventDate = options.fields.LastEventDate;
      }
    }

    const response = await fetch(
      `https://api.emailoctopus.com/lists/${listId}/contacts`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${EMAIL_NEWSLETTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || "Failed to subscribe: " + JSON.stringify(data),
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error occurred: ", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};
