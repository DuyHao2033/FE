"use client";

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Award, FileText, CheckCircle, Clock, Plus, Zap, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [metrics, setMetrics] = useState({
    totalCerts: 0,
    totalTemplates: 0,
    pendingBatches: 0,
    activeVerifications: 0 
  });
  const [recentCerts, setRecentCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch data
        const [certsRes, templatesRes, batchesRes] = await Promise.all([
          api.get('/certificates?limit=5'),
          api.get('/templates'),
          api.get('/batches')
        ]);

        setMetrics({
          totalCerts: certsRes.data.length >= 5 ? '5+' : certsRes.data.length,
          totalTemplates: templatesRes.data.length || 0,
          pendingBatches: batchesRes.data.filter((b: any) => b.status === "pending" || b.status === "processing").length,
          activeVerifications: 0 
        });

        if (certsRes.headers['x-total-count']) {
             setMetrics(prev => ({ ...prev, totalCerts: certsRes.headers['x-total-count'] }));
        }

        setRecentCerts(certsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { 
      title: t('common.totalIssued'), 
      value: metrics.totalCerts.toString(), 
      icon: <Award className="text-primary" />, 
      change: `0 ${t('dashboard.lastMonth')}`, 
      changeType: 'neutral' 
    },
    { 
      title: t('common.templates'), 
      value: metrics.totalTemplates.toString(), 
      icon: <FileText className="text-blue-500" />, 
      change: `0 ${t('dashboard.thisWeek')}`, 
      changeType: 'neutral' 
    },
    { 
      title: t('common.activeVerifications'), 
      value: metrics.activeVerifications.toString(), 
      icon: <CheckCircle className="text-emerald-500" />, 
      change: `0 ${t('dashboard.lastWeek')}`, 
      changeType: 'neutral' 
    },
    { 
      title: t('common.pendingBatches'), 
      value: metrics.pendingBatches.toString(), 
      icon: <Clock className="text-amber-500" />, 
      change: metrics.pendingBatches > 0 ? t('dashboard.attention') : t('common.noData'), 
      changeType: metrics.pendingBatches > 0 ? 'negative' : 'neutral' 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t('common.welcome')}, {user?.full_name}
          </h1>
          <p className="text-muted-foreground mt-1 capitalize text-sm">
            {new Date().toLocaleDateString(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20 shadow-sm">
            <Zap size={14} />
            {t('common.role')}: {user?.role.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div 
            key={stat.title} 
            className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all duration-300"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-accent/50 p-3 ring-1 ring-border/50 group-hover:bg-primary/10 group-hover:ring-primary/20 transition-colors">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-bold text-foreground mt-1 tracking-tight">{loading ? '...' : stat.value}</p>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                stat.changeType === 'positive' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : stat.changeType === 'negative' 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {t('common.recentActivity')}
                </h2>
                <Link href="/certificates" className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">{t('common.viewAll')}</Link>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border/50">
                    <Clock className="w-12 h-12 text-muted-foreground/30 mb-3 animate-pulse" />
                    <p className="text-sm font-medium">{t('common.loading')}</p>
                </div>
              ) : recentCerts.length > 0 ? (
                <div className="space-y-4">
                  {recentCerts.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <Award size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{cert.recipient_name}</p>
                          <p className="text-xs text-muted-foreground">{cert.title} • {cert.cert_code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-foreground">
                          {new Date(cert.issued_at).toLocaleDateString(i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US')}
                        </p>
                        <Link href={`/certificates/${cert.id}`} className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1 justify-end mt-1">
                          {t('common.view')} <ArrowRight size={10} className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-accent/20 rounded-xl border border-dashed border-border/50">
                    <Award className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium">{t('common.noData')}</p>
                </div>
              )}
          </div>
          
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-md transition-all duration-300">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                {t('common.quickActions')}
              </h2>
              <div className="space-y-4">
                  <Link href="/certificates/issue" className="w-full flex items-center justify-between p-4 bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-all duration-200 font-bold shadow-lg shadow-primary/20 group">
                      <div className="flex items-center gap-3">
                        <Award size={20} className="group-hover:scale-110 transition-transform" />
                        <span>{t('dashboard.issueSingle')}</span>
                      </div>
                      <Plus size={18} />
                  </Link>
                  <Link href="/templates/create" className="w-full flex items-center justify-between p-4 bg-accent text-accent-foreground hover:bg-accent/80 rounded-xl transition-all duration-200 font-bold border border-border/50 group">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="group-hover:scale-110 transition-transform text-primary" />
                        <span>{t('dashboard.createNewTemplate')}</span>
                      </div>
                      <Plus size={18} className="text-muted-foreground" />
                  </Link>
                  <Link href="/certificates/batch-issue" className="w-full flex items-center justify-between p-4 border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 font-bold group">
                      <div className="flex items-center gap-3">
                        <Zap size={20} className="group-hover:scale-110 transition-transform" />
                        <span>{t('certificates.batchIssue')}</span>
                      </div>
                      <Plus size={18} />
                  </Link>
              </div>
              
              <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Zap size={14} />
                  {t('dashboard.tipOfTheDay')}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {t('dashboard.tipContent')}
                </p>
              </div>
          </div>
      </div>
    </div>
  );
}
