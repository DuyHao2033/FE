"use client";

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import VisualBuilder, { TemplateMetadata, BuilderElement } from '@/components/builder/VisualBuilder';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function CreateTemplatePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async (layout: { elements: BuilderElement[] }, metadata: TemplateMetadata, bgFile: File | null) => {
    if (!metadata.name) {
      alert("Please provide a template name in Settings tab.");
      return;
    }

    try {
      setIsSaving(true);
      // 1. Create Template
      const createRes = await api.post('/templates', metadata);
      const newTemplateId = createRes.data.id;

      // 2. Upload background if provided
      if (bgFile) {
        const formData = new FormData();
        formData.append('file', bgFile);
        await api.post(`/templates/${newTemplateId}/background`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 3. Process image assets
      const updatedElements = await Promise.all(layout.elements.map(async (el: any) => {
        if (el.type === 'image' && el.file) {
          const formData = new FormData();
          formData.append('file', el.file);
          const res = await api.post(`/templates/${newTemplateId}/assets`, formData, {
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

      // 4. Update Layout
      await api.patch(`/templates/${newTemplateId}`, { layout_json: finalLayout });
      
      router.push('/templates');
    } catch (error) {
      console.error("Failed to create template:", error);
      alert("Failed to create template. Please check the console.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 -m-8 p-8 relative">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/templates')} 
              className="text-gray-500 hover:text-gray-900 transition-colors p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create New Template</h1>
              <p className="text-sm text-gray-500">Set up template details, upload background, and design layout.</p>
            </div>
        </div>
      </div>
      
      {isSaving && (
        <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
            <p className="font-medium text-gray-700">Creating your template...</p>
          </div>
        </div>
      )}

      <div className="flex-1 rounded-xl shadow-sm border border-gray-200 bg-white relative flex flex-col overflow-hidden">
        <VisualBuilder 
            isNew={true}
            onSave={handleCreate} 
        />
      </div>
    </div>
  );
}
