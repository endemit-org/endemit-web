"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchUsersAction,
  type UserSearchResult,
} from "@/domain/user/actions/searchUsersAction";

interface UserAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onUserSelect?: (user: UserSearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
}
export default function UserAutocomplete({
  value,
  onChange,
  onUserSelect,
  placeholder = "Search users or enter email",
  disabled = false,
}: UserAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    const result = await searchUsersAction(query);
    setIsLoading(false);

    if (result.success) {
      setUsers(result.users);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (selectedUser) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, searchUsers, selectedUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedUser(null);
    setIsOpen(true);
  };

  const handleUserClick = (user: UserSearchResult) => {
    setSelectedUser(user);
    onChange(user.email || "");
    setIsOpen(false);
    onUserSelect?.(user);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    onChange("");
    setUsers([]);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (!selectedUser && value.length >= 2) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
            selectedUser ? "pr-8 bg-purple-50 border-purple-300" : ""
          }`}
          placeholder={placeholder}
        />
        {selectedUser && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-4 h-4"
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
        )}
        {isLoading && !selectedUser && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <svg
              className="w-4 h-4 animate-spin text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="mt-1 text-xs text-purple-600 flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Selected: {selectedUser.name || selectedUser.username}</span>
        </div>
      )}

      {isOpen && users.length > 0 && !selectedUser && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {users.map(user => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleUserClick(user)}
              className="w-full px-3 py-2 text-left hover:bg-purple-50 focus:bg-purple-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 text-sm font-medium">
                    {(user.name || user.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.name || user.username}
                  </div>
                  {user.email && (
                    <div className="text-xs text-gray-500 truncate">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen &&
        value.length >= 2 &&
        users.length === 0 &&
        !isLoading &&
        !selectedUser && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <p className="text-sm text-gray-500 text-center">
              No users found. You can enter a new email.
            </p>
          </div>
        )}
    </div>
  );
}
