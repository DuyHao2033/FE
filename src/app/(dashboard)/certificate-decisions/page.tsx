"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Loader2, FileText, Calendar, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from 'react-i18next';

interface CertificateDecision {
  id: string;
  decision_number: string;
  decision_date: string;
  created_at: string;
}

export default function CertificateDecisionsPage() {
  const { t } = useTranslation();
  const [decisions, setDecisions] = useState<CertificateDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<CertificateDecision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    decision_number: '',
    decision_date: ''
  });

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificate-decisions');
      setDecisions(Array.isArray(res.data) ? res.data : (res.data.items || []));
    } catch (error) {
      console.error("Failed to fetch certificate decisions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleOpenModal = (decision: CertificateDecision | null = null) => {
    setSelectedDecision(decision);
    if (decision) {
      setFormData({
        decision_number: decision.decision_number,
        decision_date: decision.decision_date.split('T')[0] // Format for date input
      });
    } else {
      setFormData({
        decision_number: '',
        decision_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        decision_number: formData.decision_number,
        decision_date: formData.decision_date
      };

      if (selectedDecision) {
        await api.patch(`/certificate-decisions/${selectedDecision.id}`, payload);
      } else {
        await api.post('/certificate-decisions', payload);
      }
      
      setIsModalOpen(false);
      fetchDecisions();
    } catch (error: any) {
      console.error("Failed to save decision", error);
      alert(error.response?.data?.detail || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('certificates.decisions.deleteConfirm'))) return;
    try {
      await api.delete(`/certificate-decisions/${id}`);
      fetchDecisions();
    } catch (error: any) {
      console.error("Failed to delete decision", error);
      alert(error.response?.data?.detail || t('certificates.decisions.deleteError'));
    }
  };

  const filteredDecisions = decisions.filter(d => 
    d.decision_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <FileText size={14} />
            {t('certificates.decisions.title')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('certificates.decisions.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('certificates.decisions.subtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200"
        >
          <Plus size={18} />
          {t('certificates.decisions.create')}
        </button>
      </div>

      <div className="relative max-w-md group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder={t('certificates.decisions.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-accent/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificates.decisions.decisionNumber')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificates.decisions.decisionDate')}</th>
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
              ) : filteredDecisions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <FileText className="mx-auto mb-4 h-14 w-14 text-muted-foreground/20" />
                    <h3 className="text-lg font-bold text-foreground">{t('common.noData')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('certificates.decisions.getStarted')}</p>
                  </td>
                </tr>
              ) : (
                filteredDecisions.map((decision) => (
                  <tr key={decision.id} className="hover:bg-accent/10 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-foreground">{decision.decision_number}</div>
                    </td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                         <Calendar size={14} className="text-primary/60" />
                         {new Date(decision.decision_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-muted-foreground">
                      {new Date(decision.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(decision)} 
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(decision.id)} 
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
        title={selectedDecision ? t('certificates.decisions.edit') : t('certificates.decisions.create')}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('certificates.decisions.decisionNumber')}</label>
            <input
              type="text"
              required
              value={formData.decision_number}
              onChange={(e) => setFormData({ ...formData, decision_number: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder="e.g. 123/QD-SIU"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('certificates.decisions.decisionDate')}</label>
            <input
              type="date"
              required
              value={formData.decision_date}
              onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
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
              {selectedDecision ? t('common.saveChanges') : t('common.create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
