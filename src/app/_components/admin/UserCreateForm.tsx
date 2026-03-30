"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ActionButton from "@/app/_components/form/ActionButton";
import { createUserAction } from "@/domain/user/actions/createUserAction";
import { UserStatus } from "@prisma/client";

interface UserCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const userStatuses: UserStatus[] = [
  "ACTIVE",
  "PENDING_VERIFICATION",
  "SUSPENDED",
];

type SignInType = "PASSWORD" | "OTC";

export default function UserCreateForm({
  isOpen,
  onClose,
  onSuccess,
}: UserCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [signInType, setSignInType] = useState<SignInType>("OTC");
  const [status, setStatus] = useState<UserStatus>("ACTIVE");

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setName("");
    setPassword("");
    setSignInType("OTC");
    setStatus("ACTIVE");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const newUser = await createUserAction({
        username: username || email,
        email,
        name: name || undefined,
        password: signInType === "PASSWORD" ? password : undefined,
        signInType,
        status,
      });
      resetForm();
      onSuccess?.();
      router.push(`/admin/users/${newUser.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Create New User
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty to use email"
            />
            <p className="mt-1 text-xs text-gray-500">
              If left empty, the email will be used as username
            </p>
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="signInType"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sign-in Type <span className="text-red-500">*</span>
            </label>
            <select
              id="signInType"
              value={signInType}
              onChange={e => setSignInType(e.target.value as SignInType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="OTC">OTC (One-Time Code)</option>
              <option value="PASSWORD">Password</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {signInType === "OTC"
                ? "User will sign in via email code"
                : "User will sign in with a password"}
            </p>
          </div>

          {signInType === "PASSWORD" && (
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={signInType === "PASSWORD"}
                minLength={8}
                placeholder="Minimum 8 characters"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value as UserStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userStatuses.map(s => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <ActionButton
              type="submit"
              disabled={isLoading}
              size="sm"
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create User"}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
