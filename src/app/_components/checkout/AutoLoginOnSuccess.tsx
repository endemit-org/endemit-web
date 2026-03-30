"use client";

import { useEffect } from "react";
import { autoLoginAction } from "@/domain/auth/actions/autoLoginAction";

interface AutoLoginOnSuccessProps {
  userId: string;
}

export default function AutoLoginOnSuccess({ userId }: AutoLoginOnSuccessProps) {
  useEffect(() => {
    autoLoginAction(userId).catch(console.error);
  }, [userId]);

  return null;
}
