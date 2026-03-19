"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Type, Upload, Trash2, Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/lib/store';
import { useTranslation } from 'react-i18next';

interface Font {
  name: string;
  filename: string;
}

export default function FontsPage() {
  const { t } = useTranslation();
  const [fonts, setFonts] = useState<Font[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const fetchFonts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/fonts');
      setFonts(response.data.items);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching fonts:', err);
      setError(t('fonts.errorLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFonts();
  }, []);

  useEffect(() => {
    if (fonts.length > 0) {
      const styleId = 'fonts-page-styles';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
      const fontRules = fonts.map(f => `
        @font-face {
          font-family: '${f.name}';
          src: url('${baseUrl}/fonts-static/${f.filename}') format('truetype');
        }
      `).join('\n');
      styleEl.innerHTML = fontRules;
    }
  }, [fonts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.ttf')) {
        setError(t('fonts.errorTtf'));
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/fonts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(t('fonts.uploadSuccess', { name: selectedFile.name }));
      setShowUploadModal(false);
      setSelectedFile(null);
      fetchFonts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading font:', err);
      setError(err.response?.data?.detail || t('fonts.errorUpload'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(t('fonts.deleteConfirm', { name: filename }))) return;

    try {
      await api.delete(`/fonts/${filename}`);
      setSuccess(t('fonts.deleteSuccess'));
      fetchFonts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting font:', err);
      setError(t('fonts.errorDelete'));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <Type size={14} />
            {t('fonts.title')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('fonts.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('fonts.subtitle')}</p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all font-bold text-sm"
          >
            <Plus size={18} />
            <span>{t('fonts.upload')}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <p className="text-sm font-bold">{success}</p>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-primary h-10 w-10 mb-4" />
            <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : fonts.length === 0 ? (
          <div className="text-center py-24 px-4">
            <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border">
              <Type className="text-muted-foreground/40" size={32} />
            </div>
            <h3 className="text-xl font-bold text-foreground">{t('fonts.noFonts')}</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">
              {t('fonts.uploadHint')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-accent/30 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.name')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.code')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('builder.placeholders.newText')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fonts.map((font) => (
                  <tr key={font.filename} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                          <Type size={18} />
                        </div>
                        <span className="font-bold text-foreground">{font.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <code className="text-xs bg-accent text-muted-foreground px-2 py-1 rounded-lg font-mono border border-border/50">
                        {font.filename}
                      </code>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-2xl text-foreground" style={{ fontFamily: font.name }}>
                        {t('fonts.previewText')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isSuperAdmin && (
                        <button 
                          onClick={() => handleDelete(font.filename)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                          title={t('common.delete')}
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal 
        isOpen={showUploadModal} 
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setError(null);
        }}
        title={t('fonts.uploadNew')}
      >
        <div className="space-y-6 py-2">
          <div 
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${selectedFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/30'}`}
          >
            <input 
              type="file" 
              accept=".ttf"
              onChange={handleFileChange}
              className="hidden"
              id="font-upload"
            />
            <label htmlFor="font-upload" className="cursor-pointer flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${selectedFile ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground/40'}`}>
                {isUploading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-foreground">
                  {selectedFile ? selectedFile.name : t('fonts.clickToSelect')}
                </p>
                <p className="text-xs text-muted-foreground">{t('fonts.ttfOnlyHint')}</p>
              </div>
            </label>
          </div>

          <div className="bg-accent/50 border border-border rounded-2xl p-4 flex gap-3">
            <AlertCircle className="text-primary shrink-0" size={20} />
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              {t('fonts.vietnameseSupportNote')}
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all"
              disabled={isUploading}
            >
              {t('common.cancel')}
            </button>
            <button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg transition-all ${!selectedFile || isUploading ? 'bg-accent text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90'}`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>{t('fonts.uploading')}</span>
                </>
              ) : (
                <span>{t('fonts.upload')}</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
