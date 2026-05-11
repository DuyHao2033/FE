"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Loader2, Layers, AlertCircle, X, Check, FileStack, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from 'react-i18next';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useCallback } from 'react';
import { HelpCircle } from 'lucide-react';

interface CertificateType {
  id: string;
  code: string;
  name: string;
  field_schema: any;
  created_at: string;
}

export default function CertificateTypesPage() {
  const { t } = useTranslation();

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
          element: '#tour-header',
          popover: {
            title: t('tour.certificateTypesHeaderTitle'),
            description: t('tour.certificateTypesHeaderDesc'),
            side: "bottom"
          }
        },
        {
          element: '#tour-search',
          popover: {
            title: t('tour.certificateTypesSearchTitle'),
            description: t('tour.certificateTypesSearchDesc'),
            side: "bottom"
          }
        },
        {
          element: '#tour-table',
          popover: {
            title: t('tour.certificateTypesTableTitle'),
            description: t('tour.certificateTypesTableDesc'),
            side: "top"
          }
        },
        {
          element: '#tour-create-btn',
          popover: {
            title: t('tour.certificateTypesCreateTitle'),
            description: t('tour.certificateTypesCreateDesc'),
            side: "left"
          }
        }
      ]
    });
    d.drive();
  }, [t]);

  const [types, setTypes] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CertificateType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
  });
  
  const [systemFields, setSystemFields] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<string[]>([]);
  const [newSystemField, setNewSystemField] = useState('');
  const [newCustomField, setNewCustomField] = useState('');

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificate-types');
      setTypes(Array.isArray(res.data) ? res.data : (res.data.items || []));
    } catch (error) {
      console.error("Failed to fetch certificate types", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenModal = (type: CertificateType | null = null) => {
    setSelectedType(type);
    if (type) {
      setFormData({
        code: type.code,
        name: type.name,
      });
      setSystemFields(type.field_schema?.system_fields || []);
      setCustomFields(type.field_schema?.custom_fields || []);
    } else {
      setFormData({
        code: '',
        name: '',
      });
      setSystemFields(['recipient_name', 'title']);
      setCustomFields([]);
      setNewSystemField('');
      setNewCustomField('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const payload = {
        code: formData.code,
        name: formData.name,
        field_schema: {
          system_fields: systemFields,
          custom_fields: customFields
        }
      };

      if (selectedType) {
        await api.patch(`/certificate-types/${selectedType.id}`, payload);
      } else {
        await api.post('/certificate-types', payload);
      }
      
      setIsModalOpen(false);
      fetchTypes();
    } catch (error: any) {
      console.error("Failed to save certificate type", error);
      alert(error.response?.data?.detail || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('certificateTypes.deleteConfirm'))) return;
    try {
      await api.delete(`/certificate-types/${id}`);
      fetchTypes();
    } catch (error: any) {
      console.error("Failed to delete certificate type", error);
      alert(error.response?.data?.detail || t('certificateTypes.deleteError'));
    }
  };

  const filteredTypes = types.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div id="tour-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <FileStack size={14} />
            {t('certificateTypes.title')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('certificateTypes.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('certificateTypes.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="tour-create-btn"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200"
          >
            <Plus size={18} />
            {t('certificateTypes.create')}
          </button>
          <button
            onClick={handleStartTour}
            className="p-1.5 text-primary bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-all border border-primary/20"
            title="Hướng dẫn sử dụng"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      <div id="tour-search" className="relative max-w-md group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder={t('certificateTypes.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
        />
      </div>

      <div id="tour-table" className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-accent/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificateTypes.nameAndCode')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificateTypes.fields')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.createdAt')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary opacity-50" />
                    <p className="mt-4 text-sm font-medium text-muted-foreground">{t('common.loading')}</p>
                  </td>
                </tr>
              ) : filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <FileStack className="mx-auto mb-4 h-14 w-14 text-muted-foreground/20" />
                    <h3 className="text-lg font-bold text-foreground">{t('common.noData')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('certificateTypes.getStarted')}</p>
                  </td>
                </tr>
              ) : (
                filteredTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-accent/10 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-foreground">{type.name}</div>
                      <div className="mt-1 text-xs font-mono text-primary/70">{type.code}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {type.field_schema?.system_fields?.map((f: string) => (
                          <span key={f} className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter">
                            {f}
                          </span>
                        ))}
                        {type.field_schema?.custom_fields?.map((f: string) => (
                          <span key={f} className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-tighter">
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={14} className="text-muted-foreground/40" />
                        {new Date(type.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(type)} 
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(type.id)} 
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedType ? t('certificateTypes.edit') : t('certificateTypes.create')}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.code')}</label>
            <input
              type="text"
              required
              disabled={!!selectedType}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none disabled:bg-accent/50 disabled:text-muted-foreground"
              placeholder="e.g. DEGREE"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.name')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder="e.g. University Degree"
            />
          </div>
          <div className="space-y-6 border-t border-border pt-6">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
               <Layers size={18} className="text-primary" />
               {t('certificateTypes.fieldConfig')}
            </h3>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                {t('certificateTypes.systemFields')}
              </label>
              <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-border bg-accent/30 hover:bg-accent/50 transition-all min-h-12 items-center">
                {systemFields.map((field) => (
                  <span key={field} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 uppercase tracking-tighter">
                    {field}
                    <button type="button" onClick={() => setSystemFields(systemFields.filter(f => f !== field))} className="hover:scale-110 transition-transform">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={newSystemField}
                  onChange={(e) => setNewSystemField(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSystemField.trim()) {
                      e.preventDefault();
                      if (!systemFields.includes(newSystemField.trim())) {
                        setSystemFields([...systemFields, newSystemField.trim()]);
                      }
                      setNewSystemField('');
                    }
                  }}
                  placeholder={t('certificateTypes.addPlaceholder')}
                  className="bg-transparent border-none focus:ring-0 text-xs py-1 flex-grow min-w-[120px]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {t('certificateTypes.customFields')}
              </label>
              <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-border bg-accent/30 hover:bg-accent/50 transition-all min-h-12 items-center">
                {customFields.map((field) => (
                  <span key={field} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-tighter">
                    {field}
                    <button type="button" onClick={() => setCustomFields(customFields.filter(f => f !== field))} className="hover:scale-110 transition-transform">
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={newCustomField}
                  onChange={(e) => setNewCustomField(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCustomField.trim()) {
                      e.preventDefault();
                      if (!customFields.includes(newCustomField.trim())) {
                        setCustomFields([...customFields, newCustomField.trim()]);
                      }
                      setNewCustomField('');
                    }
                  }}
                  placeholder={t('certificateTypes.addPlaceholder')}
                  className="bg-transparent border-none focus:ring-0 text-xs py-1 flex-grow min-w-[120px]"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-accent/50 border border-border flex items-start gap-3">
              <AlertCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                {t('certificateTypes.fieldConfigDesc')}
              </p>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {selectedType ? t('common.saveChanges') : t('common.create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
