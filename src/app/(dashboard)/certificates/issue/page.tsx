"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Layout as LayoutIcon, ChevronRight, Search, Award, Loader2, ArrowLeft, FileText } from 'lucide-react';
import { getFullUrl } from '@/utils/url';
import VisualBuilder, { BuilderElement, TemplateMetadata } from '@/components/builder/VisualBuilder';
import { useTranslation } from 'react-i18next';

interface Template {
  id: string;
  name: string;
  category: string;
  page_size: string;
  orientation: string;
  background_url?: string;
  layout_json?: any;
}

export default function IssueSinglePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<'select-template' | 'edit-data'>('select-template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [decisions, setDecisions] = useState<any[]>([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [registryNumber, setRegistryNumber] = useState<string>('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/templates');
        if (Array.isArray(res.data)) {
          setTemplates(res.data.filter((t: any) => t.is_active));
        } else {
          setTemplates((res.data.items || []).filter((t: any) => t.is_active));
        }
      } catch (error) {
        console.error("Failed to fetch templates", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchDecisions = async () => {
      try {
        const res = await api.get('/certificate-decisions');
        setDecisions(Array.isArray(res.data) ? res.data : (res.data.items || []));
      } catch (error) {
        console.error("Failed to fetch decisions", error);
      }
    };

    fetchTemplates();
    fetchDecisions();
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
        if (el.type === 'text') {
          if (el.is_variable) {
            variableData[el.key] = el.content || "";
          } else if (el.content?.includes('{{')) {
            const matches = el.content.match(/\{\{([^{}]+)\}\}/g);
            matches?.forEach(m => {
              const key = m.replace(/[{}]/g, '').trim();
              if (el.runtime_values?.[key]) {
                variableData[key] = el.runtime_values[key];
              }
            });
          }
        }
      });

      const keys = Object.keys(variableData);
      
      let recipientName = "";
      const nameKey = keys.find(k => 
        ['recipient_name', 'name', 'fullname', 'full_name', 'họ tên', 'họ và tên'].includes(k.toLowerCase())
      );
      if (nameKey) {
        recipientName = variableData[nameKey];
      } else if (keys.length > 0) {
        recipientName = variableData[keys[0]];
      } else {
        recipientName = "Recipient";
      }

      let title = selectedTemplate.name;
      const titleKey = keys.find(k => 
        ['title', 'subject', 'course', 'tiêu đề', 'về việc'].includes(k.toLowerCase())
      );
      if (titleKey) {
        title = variableData[titleKey];
      }

      const emailKey = keys.find(k => k.toLowerCase().includes('email'));
      const idKey = keys.find(k => ['recipient_id', 'student_id', 'employee_id', 'id'].includes(k.toLowerCase()));

      await api.post('/certificates', {
        template_id: selectedTemplate.id,
        recipient_name: recipientName,
        recipient_email: emailKey ? variableData[emailKey] : undefined,
        recipient_id: idKey ? variableData[idKey] : undefined,
        title: title,
        decision_id: selectedDecisionId || undefined,
        registry_number: registryNumber || undefined,
        custom_data: variableData
      });

      router.push('/certificates');
    } catch (error) {
      console.error("Failed to issue certificate", error);
      alert(t('common.error') || "Failed to issue certificate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 h-full animate-in fade-in duration-700">
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => step === 'edit-data' ? setStep('select-template') : router.back()}
              className="p-3 hover:bg-accent rounded-xl transition-all border border-border text-muted-foreground shadow-sm group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {step === 'select-template' ? t('certificates.issue.singleTitle') : t('certificates.issue.details')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {step === 'select-template' ? t('certificates.issue.step1') : `${t('certificates.issue.step2')} ${selectedTemplate?.name}`}
                </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold transition-all ${step === 'select-template' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                  {step === 'select-template' ? '1' : <Award size={18} />}
              </div>
              <div className={`w-10 h-1 rounded-full ${step === 'edit-data' ? 'bg-emerald-500/30' : 'bg-muted'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold transition-all ${step === 'edit-data' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' : 'bg-muted text-muted-foreground'}`}>
                  2
              </div>
          </div>
        </div>
      </div>

      {step === 'select-template' ? (
        <div className="flex-1 space-y-6">
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t('certificates.issue.searchTemplates')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-card shadow-sm outline-none"
            />
          </div>

          {loading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 size={40} className="animate-spin text-primary opacity-50" />
                <span className="text-sm font-bold tracking-widest uppercase">{t('common.fetchingData')}</span>
             </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-border rounded-3xl bg-card/50 backdrop-blur-sm">
              <div className="bg-accent w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutIcon className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t('certificates.issue.noActiveTemplates')}</h3>
              <p className="mt-2 text-muted-foreground max-w-sm mx-auto">{t('certificates.issue.enableTemplates')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
              {filteredTemplates.map((tmpl) => (
                <div 
                  key={tmpl.id} 
                  onClick={() => handleTemplateSelect(tmpl)}
                  className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:border-primary hover:shadow-2xl hover:shadow-primary/5 transition-all group cursor-pointer flex flex-col"
                >
                  <div className="h-52 bg-accent/30 flex items-center justify-center border-b border-border relative overflow-hidden">
                    {tmpl.background_url ? (
                      <img 
                        src={getFullUrl(tmpl.background_url)} 
                        alt={tmpl.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <LayoutIcon className="h-14 w-14 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{t('common.templates')}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300 flex items-center justify-center">
                        <div className="bg-card text-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 border border-border/50">
                           <ChevronRight size={28} />
                        </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{tmpl.category || t('common.general')}</p>
                    <h3 className="text-lg font-bold text-foreground line-clamp-2 leading-tight">{tmpl.name}</h3>
                    <div className="flex items-center gap-2 mt-auto pt-4">
                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-accent text-accent-foreground font-bold uppercase border border-border/50">{tmpl.page_size}</span>
                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-accent text-accent-foreground font-bold uppercase border border-border/50">{t(`common.${tmpl.orientation.toLowerCase()}` as any)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden pb-12">
          <div className="flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl relative">
            {selectedTemplate && (
              <VisualBuilder 
                  initialLayout={selectedTemplate.layout_json}
                  initialMetadata={{
                      name: selectedTemplate.name,
                      category: selectedTemplate.category,
                      page_size: selectedTemplate.page_size,
                      orientation: selectedTemplate.orientation
                  }}
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
          <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
              <div className="bg-card p-10 rounded-3xl shadow-2xl border border-border flex flex-col items-center gap-6 max-w-xs text-center">
                  <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse" />
                      <Loader2 size={48} className="animate-spin text-primary relative z-10" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xl font-bold text-foreground block">{t('certificates.issue.generating')}</span>
                    <p className="text-sm text-muted-foreground">{t('certificates.issue.moments')}</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
