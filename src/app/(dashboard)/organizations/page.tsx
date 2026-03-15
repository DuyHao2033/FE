"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Building, Plus, MoreVertical, Edit2, Trash2, Globe, Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
    } catch (error) {
      console.error("Failed to save organization", error);
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
    return <div className="p-8 text-center text-gray-500">You do not have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Organizations</h1>
          <p className="mt-2 text-sm text-gray-500">
            A list of all educational organizations managing certificates in the system.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={handleCreate}
            type="button"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Add Organization
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-xl border border-gray-100 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-4 pl-4 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                    <th scope="col" className="relative py-4 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white pb-20">
                  {loading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        <p>Loading organizations...</p>
                      </div>
                    </td></tr>
                  ) : organizations.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Building size={48} className="text-gray-300" />
                        <p className="text-lg font-medium text-gray-900">No organizations found</p>
                        <p>Get started by adding your first organization.</p>
                      </div>
                    </td></tr>
                  ) : (
                    organizations.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="whitespace-nowrap py-5 pl-4 pr-3 sm:pl-6">
                            <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-100 transition-colors overflow-hidden">
                                   {org.logo_url ? (
                                     <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${org.logo_url}`} alt={org.name} className="h-full w-full object-cover" />
                                   ) : (
                                     <Building size={20} />
                                   )}
                                </div>
                                <div className="ml-4">
                                  <div className="font-semibold text-gray-900">{org.name}</div>
                                  <div className="text-gray-400 text-[10px] font-mono leading-none mt-1 uppercase tracking-tight">ID: {org.id.substring(0,8)}...</div>
                                </div>
                            </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-sm">
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                            {org.slug}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500">
                          {org.website ? (
                            <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-900">
                              <Globe size={14} />
                              {new URL(org.website).hostname}
                            </a>
                          ) : '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500">
                          {new Date(org.created_at).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(org)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(org)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
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
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalMode === 'create' ? 'Add Organization' : 'Edit Organization'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              {...register('name')}
              className={`w-full px-4 py-2 rounded-xl border ${errors.name ? 'border-red-500 ring-red-100' : 'border-gray-200 ring-indigo-100'} focus:outline-none focus:ring-4 transition-all`}
              placeholder="e.g. SIU University"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              {...register('slug')}
              disabled={modalMode === 'edit'}
              className={`w-full px-4 py-2 rounded-xl border ${errors.slug ? 'border-red-500 ring-red-100' : 'border-gray-200 ring-indigo-100'} focus:outline-none focus:ring-4 transition-all disabled:bg-gray-50 disabled:text-gray-400`}
              placeholder="e.g. siu-university"
            />
            {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
            <p className="mt-1 text-[11px] text-gray-400">Unique identifier used in URLs.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
            <input
              {...register('website')}
              className={`w-full px-4 py-2 rounded-xl border ${errors.website ? 'border-red-500 ring-red-100' : 'border-gray-200 ring-indigo-100'} focus:outline-none focus:ring-4 transition-all`}
              placeholder="https://example.edu"
            />
            {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization Logo</label>
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="text-gray-400" size={32} />
                )}
              </div>
              <div className="flex-1">
                <div className="relative">
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
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                    <Upload size={16} />
                    {logoFile ? 'Change Logo' : 'Upload Logo'}
                  </div>
                </div>
                {logoFile && (
                  <button 
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(selectedOrg?.logo_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${selectedOrg.logo_url}` : null); }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <X size={12} /> Remove selected file
                  </button>
                )}
                <p className="mt-2 text-[11px] text-gray-400">Supported: JPEG, PNG, WEBP (Max 5MB)</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {modalMode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Organization"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-gray-900">{selectedOrg?.name}</span>? 
            This action cannot be undone and will remove all associated data including templates and certificates.
          </p>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
