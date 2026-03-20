"use client";

import { useState } from 'react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Award, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // 1. Login to get tokens
      const loginRes = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token } = loginRes.data;

      // 2. Fetch User Me
      const userRes = await api.get('/auth/me', {
         headers: { Authorization: `Bearer ${access_token}` }
      });
      const userData = userRes.data;

      // 3. Save to store
      login(access_token, refresh_token, userData);
      
      // 4. Redirect
      router.push('/');
    } catch (err: any) {
      if (err.response?.status === 422 || err.response?.status === 401 || err.response?.status === 404 || err.response?.status === 400) {
         setError("Invalid email or password");
      } else {
         setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 pb-6 border-b border-gray-50 flex flex-col items-center">
            <div className="mb-6 flex items-center justify-center p-2">
                {!logoError ? (
                  <img 
                    src="/certificate/logo.png" 
                    alt="SIU Logo" 
                    className="h-20 w-auto object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner">
                      <Award className="w-8 h-8 text-indigo-600" />
                  </div>
                )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SIU Digital Certificate</h1>
            <p className="text-gray-500 mt-2 text-sm text-center">Sign in to manage and issue digital certificates.</p>
        </div>
        
        <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm bg-opacity-50 border border-red-100 text-center">
                      {error}
                  </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    name="email"
                    type="email" 
                    required 
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm shadow-sm transition-all"
                    placeholder="admin@siu.edu.vn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    name="password"
                    type="password" 
                    required 
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm shadow-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in to Dashboard'}
              </button>
            </form>
        </div>
        
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">© 2026 Saigon International University. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
