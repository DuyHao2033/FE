"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Award, Plus, FileText, Download, CheckCircle, XCircle, Search, Layers } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface Certificate {
    id: string;
    cert_code: string;
    recipient_name: string;
    title: string;
    status: string;
    issued_at: string;
    pdf_url: string | null;
    registry_number?: string;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const res = await api.get('/certificates');
        setCertificates(res.data);
      } catch (error) {
        console.error("Failed to fetch certificates", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, []);

  const filteredCerts = certificates.filter(c => 
     c.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.cert_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    if (!revokeReason.trim()) {
      alert("Please provide a revoke reason.");
      return;
    }

    try {
      setIsRevoking(true);
      await api.post(`/certificates/${revokeTarget.id}/revoke`, {
        reason: revokeReason.trim()
      });
      setRevokeTarget(null);
      setRevokeReason("");
      const res = await api.get('/certificates');
      setCertificates(res.data);
    } catch (error) {
      console.error("Failed to revoke certificate", error);
      alert("Failed to revoke certificate. Please check the console.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Certificates</h1>
          <p className="mt-2 text-sm text-gray-500">
            View, issue, and manage digital certificates.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex gap-3 flex-wrap">
          <Link
            href="/certificates/batches"
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
          >
             <Layers size={18} />
             Manage Batches
          </Link>
          <Link
            href="/certificates/batch-issue"
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
          >
             <FileText size={18} />
             Batch Issue (Excel)
          </Link>
          <Link
            href="/certificates/issue"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Issue Single
          </Link>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-8">
         <div className="relative flex-1 max-w-lg">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input 
                 type="text" 
                 placeholder="Search by name or code..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
             />
         </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-200 rounded-xl overflow-hidden">
         <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
               <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Recipient & Title</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Code / Registry</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Issued On</th>
                  <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-500">Loading certificates...</td></tr>
                ) : filteredCerts.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-500 flex flex-col items-center justify-center">
                        <Award className="w-12 h-12 text-gray-300 mb-3" />
                        No certificates found.
                    </td></tr>
                ) : (
                    filteredCerts.map((cert) => (
                       <tr key={cert.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                              <div className="font-medium text-gray-900">{cert.recipient_name}</div>
                              <div className="text-sm text-gray-500">{cert.title}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-600">
                              <div className="font-bold">{cert.cert_code}</div>
                              {cert.registry_number && <div className="text-[10px] text-indigo-500 uppercase tracking-tighter">Reg: {cert.registry_number}</div>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                              {cert.status === 'valid' || cert.status === 'active' ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                      <CheckCircle size={14} className="text-green-500" /> Valid
                                  </span>
                              ) : cert.status === 'replaced' ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20">
                                      <XCircle size={14} className="text-orange-500" /> Replaced
                                  </span>
                              ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                                      <XCircle size={14} className="text-red-500" /> Revoked
                                  </span>
                              )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                             {new Date(cert.issued_at).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 flex justify-end gap-2">
                             <a 
                                href={cert.pdf_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1','') || 'http://localhost:8000'}${cert.pdf_url}` : '#'}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors ${!cert.pdf_url && 'opacity-50 pointer-events-none'}`}
                             >
                                 <Download size={16} /> PDF
                             </a>
                             {(cert.status === 'valid' || cert.status === 'active') && (
                                 <button
                                   onClick={() => {
                                     setRevokeTarget(cert);
                                     setRevokeReason("");
                                   }}
                                   className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                                 >
                                     Revoke
                                 </button>
                             )}
                          </td>
                       </tr>
                    ))
                )}
            </tbody>
         </table>
      </div>

      <Modal
        isOpen={!!revokeTarget}
        onClose={() => {
          if (isRevoking) return;
          setRevokeTarget(null);
          setRevokeReason("");
        }}
        title="Revoke certificate"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Revoke <span className="font-semibold text-gray-900">{revokeTarget?.cert_code}</span> for{' '}
            <span className="font-semibold text-gray-900">{revokeTarget?.recipient_name}</span>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Enter revoke reason..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isRevoking}
              onClick={() => {
                if (isRevoking) return;
                setRevokeTarget(null);
                setRevokeReason("");
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isRevoking}
              onClick={handleRevoke}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isRevoking ? "Revoking..." : "Revoke"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
