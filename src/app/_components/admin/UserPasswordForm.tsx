"use client";

import { useState } from "react";
import ActionButton from "@/app/_components/form/ActionButton";
import { updateUserPasswordAction } from "@/domain/user/actions/updateUserPasswordAction";

interface UserPasswordFormProps {
  userId: string;
}

export default function UserPasswordForm({ userId }: UserPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUserPasswordAction(userId, password);
      setSuccess(true);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter new password (min 8 characters)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          minLength={8}
          required
        />
        <ActionButton
          type="submit"
          disabled={isLoading || password.length < 8}
          size="sm"
          fullWidth={false}
        >
          {isLoading ? "Setting..." : "Set Password"}
        </ActionButton>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
          Password updated successfully
        </div>
      )}
    </form>
  );
}
