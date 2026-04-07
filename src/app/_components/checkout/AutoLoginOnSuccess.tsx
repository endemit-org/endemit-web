"use client";

import { useEffect } from "react";
import { autoLoginAction } from "@/domain/auth/actions/autoLoginAction";
import { notifyAuthStateChanged } from "@/app/_hooks/useCurrentUser";

interface AutoLoginOnSuccessProps {
  userId: string;
}

export default function AutoLoginOnSuccess({ userId }: AutoLoginOnSuccessProps) {
  useEffect(() => {
    autoLoginAction(userId)
      .then(() => {
        // Notify useCurrentUser hooks to refetch
        notifyAuthStateChanged();
      })
      .catch(console.error);
  }, [userId]);

  return null;
}
