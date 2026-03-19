"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore, User } from '@/lib/store';
import { Plus, MoreVertical, Edit2, Trash2, User as UserIcon, Loader2, ShieldCheck, Mail, Lock, Users, Shield } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';

interface Organization {
  id: string;
  name: string;
}

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
  role: z.enum(['super_admin', 'org_admin', 'issuer']),
  organization_id: z.string().uuid("Please select an organization").optional().nullable(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user: currentUser } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'issuer',
    }
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const res = await api.get('/organizations');
      setOrganizations(res.data);
    } catch (error) {
      console.error("Failed to fetch organizations", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (currentUser?.role === 'super_admin') {
      fetchOrganizations();
    }
  }, [currentUser]);

  const handleCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    reset({
      email: '',
      full_name: '',
      password: '',
      role: 'issuer',
      organization_id: currentUser?.role === 'super_admin' ? null : currentUser?.organization_id
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    reset({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      organization_id: user.organization_id,
      password: '', // Password not required for update
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const onSubmit = async (data: UserFormValues) => {
    try {
      setSubmitting(true);
      // Clean up data for update
      const payload: any = { ...data };
      if (modalMode === 'edit') {
        delete payload.email; // Usually email is primary and not editable in many systems, or handle separately
        if (!payload.password) delete payload.password;
      }

      if (modalMode === 'create') {
        if (!payload.password) {
            alert(t('users.passwordRequired'));
            return;
        }
        await api.post('/users', payload);
      } else if (selectedUser) {
        await api.patch(`/users/${selectedUser.id}`, payload);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to save user", error);
      alert(error.response?.data?.detail || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      setSubmitting(true);
      await api.delete(`/users/${selectedUser.id}`);
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const tones: Record<string, string> = {
      super_admin: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      org_admin: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      issuer: "bg-primary/10 text-primary border-primary/20",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold border uppercase tracking-wider ${tones[role] || tones.issuer}`}>
        <Shield size={10} />
        {t(`users.roles.${role}` as any)}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <Users size={14} />
            {t('users.title')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('users.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200"
        >
          <Plus size={18} />
          {t('users.create')}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-accent/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.name')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.email')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.role')}</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.status')}</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <UserIcon className="mx-auto mb-4 h-14 w-14 text-muted-foreground/20" />
                    <h3 className="text-lg font-bold text-foreground">{t('common.noData')}</h3>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-accent/10 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-foreground">{user.full_name}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground font-mono">ID: {user.id.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail size={14} className="text-primary/60" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-5">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-5">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {t('common.active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[10px] font-bold text-muted-foreground border border-border uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40"></span>
                          {t('common.inactive')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                          title={t('common.edit')}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.id === currentUser?.id}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all disabled:hidden"
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
        title={modalMode === 'create' ? t('users.create') : t('common.edit')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.name')}</label>
            <div className="relative">
              <input
                {...register('full_name')}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-card text-sm focus:ring-2 transition-all outline-none ${errors.full_name ? 'border-destructive focus:ring-destructive/20' : 'border-border focus:ring-primary/20 focus:border-primary'}`}
                placeholder="e.g. John Doe"
              />
              <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            </div>
            {errors.full_name && <p className="text-[10px] font-bold text-destructive uppercase tracking-tight">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.email')}</label>
            <div className="relative">
                <input
                  {...register('email')}
                  disabled={modalMode === 'edit'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none disabled:bg-accent/50 disabled:text-muted-foreground"
                  placeholder="john@example.com"
                />
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {modalMode === 'create' ? t('common.password') : t('users.newPassword')}
            </label>
            <div className="relative">
                <input
                  type="password"
                  {...register('password')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="••••••••"
                />
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.role')}</label>
            <select
              {...register('role')}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            >
              <option value="issuer">{t('users.roles.issuer')}</option>
              <option value="org_admin">{t('users.roles.org_admin')}</option>
              {currentUser?.role === 'super_admin' && <option value="super_admin">{t('users.roles.super_admin')}</option>}
            </select>
          </div>

          {modalMode === 'edit' && (
            <div className="flex items-center gap-3 bg-accent/30 p-4 rounded-xl border border-border">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active' as any)}
                className="h-5 w-5 rounded-lg border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <label htmlFor="is_active" className="text-sm font-bold text-foreground cursor-pointer select-none">
                {t('users.isActive')}
              </label>
            </div>
          )}

          {currentUser?.role === 'super_admin' && watch('role') !== 'super_admin' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.organization')}</label>
              <select
                {...register('organization_id')}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              >
                <option value="">{t('users.selectOrganization')}</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
          )}

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
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
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
            {t('users.deleteConfirm')} <span className="font-bold text-foreground">{selectedUser?.full_name}</span>? 
            {t('common.actionIrreversible')}
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
