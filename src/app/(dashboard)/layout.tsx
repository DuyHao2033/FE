"use client";

import { useAuthStore } from '@/lib/store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Building, FileText, Award, LogOut, Loader2, 
  Layers, CircleHelp, Moon, Sun, Languages, ChevronDown, Monitor
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const navGroups = [
    {
      title: t('sidebar.resources'),
      items: [
        { href: '/', label: t('sidebar.overview'), icon: <LayoutDashboard size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
        { href: '/user-guide', label: t('sidebar.guidelines'), icon: <CircleHelp size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
      ]
    },
    {
      title: t('sidebar.management'),
      items: [
        { href: '/certificates', label: t('sidebar.certificates'), icon: <Award size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
        { href: '/certificates/batches', label: t('sidebar.batches'), icon: <Layers size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
        { href: '/certificate-decisions', label: t('sidebar.decisions'), icon: <FileText size={20} />, roles: ['super_admin', 'org_admin', 'issuer'] },
      ]
    },
    {
      title: t('sidebar.configuration'),
      items: [
        { href: '/templates', label: t('sidebar.templates'), icon: <FileText size={20} />, roles: ['super_admin', 'org_admin'] },
        { href: '/certificate-types', label: t('sidebar.certTypes'), icon: <Layers size={20} />, roles: ['super_admin', 'org_admin'] },
        { href: '/fonts', label: t('sidebar.fonts'), icon: <FileText size={20} />, roles: ['super_admin'] },
      ]
    },
    {
      title: t('sidebar.administration'),
      items: [
        { href: '/users', label: t('sidebar.users'), icon: <Users size={20} />, roles: ['super_admin', 'org_admin'] },
        { href: '/organizations', label: t('sidebar.organizations'), icon: <Building size={20} />, roles: ['super_admin'] },
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col hidden md:flex transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            SIU Certs
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.filter(item => item.roles.includes(user.role)).map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <div className={isActive ? 'text-primary' : 'text-muted-foreground/70'}>
                        {item.icon}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Area with Switchers */}
        <div className="p-4 border-t border-border space-y-3 bg-card/80 backdrop-blur-md">
          {/* Theme & Language Switchers */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-accent/50 hover:bg-accent text-accent-foreground transition-colors border border-border/50"
              title={t('common.language')}
            >
              <Languages size={16} />
              <span className="text-xs font-bold uppercase">{i18n.language}</span>
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center gap-2 px-2 py-2 rounded-md bg-accent/50 hover:bg-accent text-accent-foreground transition-colors border border-border/50"
              title={t('common.theme')}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span className="text-xs font-bold capitalize">{theme === 'dark' ? t('common.dark') : t('common.light')}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-accent/30 border border-border/50">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30 shadow-inner">
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{user.full_name}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{user.role}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 border border-transparent hover:border-destructive/20"
          >
            <LogOut size={18} />
            <span className="text-sm">{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8 transition-colors duration-300">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
}
