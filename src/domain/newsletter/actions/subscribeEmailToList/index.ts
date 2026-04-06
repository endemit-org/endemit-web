import { EMAIL_NEWSLETTER_API_KEY } from "@/lib/services/emailOctopus/emailOctopus";

interface SubscribeOptions {
  tags?: string[];
  fields?: {
    FirstName?: string;
    LastName?: string;
    Events?: string;
    LastEvent?: string;
    EventCount?: number;
    LastEventDate?: string;
  };
}

type UpsertPayload = {
  email_address: string;
  status: "subscribed" | "unsubscribed" | "pending";
  tags?: Record<string, boolean>;
  fields?: Record<string, string | number>;
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
  const logPrefix = `[EmailOctopus:${email}]`;

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
      if (options.fields.EventCount !== undefined) {
        payload.fields.EventCount = options.fields.EventCount;
      }
      if (options.fields.LastEventDate) {
        payload.fields.LastEventDate = options.fields.LastEventDate;
      }
    }

    console.log(`${logPrefix} Upserting contact`, {
      listId,
      tags: payload.tags ? Object.keys(payload.tags) : [],
      fields: payload.fields,
    });

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
      const errorMsg = data.error?.message || "Failed to subscribe: " + JSON.stringify(data);
      console.error(`${logPrefix} API error`, {
        status: response.status,
        error: errorMsg,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log(`${logPrefix} Upsert successful`, {
      contactId: data.id,
      status: data.status,
    });

    return { success: true, data };
  } catch (error) {
    console.error(`${logPrefix} Unexpected error`, error);
    return { success: false, error: "An unexpected error occurred" };
  }
};
