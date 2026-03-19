"use client";

import Link from 'next/link';
import { BookOpen, CircleCheck, FileText, Printer, ScanSearch, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function UserGuidePage() {
  const { t } = useTranslation();

  const stepsList = [
    {
      title: t('userGuide.steps.step1.title'),
      description: t('userGuide.steps.step1.description'),
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    },
    {
      title: t('userGuide.steps.step2.title'),
      description: t('userGuide.steps.step2.description'),
      icon: <FileText className="h-5 w-5 text-blue-500" />,
    },
    {
      title: t('userGuide.steps.step3.title'),
      description: t('userGuide.steps.step3.description'),
      icon: <CircleCheck className="h-5 w-5 text-emerald-500" />,
    },
    {
      title: t('userGuide.steps.step4.title'),
      description: t('userGuide.steps.step4.description'),
      icon: <Printer className="h-5 w-5 text-amber-500" />,
    },
    {
      title: t('userGuide.steps.step5.title'),
      description: t('userGuide.steps.step5.description'),
      icon: <ScanSearch className="h-5 w-5 text-sky-500" />,
    },
  ];

  const tipsList = t('userGuide.tips', { returnObjects: true }) || [];
  const tips = Array.isArray(tipsList) ? tipsList : [];

  return (
    <div className="space-y-8 animate-in mt-4 fade-in slide-in-from-bottom-4 duration-700">
      <section className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/90 to-sky-600 text-primary-foreground shadow-2xl shadow-primary/20">
        <div className="grid gap-8 px-8 py-10 md:grid-cols-[1.3fr_0.7fr] md:px-12 md:py-14">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest ring-1 ring-white/20 backdrop-blur-sm">
              <BookOpen className="h-4 w-4" />
              {t('userGuide.title')}
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
              {t('userGuide.subtitle')}
            </h1>
            <p className="max-w-2xl text-lg font-medium text-white/80 leading-relaxed md:text-xl">
              {t('userGuide.description')}
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-[2rem] bg-white/10 p-8 ring-1 ring-white/20 backdrop-blur-md shadow-inner">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">{t('userGuide.quickTip')}</p>
            <p className="text-2xl font-bold leading-tight">{t('userGuide.slowDown')}</p>
            <p className="mt-4 text-sm font-medium text-white/70">
              {t('userGuide.description').split('.')[2] || ''}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
             <span className="w-2 h-8 bg-primary rounded-full"></span>
             {t('userGuide.basicSteps')}
          </h2>
          <div className="space-y-5">
            {stepsList.map((step, idx) => (
              <div key={idx} className="flex gap-6 rounded-2xl bg-accent/30 p-6 hover:bg-accent/50 transition-all group">
                <div className="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm border border-border group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
              {t('userGuide.importantNotes')}
            </h2>
            <ul className="space-y-4">
              {tips.map((tip: string, idx: number) => (
                <li key={idx} className="flex gap-4 items-start bg-accent/20 p-4 rounded-xl border border-transparent hover:border-border transition-all">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-muted-foreground leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-8 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <h2 className="text-xl font-bold text-primary mb-3">{t('userGuide.stillUnclear')}</h2>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              {t('userGuide.contactAdmin')}
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 uppercase tracking-widest"
            >
              {t('userGuide.backToDashboard')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
