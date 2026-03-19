"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Building, Plus, MoreVertical, Edit2, Trash2, Globe, Loader2, Upload, X, ImageIcon, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';

interface Organization {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  logo_url: string | null;
  created_at: string;
}

const orgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  logo_url: z.string().optional().or(z.literal('')),
});

type OrgFormValues = z.infer<typeof orgSchema>;

export default function OrganizationsPage() {
  const { t } = useTranslation();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
  });

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organizations');
      setOrganizations(res.data);
    } catch (error) {
      console.error("Failed to fetch organizations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchOrgs();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedOrg(null);
    setLogoPreview(null);
    setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setModalMode('edit');
    setSelectedOrg(org);
    reset({
      name: org.name,
      slug: org.slug,
      website: org.website || '',
      logo_url: org.logo_url || '',
    });
    setLogoPreview(org.logo_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${org.logo_url}` : null);
    setLogoFile(null);
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleDeleteClick = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  const onSubmit = async (data: OrgFormValues) => {
    try {
      setSubmitting(true);
      let orgId = selectedOrg?.id;
      if (modalMode === 'create') {
        const res = await api.post('/organizations', data);
        orgId = res.data.id;
      } else if (orgId) {
        await api.patch(`/organizations/${orgId}`, data);
      }

      // Handle logo upload if a file was selected
      if (orgId && logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        await api.post(`/organizations/${orgId}/logo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsModalOpen(false);
      fetchOrgs();
    } catch (error: any) {
      console.error("Failed to save organization", error);
      alert(error.response?.data?.detail || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedOrg) return;
    try {
      setSubmitting(true);
      await api.delete(`/organizations/${selectedOrg.id}`);
      setIsDeleteModalOpen(false);
      fetchOrgs();
    } catch (error) {
      console.error("Failed to delete organization", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <X size={48} />
        </div>
        <h2 className="text-xl font-bold text-foreground">{t('organizations.noPermission')}</h2>
        <p className="text-muted-foreground">{t('organizations.noPermissionDesc')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <Building size={14} />
            {t('organizations.title')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('organizations.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('organizations.subtitle')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200"
        >
          <Plus size={18} />
          {t('organizations.create')}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-accent/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.name')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('organizations.slug')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('organizations.website')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.createdAt')}</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary opacity-50" />
                    <p className="mt-4 text-sm font-medium text-muted-foreground">{t('common.loading')}</p>
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Building className="mx-auto mb-4 h-14 w-14 text-muted-foreground/20" />
                    <h3 className="text-lg font-bold text-foreground">{t('common.noData')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('organizations.getStarted')}</p>
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-accent/10 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-accent text-primary border border-border group-hover:border-primary/20 transition-all overflow-hidden bg-card">
                          {org.logo_url ? (
                            <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${org.logo_url}`} alt={org.name} className="h-full w-full object-cover" />
                          ) : (
                            <Building size={24} />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{org.name}</div>
                          <div className="mt-1 text-[10px] text-muted-foreground font-mono">ID: {org.id.substring(0,8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-foreground border border-border group-hover:border-primary/20 transition-all">
                        {org.slug}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {org.website ? (
                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-sm">
                          <Globe size={14} />
                          {new URL(org.website).hostname}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={14} className="text-muted-foreground/40" />
                        {new Date(org.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(org)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                          title={t('common.edit')}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(org)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                          title={t('common.delete')}
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
        title={modalMode === 'create' ? t('organizations.create') : t('common.edit')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.name')}</label>
            <input
              {...register('name')}
              className={`w-full px-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 transition-all outline-none ${errors.name ? 'border-destructive focus:ring-destructive/20' : 'border-border focus:ring-primary/20 focus:border-primary'}`}
              placeholder="e.g. SIU University"
            />
            {errors.name && <p className="text-[10px] font-bold text-destructive uppercase tracking-tight">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('organizations.slug')}</label>
            <input
              {...register('slug')}
              disabled={modalMode === 'edit'}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none disabled:bg-accent/50 disabled:text-muted-foreground"
              placeholder="e.g. siu-university"
            />
            <p className="text-[10px] text-muted-foreground font-medium">{t('organizations.slugDesc')}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('organizations.website')}</label>
            <div className="relative">
              <input
                {...register('website')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="https://example.edu"
              />
              <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('organizations.logo')}</label>
            <div className="flex items-center gap-6 p-4 rounded-2xl bg-accent/30 border border-border hover:bg-accent/50 transition-all group/logo">
              <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-card flex-shrink-0 group-hover/logo:border-primary/30 transition-all">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-1" />
                ) : (
                  <ImageIcon className="text-muted-foreground/30" size={40} />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="relative inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="px-5 py-2.5 bg-card border border-border rounded-xl text-xs font-bold uppercase tracking-widest text-foreground hover:border-primary/50 flex items-center gap-2 transition-all">
                    <Upload size={16} className="text-primary" />
                    {logoFile ? t('organizations.changeLogo') : t('organizations.uploadLogo')}
                  </div>
                </div>
                {logoFile && (
                  <button 
                    type="button"
                    onClick={() => { 
                      setLogoFile(null); 
                      setLogoPreview(selectedOrg?.logo_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${selectedOrg.logo_url}` : null); 
                    }}
                    className="block text-xs font-bold text-destructive hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 uppercase tracking-tighter"
                  >
                    <X size={14} /> {t('organizations.removeFile')}
                  </button>
                )}
                <p className="text-[10px] text-muted-foreground font-medium">{t('organizations.supportedFiles')}</p>
              </div>
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
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-primary text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (modalMode === 'create' ? <Plus size={16} /> : <Edit2 size={14} />)}
              {modalMode === 'create' ? t('common.create') : t('common.saveChanges')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('common.delete')}
      >
        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t('organizations.deleteConfirm')} <span className="font-bold text-foreground">{selectedOrg?.name}</span>? 
            {t('organizations.deleteWarning')}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-xs font-bold uppercase tracking-widest hover:bg-accent transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmDelete}
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-destructive text-xs font-bold uppercase tracking-widest text-destructive-foreground shadow-lg shadow-destructive/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
              {t('common.delete')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
