"use client";

import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Loader2, FileText, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';

interface CertificateDecision {
  id: string;
  decision_number: string;
  decision_date: string;
  created_at: string;
}

export default function CertificateDecisionsPage() {
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
    } catch (error) {
      console.error("Failed to save decision", error);
      alert("Failed to save decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this decision?")) return;
    try {
      await api.delete(`/certificate-decisions/${id}`);
      fetchDecisions();
    } catch (error) {
      console.error("Failed to delete decision", error);
      alert("Failed to delete decision. It might be linked to existing certificates.");
    }
  };

  const filteredDecisions = decisions.filter(d => 
    d.decision_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reward Decisions</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage official reward decisions used for issuing certificates.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="mt-4 sm:mt-0 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Create Decision
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search decision number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all bg-white"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin inline-block h-8 w-8 text-indigo-600" /></div>
      ) : filteredDecisions.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-sm font-semibold text-gray-900">No decisions found</h3>
          <p className="mt-1 text-sm text-gray-500">Add a reward decision to link with certificates.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Decision Number</th>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Decision Date</th>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Created At</th>
                <th className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDecisions.map((decision) => (
                <tr key={decision.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{decision.decision_number}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} className="text-gray-400" />
                       {new Date(decision.decision_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(decision.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(decision)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(decision.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
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
        title={selectedDecision ? "Edit Decision" : "Create Decision"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Decision Number</label>
            <input
              type="text"
              required
              value={formData.decision_number}
              onChange={(e) => setFormData({ ...formData, decision_number: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. 123/QD-SIU"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Decision Date</label>
            <input
              type="date"
              required
              value={formData.decision_date}
              onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
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
              {selectedDecision ? "Save Changes" : "Create Decision"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
