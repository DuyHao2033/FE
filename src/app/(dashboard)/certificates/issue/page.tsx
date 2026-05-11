"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Layout as LayoutIcon, Search, Award, Loader2, ArrowLeft, HelpCircle } from 'lucide-react';
import { getFullUrl } from '@/utils/url';
import VisualBuilder, { BuilderElement } from '@/components/builder/VisualBuilder';
import { useTranslation } from 'react-i18next';
import { useTheme } from "next-themes";

// Import Driver.js
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface Template {
  id: string;
  name: string;
  category?: string;
  page_size: string;
  orientation: string;
  background_url?: string;
  layout_json?: any;
  is_active?: boolean;
}

interface Decision {
  id: string;
  name?: string;
  decision_number?: string;
  [key: string]: any;
}

export default function IssueSinglePage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  
  const [step, setStep] = useState<'select-template' | 'edit-data'>('select-template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [registryNumber, setRegistryNumber] = useState<string>('');

  // --- HÀM KHỞI TẠO TOUR ĐÃ CẬP NHẬT THEO YÊU CẦU ---
  const handleStartTour = useCallback(() => {
    const isDark = theme === 'dark';
    
    if (step === 'select-template') {
      const driverStep1 = driver({
        popoverClass: isDark ? 'driverjs-theme-dark' : '',
        nextBtnText: t('tour.next'),
        prevBtnText: t('tour.prev'),
        doneBtnText: t('tour.done'),
        steps: [
          {
            element: '#tour-search',
            popover: {
              title: t('tour.searchTitle'),
              description: t('tour.searchDesc'),
              side: 'bottom'
            }
          },
          { 
            element: '#tour-first-template', 
            popover: { 
              title: t('tour.selectTitle'), 
              description: t('tour.selectDesc'), 
              side: 'top' 
            } 
          }
        ]
      });
      driverStep1.drive();
    } else {
      const driverStepDetails = driver({
        showProgress: true,
        nextBtnText: t('tour.next'),
        prevBtnText: t('tour.prev'),
        doneBtnText: t('tour.done'),
        popoverClass: isDark ? 'driverjs-theme-dark' : '',
        steps: [
          { 
            element: '#tour-step-info',
            popover: { 
              title: t('tour.decisionTitle'), 
              description: t('tour.decisionDesc'), 
              side: 'right' 
            } 
          },
          { 
            element: '#builder-save-btn', 
            popover: { 
              title: t('tour.submitTitle'), 
              description: t('tour.submitDesc'), 
              side: 'top' 
            } 
          }
        ]
      });
      driverStepDetails.drive();
    }
  }, [theme, step, t]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tmplRes, decRes] = await Promise.all([
          api.get('/templates'),
          api.get('/certificate-decisions')
        ]);
        const tmplData = Array.isArray(tmplRes.data) ? tmplRes.data : (tmplRes.data.items || []);
        setTemplates(tmplData.filter((t: any) => t.is_active));
        const decData = Array.isArray(decRes.data) ? decRes.data : (decRes.data.items || []);
        setDecisions(decData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTemplateSelect = (tmpl: Template) => {
    setSelectedTemplate(tmpl);
    setStep('edit-data');
  };

  const handleIssue = async (layout: { elements: BuilderElement[] }) => {
    if (!selectedTemplate) return;
    try {
      setIsSubmitting(true);
      const variableData: Record<string, string> = {};
      layout.elements.forEach(el => {
        if (el.type === 'text' && el.is_variable) {
          variableData[el.key] = el.content || "";
        }
      });
      const recipientName = variableData['recipient_name'] || variableData['name'] || "Recipient";

      await api.post('/certificates', {
        template_id: selectedTemplate.id,
        recipient_name: recipientName,
        title: selectedTemplate.name,
        decision_id: selectedDecisionId || undefined,
        registry_number: registryNumber || undefined,
        custom_data: variableData
      });
      router.push('/certificates');
    } catch (error: any) {
      console.error("Issue error:", error?.response?.data || error?.message || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 h-full animate-in fade-in duration-700 text-foreground bg-background">
      {/* Header Area */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5 min-w-0 flex-1">
            <button 
              onClick={() => step === 'edit-data' ? setStep('select-template') : router.back()}
              className="flex-shrink-0 p-3 hover:bg-accent rounded-xl transition-all border border-border text-muted-foreground shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight truncate">
                        {step === 'select-template' ? t('certificates.issue.singleTitle') : t('certificates.issue.details')}
                    </h1>
                    <button 
                        onClick={handleStartTour}
                        className="p-1.5 text-primary bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-all border border-primary/20"
                    >
                        <HelpCircle size={18} />
                    </button>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold ${step === 'select-template' ? 'bg-primary text-primary-foreground' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {step === 'select-template' ? '1' : <Award size={18} />}
              </div>
              <div className="w-10 h-1 rounded-full bg-muted" />
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold ${step === 'edit-data' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
              </div>
          </div>
        </div>
      </div>

      {step === 'select-template' ? (
        <div className="flex-1 space-y-6">
          <div id="tour-search" className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('certificates.issue.searchTemplates')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {loading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-4">
                <Loader2 size={40} className="animate-spin text-primary opacity-50" />
                <span className="text-sm font-bold uppercase tracking-widest">{t('common.fetchingData')}</span>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
              {filteredTemplates.map((tmpl, index) => (
                <div 
                  key={tmpl.id} 
                  // Gắn ID cho mẫu đầu tiên để Tour Bước 1 trỏ vào
                  id={index === 0 ? "tour-first-template" : undefined}
                  onClick={() => handleTemplateSelect(tmpl)}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer flex flex-col"
                >
                  <div className="h-48 bg-muted flex items-center justify-center relative overflow-hidden">
                    {tmpl.background_url ? (
                      <img src={getFullUrl(tmpl.background_url)} alt={tmpl.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <LayoutIcon className="h-12 w-12 text-muted-foreground opacity-20" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-bold text-primary uppercase mb-1">{tmpl.category || 'General'}</p>
                    <h3 className="font-bold line-clamp-1 group-hover:text-primary transition-colors">{tmpl.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-in slide-in-from-right duration-500">
          <div className="flex-1 flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl relative h-full">
            {selectedTemplate && (
              <VisualBuilder 
                  initialLayout={selectedTemplate.layout_json}
                  initialMetadata={{
                    ...selectedTemplate,
                    category: selectedTemplate.category || 'General'
                  } as any}
                  backgroundUrl={selectedTemplate.background_url}
                  onSave={handleIssue}
                  isNew={false}
                  mode="issue"
                  extraIssueData={{
                    decisionId: selectedDecisionId,
                    setDecisionId: setSelectedDecisionId,
                    registryNumber: registryNumber,
                    setRegistryNumber: setRegistryNumber,
                    decisions: decisions
                  }}
              />
            )}
          </div>
        </div>
      )}

      {isSubmitting && (
          <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-card p-10 rounded-3xl border border-border flex flex-col items-center gap-6 shadow-2xl">
                  <Loader2 size={48} className="animate-spin text-primary" />
                  <span className="text-xl font-bold">{t('certificates.issue.generating')}</span>
              </div>
          </div>
      )} 
    </div>
  );
}