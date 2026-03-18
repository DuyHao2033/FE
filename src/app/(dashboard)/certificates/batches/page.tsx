"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ArrowRight, Calendar, CheckCircle2, CircleAlert, Clock3, FileText, Layers, Loader2, Search, Sparkles } from 'lucide-react';

interface BatchItem {
  id: string;
  name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  total_records?: number;
  processed_records?: number;
  success_count?: number;
  failed_count?: number;
  template?: { id?: string; name?: string };
  template_name?: string;
  decision?: { id?: string; decision_number?: string };
  decision_number?: string;
  description?: string;
  template_id?: string;
  decision_id?: string | null;
}

type ListResponse<T> = { items?: T[]; results?: T[] } | T[];

const normalizeList = <T,>(data: ListResponse<T>): T[] => {
  if (Array.isArray(data)) return data;
  return data?.items || data?.results || [];
};

const statusTone: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  processing: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  completed_with_errors: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  failed: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function CertificateBatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateNameById, setTemplateNameById] = useState<Record<string, string>>({});
  const [decisionNumberById, setDecisionNumberById] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const [batchRes, templateRes, decisionRes] = await Promise.all([
          api.get('/batches'),
          api.get('/templates'),
          api.get('/certificate-decisions'),
        ]);

        setBatches(normalizeList(batchRes.data));

        const templates = normalizeList<{ id?: string; name?: string }>(templateRes.data);
        const decisions = normalizeList<{ id?: string; decision_number?: string }>(decisionRes.data);
        const templateMap: Record<string, string> = {};
        const decisionMap: Record<string, string> = {};

        templates.forEach((template) => {
          if (template.id) templateMap[template.id] = template.name || template.id;
        });
        decisions.forEach((decision) => {
          if (decision.id) decisionMap[decision.id] = decision.decision_number || decision.id;
        });

        setTemplateNameById(templateMap);
        setDecisionNumberById(decisionMap);
      } catch (error) {
        console.error('Failed to fetch batches', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return batches.filter((batch) =>
      [batch.name, batch.status, batch.template_name, batch.decision_number, batch.description, batch.template_id, batch.decision_id]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [batches, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm uppercase tracking-wider">
            <Layers size={16} />
            Batch Management
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Certificate Batches</h1>
          <p className="mt-2 text-sm text-gray-500">Track background processing for batch-issued certificates.</p>
        </div>
        <Link
          href="/certificates/batch-issue"
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Sparkles size={18} />
          Create Batch
        </Link>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search batch name, status, template..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">No batches found</h3>
          <p className="mt-1 text-sm text-gray-500">Create a batch to start tracking background issuance.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Batch</th>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Template / Decision</th>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Progress</th>
                <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((batch) => {
                const total = batch.total_records ?? 0;
                const processed = batch.processed_records ?? batch.success_count ?? 0;
                const failed = batch.failed_count ?? 0;
                const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
                const status = (batch.status || 'pending').toLowerCase();
                return (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{batch.name || 'Untitled batch'}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        {batch.created_at ? new Date(batch.created_at).toLocaleString() : 'Unknown date'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{batch.template_name || batch.template?.name || templateNameById[batch.template_id || ''] || batch.template_id || 'No template'}</div>
                      <div className="mt-1 text-xs text-gray-400">
                        {batch.decision_number || batch.decision?.decision_number || decisionNumberById[batch.decision_id || ''] || 'No decision linked'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-2 w-36 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${status === 'failed' ? 'bg-red-500' : status === 'completed' || status === 'completed_with_errors' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-medium text-gray-700">{processed}/{total}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {failed > 0 ? `${failed} failed` : 'No failures reported'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusTone[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                        {status === 'completed' || status === 'completed_with_errors' ? <CheckCircle2 size={14} /> : status === 'failed' ? <CircleAlert size={14} /> : <Clock3 size={14} />}
                        {status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/certificates/batches/${batch.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        View
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
