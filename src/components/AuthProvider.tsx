"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } else {
          setLoading(false);
          router.push('/login');
        }
      } catch (error) {
        logout();
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [setUser, setLoading, logout, router]);

  return <>{children}</>;
}
