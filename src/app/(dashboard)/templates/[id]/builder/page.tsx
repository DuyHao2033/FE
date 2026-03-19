"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import VisualBuilder from '@/components/builder/VisualBuilder';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TemplateBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const id = params.id as string;
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await api.get(`/templates/${id}`);
        setTemplate(res.data);
      } catch (error) {
        console.error("Failed to load template:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTemplate();
  }, [id]);

  const handleSave = async (layout: any, metadata: any, bgFile: File | null) => {
    try {
      setIsSaving(true);
      if (bgFile) {
        const formData = new FormData();
        formData.append('file', bgFile);
        await api.post(`/templates/${id}/background`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Process image assets
      const updatedElements = await Promise.all(layout.elements.map(async (el: any) => {
        if (el.type === 'image' && el.file) {
          const formData = new FormData();
          formData.append('file', el.file);
          const res = await api.post(`/templates/${id}/assets`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return {
            ...el,
            path: res.data.path,
            src: res.data.url,
            file: undefined
          };
        }
        return el;
      }));

      const finalLayout = { ...layout, elements: updatedElements };
      
      await api.patch(`/templates/${id}`, { 
        layout_json: finalLayout,
        name: metadata.name,
        category: metadata.category,
        page_size: metadata.page_size,
        orientation: metadata.orientation,
        certificate_type_id: metadata.certificate_type_id || null
      });
      alert(t('builder.saveSuccess'));
      router.push('/templates');
    } catch (error) {
      console.error("Failed to save template:", error);
      alert(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!template) return <div className="p-12 text-center text-red-500">{t('builder.notFound')}</div>;

  return (
    <div className="flex flex-col h-full relative">
      {isSaving && (
        <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
            <p className="font-medium text-gray-700">{t('builder.saving')}</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/templates')} className="text-gray-500 hover:text-gray-900 transition-colors p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('builder.editTemplate', { name: template.name })}</h1>
              <p className="text-sm text-gray-500">{t('builder.editSubtitle')}</p>
            </div>
        </div>
      </div>
      
      <div className="flex-1 -mx-8 flex flex-col overflow-hidden">
        <VisualBuilder 
            initialMetadata={{
              name: template.name || '',
              category: template.category || t('common.general'),
              page_size: template.page_size || 'A4',
              orientation: template.orientation || 'landscape',
              certificate_type_id: template.certificate_type_id || ''
            }}
            initialLayout={template.layout_json?.elements ? template.layout_json : { elements: [] }} 
            backgroundUrl={template.background_url}
            onSave={handleSave} 
            isNew={false}
        />
      </div>
    </div>
  );
}
