"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, MoreVertical, Layout, Search, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Loader2, Copy, Sparkles, SlidersHorizontal, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { getFullUrl } from '@/utils/url';
import { api } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";


interface Template {
  id: string;
  name: string;
  category: string;
  page_size: string;
  orientation: string;
  is_active: boolean;
  background_url?: string;
  certificate_type_id?: string;
}

export default function TemplatesPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(6);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/templates', {
        params: {
          q: debouncedSearch,
          page: currentPage,
          limit: pageSize
        }
      });
      
      if (Array.isArray(res.data)) {
        setTemplates(res.data);
        setTotalItems(res.data.length);
        setTotalPages(1);
      } else {
        setTemplates(res.data.items || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(Math.ceil((res.data.total || 0) / pageSize));
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [debouncedSearch, currentPage]);
const handleStartTour = useCallback(() => {
  const isDark = document.documentElement.classList.contains('dark');
  
  const d = driver({
    showProgress: true,
    nextBtnText: t('tour.next'),
    prevBtnText: t('tour.prev'),
    doneBtnText: t('tour.done'),
    popoverClass: isDark ? 'driverjs-theme-dark' : '',
    steps: [
      {
        element: '#tour-search',
        popover: {
          title: t('tour.templatesSearchTitle'),
          description: t('tour.templatesSearchDesc'),
          side: "bottom"
        }
      },
      {
        element: '#tour-create-btn',
        popover: {
          title: t('tour.templatesCreateTitle'),
          description: t('tour.templatesCreateDesc'),
          side: "left"
        }
      },
      {
        element: '#tour-template-card',
        popover: {
          title: t('tour.templatesCardTitle'),
          description: t('tour.templatesCardDesc'),
          side: "top"
        }
      },
      {
        element: '#tour-edit-btn',
        popover: {
          title: t('tour.templatesEditTitle'),
          description: t('tour.templatesEditDesc'),
          side: "bottom"
        }
      },
      {
        element: '#tour-more-options',
        popover: {
          title: t('tour.templatesMoreOptionsTitle'),
          description: t('tour.templatesMoreOptionsDesc'),
          side: "left"
        }
      }
    ]
  });
  d.drive();
}, [t]);
  const handleDuplicate = async (tmpl: Template) => {
    try {
      setIsSubmitting(true);
      const res = await api.get(`/templates/${tmpl.id}`);
      const fullTmpl = res.data;
      
      const createRes = await api.post('/templates', {
        name: `${fullTmpl.name} ${t('common.copyHint')}`,
        category: fullTmpl.category,
        page_size: fullTmpl.page_size,
        orientation: fullTmpl.orientation,
        certificate_type_id: fullTmpl.certificate_type_id
      });
      const newId = createRes.data.id;

      await api.patch(`/templates/${newId}`, {
        layout_json: fullTmpl.layout_json,
        background_url: fullTmpl.background_url
      });
      
      setActiveMenuId(null);
      fetchTemplates();
    } catch (error) {
      console.error("Failed to duplicate template", error);
      alert(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (tmpl: Template) => {
    try {
      setActiveMenuId(null);
      await api.patch(`/templates/${tmpl.id}`, {
        is_active: !tmpl.is_active
      });
      fetchTemplates();
    } catch (error) {
      console.error("Failed to toggle status", error);
      alert(t('common.error'));
    }
  };

return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <Layout size={14} />
            {t('sidebar.templates')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('sidebar.templates')}</h1>
          <p className="mt-2 text-muted-foreground max-w-lg">
            {t('templates.subtitle')}
          </p>
        </div>
        <div id="tour-search" className="relative max-w-xl group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={t('templates.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <Link
            id="tour-create-btn"
            href="/templates/create"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200 whitespace-nowrap"
          >
            <Plus size={18} />
            {t('templates.create')}
          </Link>
          <button
            type="button"
            onClick={handleStartTour}
            className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-bold text-foreground hover:bg-accent transition-all"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>
      
      {loading ? (
          <div className="py-32 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary opacity-50" />
            <p className="mt-4 text-sm font-bold text-muted-foreground tracking-widest uppercase">{t('common.fetchingData')}</p>
          </div>
      ) : isSubmitting ? (
          <div className="py-32 text-center flex flex-col items-center gap-6 animate-pulse">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse" />
                <Loader2 size={40} className="animate-spin text-primary relative z-10" />
              </div>
              <p className="text-sm font-bold text-muted-foreground tracking-widest uppercase">{t('common.processing')}</p>
          </div>
      ) : templates.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-3xl bg-card/50 backdrop-blur-sm">
             <div className="bg-accent w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
               <Layout className="h-10 w-10 text-muted-foreground/40" />
             </div>
             <h3 className="text-xl font-bold text-foreground">{t('templates.noData')}</h3>
             <p className="mt-2 text-muted-foreground max-w-sm mx-auto">{t('templates.noDataSub')}</p>
          </div>
      ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {templates.map((tmpl: Template, index: number) => (
                <div key={tmpl.id} id={index === 0 ? 'tour-template-card' : undefined} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all group flex flex-col relative border-b-4 border-b-transparent hover:border-b-primary hover:-translate-y-1">
                    <div className="h-52 bg-accent/30 flex items-center justify-center border-b border-border relative overflow-hidden">
                        {tmpl.background_url ? (
                            <img 
                                src={getFullUrl(tmpl.background_url)} 
                                alt={tmpl.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 opacity-20">
                                <Layout className="h-14 w-14 text-muted-foreground" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t('common.noBackground')}</span>
                            </div>
                        )}
                        <div className="absolute top-4 right-4 shadow-2xl">
                            <span className={`inline-flex items-center rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${tmpl.is_active ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20' : 'bg-muted/80 text-muted-foreground border-border backdrop-blur-md'}`}>
                                {tmpl.is_active ? t('common.active') : t('common.draft')}
                            </span>
                        </div>
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-4 mb-2">
                           <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{tmpl.category || t('common.general')}</p>
                           <div className="relative">
                                <button 
                                    id={index === 0 ? 'tour-more-options' : undefined}
                                    onClick={() => setActiveMenuId(activeMenuId === tmpl.id ? null : tmpl.id)}
                                    className={`p-2 rounded-lg transition-all border ${activeMenuId === tmpl.id ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent border-border/50'}`}
                                >
                                    <MoreVertical size={16} />
                                </button>
                                
                                {activeMenuId === tmpl.id && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                        <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-card shadow-2xl ring-1 ring-border z-20 overflow-hidden border border-border/50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-1.5 flex flex-col gap-1">
                                                <button
                                                    onClick={() => toggleActive(tmpl)}
                                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-bold text-foreground hover:bg-accent rounded-xl transition-all"
                                                >
                                                    {tmpl.is_active ? (
                                                        <>
                                                            <XCircle size={16} className="text-muted-foreground" />
                                                            {t('common.deactivate')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle size={16} className="text-emerald-500" />
                                                            {t('common.activate')}
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(tmpl)}
                                                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-bold text-foreground hover:bg-accent rounded-xl transition-all"
                                                >
                                                    <Copy size={16} className="text-muted-foreground" />
                                                    {t('common.duplicate')}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground line-clamp-1 leading-tight mb-4">{tmpl.name}</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                           <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/50 text-accent-foreground px-2.5 py-1 text-[10px] font-bold uppercase border border-border/50">
                             <SlidersHorizontal size={12} className="text-primary opacity-60" />
                             {tmpl.page_size}
                           </span>
                           <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/50 text-accent-foreground px-2.5 py-1 text-[10px] font-bold uppercase border border-border/50">
                             <Layout size={12} className="text-primary opacity-60" />
                             {t(`common.${tmpl.orientation.toLowerCase()}` as any)}
                           </span>
                        </div>
                        
                        <Link 
                          id={index === 0 ? 'tour-edit-btn' : undefined}
                          href={`/templates/${tmpl.id}/builder`}
                          className="mt-auto w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-foreground hover:bg-primary hover:text-primary-foreground border border-border/50 transition-all duration-300"
                        >
                          <Sparkles size={14} />
                          {t('common.edit')}
                        </Link>
                    </div>
                </div>
            ))}
          </div>

          {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-border pt-8 pb-12">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                      {t('common.showing')} <span className="text-foreground">{(currentPage - 1) * pageSize + 1}</span>-
                      <span className="text-foreground">{Math.min(currentPage * pageSize, totalItems)}</span> / 
                      <span className="text-foreground"> {totalItems}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground hover:bg-accent disabled:opacity-30 transition-all shadow-sm"
                      >
                          <ChevronLeft size={18} />
                      </button>
                      <div className="flex gap-1.5">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === page ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' : 'hover:bg-accent text-muted-foreground border border-border shadow-sm'}`}
                              >
                                  {page}
                              </button>
                          ))}
                      </div>
                      <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground hover:bg-accent disabled:opacity-30 transition-all shadow-sm"
                      >
                          <ChevronRight size={18} />
                      </button>
                  </div>
              </div>
          )}
          </>
      )}
    </div>
  );
}
