export interface SubscribeNewsletterParams {
  email: string;
  apiEndpoint: string;
}

export interface SubscribeNewsletterResult {
  success: boolean;
  error?: string;
}

export async function subscribeFromClient({
  email,
  apiEndpoint,
}: SubscribeNewsletterParams): Promise<SubscribeNewsletterResult> {
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to subscribe",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to subscribe",
    };
  }
}
