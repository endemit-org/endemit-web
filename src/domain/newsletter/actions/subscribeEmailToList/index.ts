import { EMAIL_OCTOPUS_API_KEY } from "@/services/emailOctopus/emailOctopus";

export const subscribeEmailToList = async (email: string, listId: string) => {
  try {
    const response = await fetch(
      `https://api.emailoctopus.com/lists/${listId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${EMAIL_OCTOPUS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status: "subscribed",
        }),
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
