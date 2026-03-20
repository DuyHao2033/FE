"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    // Không redirect nếu đang ở trang login hoặc trang verify (công khai)
    if (pathname.includes('/login') || pathname.includes('/verify')) {
      // Vẫn cố gắng fetch user nếu có token (để hiển thị thông tin nếu đã đăng nhập)
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (token) {
        api.get('/auth/me').then(res => setUser(res.data)).catch(() => {}).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
      return;
    }

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
  }, [setUser, setLoading, logout, router, pathname]);

  return <>{children}</>;
}
