"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Layout, ChevronRight, Search, Loader2, ArrowLeft, FileText, Download, Upload, AlertCircle, CheckCircle2, ListOrdered, ClipboardList } from 'lucide-react';
import { getFullUrl } from '@/utils/url';
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

export default function BatchIssuePage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<'select-template' | 'configure'>('select-template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [decisions, setDecisions] = useState<any[]>([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>('');
  const [startNumber, setStartNumber] = useState<string>('1');
  const [batchName, setBatchName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const dateStr = new Date().toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US');
    setBatchName(`${t('certificates.batches.title')} ${tmpl.name} - ${dateStr}`);
    setStep('configure');
  };

  const handleDownloadTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      const response = await api.get(`/batches/templates/${selectedTemplate.id}/excel-template`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_${selectedTemplate.name.replace(/\s+/g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download template", error);
      alert(t('common.error'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !file) {
        alert(t('common.error'));
        return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('template_id', selectedTemplate.id);
      formData.append('name', batchName);
      if (selectedDecisionId) formData.append('decision_id', selectedDecisionId);
      if (startNumber) formData.append('registry_start_number', startNumber);
      if (description) formData.append('description', description);

      await api.post('/batches', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      router.push('/certificates/batches');
    } catch (error) {
      console.error("Failed to issue batch", error);
      alert(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto w-full">
      {/* Header & Stepper */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => step === 'configure' ? setStep('select-template') : router.back()}
              className="p-3 hover:bg-gray-50 rounded-2xl transition-all border border-gray-100 text-gray-600 shadow-sm hover:shadow-md"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    {step === 'select-template' ? t('certificates.batches.batchIssue.title') : t('certificates.batches.batchIssue.config')}
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Batch</span>
                </h1>
                <p className="text-sm text-gray-500 font-medium mt-0.5">
                    {step === 'select-template' ? t('certificates.batches.batchIssue.step1') : t('certificates.batches.batchIssue.step2', { name: selectedTemplate?.name })}
                </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-2xl text-sm font-bold transition-all ${step === 'select-template' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 -rotate-3' : 'bg-green-100 text-green-700'}`}>
                  {step === 'select-template' ? '1' : <CheckCircle2 size={20} />}
              </div>
              <div className={`w-12 h-1 rounded-full ${step === 'configure' ? 'bg-green-200' : 'bg-gray-100'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-2xl text-sm font-bold transition-all ${step === 'configure' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 rotate-3' : 'bg-gray-100 text-gray-400'}`}>
                  2
              </div>
          </div>
        </div>
      </div>

      {step === 'select-template' ? (
        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative max-w-xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder={t('builder.placeholders.searchTemplates')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 text-base rounded-[2.5rem] border-2 border-gray-100 focus:outline-none focus:border-indigo-500 transition-all bg-white shadow-xl shadow-gray-200/20"
            />
          </div>

          {loading ? (
             <div className="py-32 flex flex-col items-center justify-center gap-6 text-gray-400">
                <div className="relative">
                    <Loader2 size={48} className="animate-spin text-indigo-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                    </div>
                </div>
                <span className="text-base font-bold text-gray-500 tracking-wide">{t('certificates.batches.batchIssue.loading')}</span>
             </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-32 text-center border-4 border-dashed border-gray-100 rounded-[3rem] bg-white/50 backdrop-blur-xl">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Layout className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{t('certificates.batches.batchIssue.noTemplates')}</h3>
              <p className="mt-2 text-gray-500 font-medium">{t('certificates.batches.batchIssue.noTemplatesSub')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
              {filteredTemplates.map((tmpl) => (
                <div 
                  key={tmpl.id} 
                  onClick={() => handleTemplateSelect(tmpl)}
                  className="bg-white rounded-[2rem] border-2 border-gray-50 shadow-sm overflow-hidden hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-300 group cursor-pointer flex flex-col"
                >
                  <div className="h-56 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    {tmpl.background_url ? (
                      <img 
                        src={getFullUrl(tmpl.background_url)} 
                        alt={tmpl.name} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 opacity-20">
                        <Layout className="h-16 w-16 text-gray-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{t('sidebar.templates')}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-4 right-4 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl shadow-lg">
                           <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{tmpl.page_size}</span>
                        </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col gap-2">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider leading-none mb-1">{tmpl.category || t('common.general')}</p>
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{tmpl.name}</h3>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs text-gray-600 font-bold uppercase tracking-tight">{t('common.active')}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-tight">{tmpl.orientation === 'landscape' ? t('common.landscape') : t('common.portrait')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Configuration Step */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-xl shadow-gray-200/30 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-6 rotate-3">
                    <ClipboardList className="text-indigo-600" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('certificates.batches.batchIssue.selectedTemplate')}</h3>
                <p className="text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-1.5 rounded-full mb-6 italic">"{selectedTemplate?.name}"</p>
                
                <div className="w-full grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('common.pageSize')}</p>
                        <p className="font-bold text-gray-700 uppercase">{selectedTemplate?.page_size}</p>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('common.orientation')}</p>
                        <p className="font-bold text-gray-700 capitalize">{selectedTemplate?.orientation === 'landscape' ? t('common.landscape') : t('common.portrait')}</p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-dashed border-gray-100 w-full">
                    <button 
                        onClick={handleDownloadTemplate}
                        className="group flex flex-col items-center gap-3 w-full p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 transition-all"
                    >
                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:-translate-y-1 transition-transform">
                            <Download size={24} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-emerald-700">{t('certificates.batches.batchIssue.downloadExcel')}</p>
                            <p className="text-xs text-emerald-600 font-medium mt-1">{t('certificates.batches.batchIssue.downloadExcelSub')}</p>
                        </div>
                    </button>
                </div>
            </div>

            <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-32 h-32 bg-indigo-800 rounded-full blur-3xl opacity-50" />
                <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4 opacity-80">
                    <AlertCircle size={16} />
                    {t('certificates.batches.batchIssue.importantNotes')}
                </h4>
                <div className="space-y-4 text-sm font-medium leading-relaxed">
                    <p>• {t('certificates.batches.batchIssue.defaultFields', { fields: 'recipient_name, title, recipient_id...' })}</p>
                    <p>• {t('certificates.batches.batchIssue.customFields', { prefix: 'custom_', example: 'custom_score' })}</p>
                    <p>• {t('certificates.batches.batchIssue.backgroundProcessing')}</p>
                </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col">
            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border-2 border-gray-50 shadow-xl shadow-gray-200/30 overflow-hidden flex-1 flex flex-col">
              <div className="p-8 md:p-10 space-y-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('certificates.batches.batchIssue.batchName')} <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={batchName}
                            onChange={(e) => setBatchName(e.target.value)}
                            placeholder={t('certificates.batches.batchIssue.batchNamePlaceholder')}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('certificates.batches.batchIssue.linkDecision')}</label>
                        <select
                            value={selectedDecisionId}
                            onChange={(e) => setSelectedDecisionId(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm appearance-none"
                        >
                            <option value="">{t('certificates.batches.batchIssue.noDecision')}</option>
                            {decisions.map(d => (
                                <option key={d.id} value={d.id}>{d.decision_number} ({new Date(d.decision_date).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                            <ListOrdered size={14} className="text-indigo-500" />
                            {t('certificates.batches.batchIssue.startNumber')}
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={startNumber}
                            onChange={(e) => setStartNumber(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                        <p className="text-xs text-gray-400 font-medium ml-1">{t('certificates.batches.batchIssue.startNumberHint')}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('certificates.batches.batchIssue.description')}</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('certificates.batches.batchIssue.descriptionPlaceholder')}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="pt-8">
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-3 block">{t('certificates.batches.batchIssue.dataFile')} <span className="text-red-500">*</span></label>
                     <div className={`relative border-3 border-dashed rounded-[2.5rem] transition-all duration-300 group flex flex-col items-center justify-center p-12 overflow-hidden ${file ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50/50'}`}>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        
                        {!file ? (
                            <>
                                <div className="w-20 h-20 bg-white rounded-3xl shadow-lg border border-gray-100 flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                                    <Upload size={36} className="text-indigo-600" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-bold text-gray-900 mb-1">{t('certificates.batches.batchIssue.uploadHint')}</p>
                                    <p className="text-sm font-medium text-gray-500">{t('certificates.batches.batchIssue.uploadSub')}</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-6 animate-in zoom-in duration-300">
                                <div className="w-24 h-24 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-2xl rotate-3">
                                    <FileText size={48} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-900 leading-tight mb-1">{file.name}</p>
                                    <div className="flex items-center gap-4">
                                        <p className="text-sm font-bold text-indigo-600">{(file.size / 1024).toFixed(1)} KB</p>
                                        <button 
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setFile(null); }}
                                            className="text-xs font-bold text-red-500 uppercase tracking-widest hover:text-red-700 transition-colors pointer-events-auto relative z-20"
                                        >
                                            {t('certificates.batches.batchIssue.removeFile')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                     </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50/30">
                <button
                    type="submit"
                    disabled={isSubmitting || !file}
                    className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] text-lg font-bold transition-all shadow-2xl ${isSubmitting || !file ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30'}`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            {t('certificates.batches.batchIssue.processing')}
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={24} />
                            {t('certificates.batches.batchIssue.startBatch')}
                        </>
                    )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSubmitting && (
          <div className="fixed inset-0 z-50 bg-indigo-950/20 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
              <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center">
                  <div className="relative">
                      <Loader2 size={64} className="animate-spin text-indigo-600" />
                      <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle2 size={24} className="text-indigo-400 opacity-50" />
                      </div>
                  </div>
                  <div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">{t('certificates.batches.batchIssue.initializing')}</h4>
                      <p className="text-gray-500 font-medium">{t('certificates.batches.batchIssue.initializingSub')}</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
