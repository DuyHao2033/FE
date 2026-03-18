"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Loader2, Layers, AlertCircle, X, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';

interface CertificateType {
  id: string;
  code: string;
  name: string;
  field_schema: any;
  created_at: string;
}

export default function CertificateTypesPage() {
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
    } catch (error) {
      console.error("Failed to save certificate type", error);
      alert("Failed to save certificate type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate type?")) return;
    try {
      await api.delete(`/certificate-types/${id}`);
      fetchTypes();
    } catch (error) {
      console.error("Failed to delete certificate type", error);
      alert("Failed to delete. Make sure no templates are using this type.");
    }
  };

  const filteredTypes = types.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Certificate Types</h1>
          <p className="mt-2 text-sm text-gray-500">
            Define the structure and available fields for different types of certificates.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="mt-4 sm:mt-0 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Create Type
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all bg-white"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin inline-block h-8 w-8 text-indigo-600" /></div>
      ) : filteredTypes.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
          <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-sm font-semibold text-gray-900">No certificate types found</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first certificate type to get started.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Name & Code</th>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Fields</th>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTypes.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{type.name}</div>
                    <div className="text-xs font-mono text-gray-500">{type.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {type.field_schema?.system_fields?.map((f: string) => (
                        <span key={f} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {f}
                        </span>
                      ))}
                      {type.field_schema?.custom_fields?.map((f: string) => (
                        <span key={f} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(type.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(type)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(type.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedType ? "Edit Certificate Type" : "Create Certificate Type"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Code</label>
            <input
              type="text"
              required
              disabled={!!selectedType}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
              placeholder="e.g. DEGREE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. University Degree"
            />
          </div>
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
               <Layers size={16} className="text-indigo-500" />
               Field Configuration
            </h3>

            {/* System Fields */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">System Fields</label>
              <div className="flex flex-wrap gap-2 min-h-10 p-2 rounded-lg border border-gray-200 bg-gray-50/50">
                {systemFields.map((field) => (
                  <span key={field} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200">
                    {field}
                    <button type="button" onClick={() => setSystemFields(systemFields.filter(f => f !== field))} className="hover:text-blue-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-2 flex-grow">
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
                    placeholder="Add system field..."
                    className="flex-grow bg-transparent border-none focus:ring-0 text-xs py-1"
                  />
                  {newSystemField && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (!systemFields.includes(newSystemField.trim())) {
                          setSystemFields([...systemFields, newSystemField.trim()]);
                        }
                        setNewSystemField('');
                      }}
                      className="p-1 hover:bg-blue-100 rounded text-blue-600"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">Common: recipient_name, title, issue_date, cert_number</p>
            </div>

            {/* Custom Fields */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Custom Fields</label>
              <div className="flex flex-wrap gap-2 min-h-10 p-2 rounded-lg border border-gray-200 bg-gray-50/50">
                {customFields.map((field) => (
                  <span key={field} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200">
                    {field}
                    <button type="button" onClick={() => setCustomFields(customFields.filter(f => f !== field))} className="hover:text-emerald-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-2 flex-grow">
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
                    placeholder="Add custom field..."
                    className="flex-grow bg-transparent border-none focus:ring-0 text-xs py-1"
                  />
                  {newCustomField && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (!customFields.includes(newCustomField.trim())) {
                          setCustomFields([...customFields, newCustomField.trim()]);
                        }
                        setNewCustomField('');
                      }}
                      className="p-1 hover:bg-emerald-100 rounded text-emerald-600"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic">Example: student_id, major, GPA, award_rank</p>
            </div>

            <p className="text-[10px] text-gray-500 flex items-start gap-1">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              Fields defined here will be available as dynamic placeholders in the template builder.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {selectedType ? "Save Changes" : "Create Type"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
