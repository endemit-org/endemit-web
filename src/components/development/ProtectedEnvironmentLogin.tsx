"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiPath } from "@/lib/api";

export default function ProtectedEnvironmentLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(getApiPath("staging/authenticate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Invalid password");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err ? String(err) : "Something went wrong");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
      <div>
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Staging Environment
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter password to continue
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Password"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          disabled={loading}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading || !password}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
        >
          {loading ? "Loading..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
