import crypto from "crypto";
import { EMAIL_OCTOPUS_API_KEY } from "@/services/emailOctopus/emailOctopus";

export const isEmailSubscribedToList = async (
  email: string,
  listId: string
) => {
  try {
    const memberId = crypto
      .createHash("md5")
      .update(email.toLowerCase())
      .digest("hex");

    const response = await fetch(
      `https://api.emailoctopus.com/lists/${listId}/contacts/${memberId}`,
      {
        headers: {
          Authorization: `Bearer ${EMAIL_OCTOPUS_API_KEY}`,
        },
      }
    );

    if (response.status === 404) {
      return { exists: false };
    }

    if (!response.ok) {
      const data = await response.json();
      return { exists: false, error: data.error?.message };
    }

    const data = await response.json();
    return { exists: true, status: data.status };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { exists: false, error: "An unexpected error occurred" };
  }
};
