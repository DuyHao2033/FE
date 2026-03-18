"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Calendar, CheckCircle2, CircleAlert, Clock3, Download, FileText, Loader2 } from 'lucide-react';

interface BatchCertificate {
  id: string;
  cert_code?: string;
  recipient_name?: string;
  title?: string;
  status?: string;
  issued_at?: string;
  pdf_url?: string | null;
  registry_number?: string;
}

interface BatchDetail {
  id: string;
  name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  description?: string;
  total_records?: number;
  processed_records?: number;
  success_count?: number;
  failed_count?: number;
  template?: { name?: string };
  template_name?: string;
  decision_number?: string;
  template_id?: string;
  decision_id?: string | null;
  certificates?: BatchCertificate[];
  items?: BatchCertificate[];
}

const normalizeCerts = (data: BatchDetail | null): BatchCertificate[] => data?.certificates || data?.items || [];

const statusTone: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  processing: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  completed_with_errors: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  failed: 'bg-red-50 text-red-700 ring-red-600/20',
};

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [decisionNumber, setDecisionNumber] = useState('');
  const [certificateItems, setCertificateItems] = useState<BatchCertificate[]>([]);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const res = await api.get(`/batches/${params.id}`);
        const detail: BatchDetail = res.data;
        setBatch(detail);

        if (detail.template_id) {
          try {
            const templateRes = await api.get('/templates');
            const templates = Array.isArray(templateRes.data) ? templateRes.data : templateRes.data.items || [];
            const matchedTemplate = templates.find((item: BatchDetail) => item.id === detail.template_id);
            setTemplateName(matchedTemplate?.name || '');
          } catch (error) {
            console.error('Failed to fetch templates for batch detail', error);
          }
        }

        if (detail.decision_id) {
          try {
            const decisionRes = await api.get('/certificate-decisions');
            const decisions = Array.isArray(decisionRes.data) ? decisionRes.data : decisionRes.data.items || [];
            const matchedDecision = decisions.find((item: BatchDetail) => item.id === detail.decision_id);
            setDecisionNumber(matchedDecision?.decision_number || '');
          } catch (error) {
            console.error('Failed to fetch decisions for batch detail', error);
          }
        }

        const initialCertificates = normalizeCerts(detail);
        if (initialCertificates.length > 0) {
          setCertificateItems(initialCertificates);
        } else {
          try {
            const certRes = await api.get(`/batches/${params.id}/certificates`);
            setCertificateItems(Array.isArray(certRes.data) ? certRes.data : certRes.data.items || certRes.data.results || []);
          } catch (error) {
            console.error('Failed to fetch certificates for batch detail', error);
            setCertificateItems([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch batch detail', error);
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) fetchBatch();
  }, [params?.id]);

  const certificates = useMemo(() => certificateItems.length > 0 ? certificateItems : normalizeCerts(batch), [batch, certificateItems]);
  const total = batch?.total_records ?? certificates.length ?? 0;
  const processed = batch?.processed_records ?? batch?.success_count ?? certificates.length ?? 0;
  const failed = batch?.failed_count ?? certificates.filter((c) => c.status === 'failed').length ?? 0;
  const percent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const status = (batch?.status || 'pending').toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/certificates/batches" className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm hover:bg-gray-50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Batch detail</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{batch?.name || 'Batch information'}</h1>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : !batch ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Batch not found</h3>
          <p className="mt-1 text-sm text-gray-500">We could not load this batch from the API.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm text-gray-500">Status</div>
              <div className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusTone[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                {status === 'completed' ? <CheckCircle2 size={14} /> : status === 'failed' ? <CircleAlert size={14} /> : <Clock3 size={14} />}
                {status}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{processed}/{total}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
              </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm text-gray-500">Success</div>
              <div className="mt-2 text-2xl font-bold text-green-700">{batch.success_count ?? certificates.filter((c) => c.status !== 'failed').length}</div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm text-gray-500">Failed</div>
              <div className="mt-2 text-2xl font-bold text-red-700">{failed}</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-900">Batch info</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-gray-500">Template</dt>
                  <dd className="mt-1 font-medium text-gray-900">{batch.template_name || batch.template?.name || templateName || batch.template_id || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Decision</dt>
                  <dd className="mt-1 font-medium text-gray-900">{batch.decision_number || decisionNumber || batch.decision_id || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Created at</dt>
                  <dd className="mt-1 flex items-center gap-2 font-medium text-gray-900">
                    <Calendar size={14} className="text-gray-400" />
                    {batch.created_at ? new Date(batch.created_at).toLocaleString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Description</dt>
                  <dd className="mt-1 text-gray-900">{batch.description || 'No description'}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Certificates created in this batch</h2>
                <span className="text-sm text-gray-500">{certificates.length} items</span>
              </div>

              {certificates.length === 0 ? (
                <div className="py-16 text-center">
                  <FileText className="mx-auto mb-4 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">No certificates were returned for this batch yet.</p>
                  <p className="mt-2 text-xs text-gray-400">
                    If the backend does not expose batch certificates yet, please add an endpoint like
                    <span className="font-mono"> GET /batches/{'{id}'}/certificates</span> or include them in <span className="font-mono">GET /batches/{'{id}'}</span>.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{cert.recipient_name || 'Unnamed recipient'}</div>
                        <div className="mt-1 text-sm text-gray-500">{cert.title || 'Untitled certificate'}</div>
                        <div className="mt-2 text-xs font-mono text-gray-500">{cert.cert_code || cert.registry_number || cert.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {cert.pdf_url ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${cert.pdf_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <Download size={16} />
                            PDF
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
