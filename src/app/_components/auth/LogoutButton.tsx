'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/v1/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/auth/sign-in');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-700 hover:text-gray-900"
    >
      Sign out
    </button>
  );
}
