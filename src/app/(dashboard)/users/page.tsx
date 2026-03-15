"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore, User } from '@/lib/store';
import { Plus, MoreVertical, Edit2, Trash2, User as UserIcon, Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
            alert("Password is required for new users");
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
      alert(error.response?.data?.detail || "Failed to save user");
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
    const styles = {
      super_admin: "bg-red-50 text-red-700 ring-red-600/10",
      org_admin: "bg-amber-50 text-amber-700 ring-amber-600/10",
      issuer: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
    };
    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ring-1 ring-inset uppercase tracking-wider ${styles[role as keyof typeof styles] || styles.issuer}`}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage issuers and administrators within your organization.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            onClick={handleCreate}
            type="button"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Add User
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
                    <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative py-4 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        <p>Loading users...</p>
                      </div>
                    </td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <UserIcon size={48} className="text-gray-300" />
                        <p className="text-lg font-medium text-gray-900">No users found</p>
                      </div>
                    </td></tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="whitespace-nowrap py-5 pl-4 pr-3 sm:pl-6">
                            <div className="font-semibold text-gray-900">{user.full_name}</div>
                            <div className="text-gray-400 text-[10px] font-mono leading-none mt-1 uppercase tracking-tight">ID: {user.id.substring(0,8)}...</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            {user.email}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-sm">
                           {getRoleBadge(user.role)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500">
                            {user.is_active ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 border border-green-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 border border-gray-100">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span> Inactive
                              </span>
                            )}
                        </td>
                        <td className="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(user)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(user)}
                              disabled={user.id === currentUser?.id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-0"
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
        title={modalMode === 'create' ? 'Add User' : 'Edit User'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              {...register('full_name')}
              className={`w-full px-4 py-2 rounded-xl border ${errors.full_name ? 'border-red-500 ring-red-100' : 'border-gray-200 ring-indigo-100'} focus:outline-none focus:ring-4 transition-all`}
              placeholder="e.g. John Doe"
            />
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
                <input
                  {...register('email')}
                  disabled={modalMode === 'edit'}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl border ${errors.email ? 'border-red-500 ring-red-100' : 'border-gray-200 ring-indigo-100'} focus:outline-none focus:ring-4 transition-all disabled:bg-gray-50 disabled:text-gray-400`}
                  placeholder="john@example.com"
                />
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalMode === 'create' ? 'Password' : 'New Password (optional)'}
            </label>
            <div className="relative">
                <input
                  type="password"
                  {...register('password')}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl border ${errors.password ? 'border-red-500 ring-red-100' : 'border-gray-200 ring-indigo-100'} focus:outline-none focus:ring-4 transition-all`}
                  placeholder="••••••••"
                />
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              {...register('role')}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 ring-indigo-100 focus:outline-none focus:ring-4 transition-all bg-white"
            >
              <option value="issuer">Issuer</option>
              <option value="org_admin">Organization Admin</option>
              {currentUser?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
          </div>

          {modalMode === 'edit' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active' as any)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                User is active
              </label>
            </div>
          )}

          {currentUser?.role === 'super_admin' && watch('role') !== 'super_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <select
                {...register('organization_id')}
                className={`w-full px-4 py-2 rounded-xl border ${errors.organization_id ? 'border-red-500 ring-red-100' : 'border-gray-200 ring-indigo-100'} focus:outline-none focus:ring-4 transition-all bg-white`}
              >
                <option value="">Select an organization</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              {errors.organization_id && <p className="mt-1 text-xs text-red-500">{errors.organization_id.message}</p>}
            </div>
          )}

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
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to delete <span className="font-bold text-gray-900">{selectedUser?.full_name}</span>? 
            This action cannot be undone.
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
