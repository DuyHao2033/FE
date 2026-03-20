"use client";

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Award, Lock, Mail, Loader2, Globe, Building2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [loginType, setLoginType] = useState<'local' | 'ldap'>('local');
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const emailOrUsername = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      let endpoint = '/auth/login';
      let payload: any = { email: emailOrUsername, password };

      if (loginType === 'ldap') {
        endpoint = '/auth/ldap';
        payload = { username_or_email: emailOrUsername, password };
      }

      // 1. Authenticate to get tokens
      const loginRes = await api.post(endpoint, payload);
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
      console.error("Login error:", err);
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (detail && typeof detail === 'string') {
          setError(detail);
      } else if (status === 422 || status === 401 || status === 404 || status === 400) {
          setError("Invalid credentials. Please try again.");
      } else if (status === 403) {
          setError(detail || "Your account is not authorized to access this system.");
      } else {
          setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
        // 1. Send token to backend
        const loginRes = await api.post('/auth/google', { 
            id_token: credentialResponse.credential 
        });
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
        console.error("Google login error:", err);
        const detail = err.response?.data?.detail;
        setError(detail || "Google authentication failed. Please make sure you are using a valid SIU account.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 pb-4 border-b border-gray-50 flex flex-col items-center">
            <div className="mb-4 flex items-center justify-center p-2">
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
            <p className="text-gray-500 mt-1 text-sm text-center">Sign in to manage and issue digital certificates.</p>
        </div>
        
        <div className="p-8">
            {/* Login Type Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button 
                    onClick={() => setLoginType('local')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                        loginType === 'local' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Globe className="w-4 h-4" />
                    Local Login
                </button>
                <button 
                    onClick={() => setLoginType('ldap')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                        loginType === 'ldap' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Building2 className="w-4 h-4" />
                    LDAP Login
                </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs bg-opacity-70 border border-red-100 text-center animate-in fade-in slide-in-from-top-1">
                      {error}
                  </div>
              )}
              
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">
                    {loginType === 'local' ? 'Email Address' : 'LDAP Username / Email'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-gray-400" />
                  </div>
                  <input 
                    name="email"
                    type={loginType === 'local' ? 'email' : 'text'} 
                    required 
                    className="block w-full pl-11 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 sm:text-sm shadow-sm transition-all"
                    placeholder={loginType === 'local' ? "admin@siu.edu.vn" : "username"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-gray-400" />
                  </div>
                  <input 
                    name="password"
                    type="password" 
                    required 
                    className="block w-full pl-11 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 sm:text-sm shadow-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Sign in with ${loginType === 'local' ? 'Local Account' : 'LDAP'}`}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-4">
                <div className="relative w-full text-center">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                    <span className="relative bg-white px-4 text-xs text-gray-400 uppercase tracking-widest font-medium">Or continue with</span>
                </div>

                <div className="w-full flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {
                            setError("Google Login Failed");
                        }}
                        useOneTap
                        shape="pill"
                        theme="outline"
                        width="100%"
                    />
                </div>
            </div>
        </div>
        
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 font-medium">© 2026 Saigon International University. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
