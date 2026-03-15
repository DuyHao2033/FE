"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Layout, ChevronRight, Search, Award, Loader2, ArrowLeft } from 'lucide-react';
import { getFullUrl } from '@/utils/url';
import VisualBuilder, { BuilderElement, TemplateMetadata } from '@/components/builder/VisualBuilder';

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
  const router = useRouter();
  const [step, setStep] = useState<'select-template' | 'edit-data'>('select-template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    fetchTemplates();
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

      // Heuristic to find recipient_name and title
      const keys = Object.keys(variableData);
      
      // Try to find recipient_name
      let recipientName = "";
      const nameKey = keys.find(k => 
        ['recipient_name', 'name', 'fullname', 'full_name', 'họ tên', 'họ và tên'].includes(k.toLowerCase())
      );
      if (nameKey) {
        recipientName = variableData[nameKey];
      } else if (keys.length > 0) {
        recipientName = variableData[keys[0]]; // Fallback to first variable
      } else {
        recipientName = "Recipient"; // Last resort
      }

      // Try to find title
      let title = selectedTemplate.name; // Default to template name
      const titleKey = keys.find(k => 
        ['title', 'subject', 'course', 'tiêu đề', 'về việc'].includes(k.toLowerCase())
      );
      if (titleKey) {
        title = variableData[titleKey];
      }

      // Map other optional fields
      const emailKey = keys.find(k => k.toLowerCase().includes('email'));
      const idKey = keys.find(k => ['recipient_id', 'student_id', 'employee_id', 'id'].includes(k.toLowerCase()));

      // API call to issue single certificate
      await api.post('/certificates', {
        template_id: selectedTemplate.id,
        recipient_name: recipientName,
        recipient_email: emailKey ? variableData[emailKey] : undefined,
        recipient_id: idKey ? variableData[idKey] : undefined,
        title: title,
        custom_data: variableData // Include everything in custom_data as well for the PDF engine
      });

      router.push('/certificates');
    } catch (error) {
      console.error("Failed to issue certificate", error);
      alert("Failed to issue certificate. Please check if all fields are filled.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header & Stepper */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => step === 'edit-data' ? setStep('select-template') : router.back()}
              className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 text-gray-600 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    {step === 'select-template' ? 'Issue Single Certificate' : 'Certificate Details'}
                </h1>
                <p className="text-sm text-gray-500">
                    {step === 'select-template' ? 'Step 1: Select a template design' : `Step 2: Fill information for ${selectedTemplate?.name}`}
                </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${step === 'select-template' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-green-100 text-green-700'}`}>
                  {step === 'select-template' ? '1' : <Award size={16} />}
              </div>
              <div className={`w-8 h-0.5 rounded-full ${step === 'edit-data' ? 'bg-green-200' : 'bg-gray-100'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${step === 'edit-data' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'}`}>
                  2
              </div>
          </div>
        </div>
      </div>

      {step === 'select-template' ? (
        <div className="flex-1 space-y-6">
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-gray-200 focus:outline-[3px] focus:outline-indigo-50/50 focus:border-indigo-500 transition-all bg-white shadow-sm"
            />
          </div>

          {loading ? (
             <div className="py-24 flex flex-col items-center justify-center gap-4 text-gray-400">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
                <span className="text-sm font-medium">Fetching active templates...</span>
             </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white/50 backdrop-blur-sm">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layout className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No active templates found</h3>
              <p className="mt-1 text-sm text-gray-500">Enable or create templates to start issuing certificates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((tmpl) => (
                <div 
                  key={tmpl.id} 
                  onClick={() => handleTemplateSelect(tmpl)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group cursor-pointer flex flex-col"
                >
                  <div className="h-48 bg-gray-50 flex items-center justify-center border-b border-gray-50 relative overflow-hidden">
                    {tmpl.background_url ? (
                      <img 
                        src={getFullUrl(tmpl.background_url)} 
                        alt={tmpl.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Layout className="h-12 w-12 text-gray-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Template</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors duration-300 flex items-center justify-center">
                        <div className="bg-white text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                           <ChevronRight size={24} />
                        </div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none mb-1">{tmpl.category || 'General'}</p>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{tmpl.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bold uppercase">{tmpl.page_size}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-bold uppercase capitalize">{tmpl.orientation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Edit Data Step with VisualBuilder */
        <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
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
              />
          )}
        </div>
      )}

      {isSubmitting && (
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin text-indigo-600" />
                  <span className="font-bold text-gray-900">Generating Certificate...</span>
                  <p className="text-xs text-gray-500">This may take a few moments.</p>
              </div>
          </div>
      )}
    </div>
  );
}
