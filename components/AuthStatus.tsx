'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  theme_color: string | null;
};

export default function AuthStatus() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="rounded-full bg-[#ff78b9] px-5 py-2.5 text-sm font-bold text-[#180d15] transition hover:brightness-110"
      >
        Entrar
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push('/perfil')}
      className="flex items-center gap-3 rounded-full border border-white/10 bg-[#191219] px-4 py-2 transition hover:border-[#ff78b9]/40"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff78b9] text-xs font-black text-[#180d15]">
        {user.username.charAt(0).toUpperCase()}
      </div>

      <span className="max-w-[120px] truncate text-sm font-semibold text-white">
        @{user.username}
      </span>
    </button>
  );
}
