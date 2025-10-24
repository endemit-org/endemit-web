"use client";

import { useState, useEffect } from "react";
import { getApiPath } from "@/lib/util/api";

interface UseNewsletterSubscriptionReturn {
  shouldShowNewsletter: boolean;
  isLoading: boolean;
}

export function useNewsletterSubscription(
  email: string,
  emailIsValid: boolean
): UseNewsletterSubscriptionReturn {
  const [shouldShowNewsletter, setShouldShowNewsletter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Don't check if email is invalid or empty
    if (!emailIsValid || !email) {
      setShouldShowNewsletter(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(getApiPath(`newsletter/is-subscribed-to-general`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          // Show newsletter checkbox if user is NOT already subscribed
          setShouldShowNewsletter(data && !data.exists);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShouldShowNewsletter(false);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [email, emailIsValid]);

  return { shouldShowNewsletter, isLoading };
}
