import { EMAIL_NEWSLETTER_API_KEY } from "@/lib/services/emailOctopus/emailOctopus";

type ApiPayload = {
  email_address: string;
  status: "subscribed" | "unsubscribed" | "pending";
  tags?: string[];
};

export const subscribeEmailToList = async (
  email: string,
  listId: string,
  tag?: string
) => {
  try {
    const apiPayload: ApiPayload = {
      email_address: email,
      status: "subscribed",
    };
    if (tag) {
      apiPayload.tags = [tag];
    }

    const response = await fetch(
      `https://api.emailoctopus.com/lists/${listId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EMAIL_NEWSLETTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiPayload),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || "Failed to subscribe: " + data.detail,
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error occoured: ", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};
