"use client";

import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Building, FileText, Award, LogOut, Loader2, Layers, CircleHelp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading, isAuthenticated } = useAuthStore();
  const [mounted] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600 h-8 w-8" /></div>;
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { href: '/', label: 'Overview', icon: <LayoutDashboard size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
    { href: '/certificates', label: 'Certificates', icon: <Award size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
    { href: '/certificates/batches', label: 'Batches', icon: <Layers size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
    { href: '/certificate-decisions', label: 'Decisions', icon: <FileText size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
    { href: '/templates', label: 'Templates', icon: <FileText size={20} />, roles: ['super_admin', 'org_admin'] },
    { href: '/certificate-types', label: 'Cert Types', icon: <Layers size={20} />, roles: ['super_admin', 'org_admin'] },
    { href: '/users', label: 'Users', icon: <Users size={20} />, roles: ['super_admin', 'org_admin'] },
    { href: '/organizations', label: 'Organizations', icon: <Building size={20} />, roles: ['super_admin'] },
    { href: '/fonts', label: 'Fonts', icon: <FileText size={20} />, roles: ['super_admin'] },
    { href: '/user-guide', label: 'Hướng dẫn', icon: <CircleHelp size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            SIU Certs
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.filter(item => item.roles.includes(user.role)).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <div className={isActive ? 'text-indigo-600' : 'text-gray-400'}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={20} className="text-gray-400 group-hover:text-red-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
}
