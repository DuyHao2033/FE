"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Award, Plus, FileText, Download, CheckCircle, XCircle, Search, Layers, RotateCcw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      alert(t('certificates.revokeReasonPlaceholder'));
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('certificates.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('certificates.subtitle')}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/certificates/batches"
            className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold text-foreground border border-border shadow-sm hover:bg-accent transition-all duration-200"
          >
             <Layers size={18} className="text-primary" />
             {t('certificates.manageBatches')}
          </Link>
          <Link
            href="/certificates/batch-issue"
            className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold text-foreground border border-border shadow-sm hover:bg-accent transition-all duration-200"
          >
             <FileText size={18} className="text-blue-500" />
             {t('certificates.batchIssue')}
          </Link>
          <Link
            href="/certificates/issue"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200"
          >
            <Plus size={18} />
            {t('certificates.issueSingle')}
          </Link>
        </div>
      </div>
      
      <div className="relative max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <input 
              type="text" 
              placeholder={t('common.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm shadow-sm"
          />
      </div>

      <div className="bg-card shadow-sm border border-border rounded-2xl overflow-hidden overflow-x-auto">
         <table className="min-w-full divide-y divide-border">
            <thead className="bg-accent/30">
               <tr>
                  <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificates.recipient')} & {t('certificates.certTitle')}</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificates.codeRegistry')}</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.status')}</th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificates.issuedOn')}</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.actions')}</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
                {loading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground animate-pulse">{t('common.loading')}</td></tr>
                ) : filteredCerts.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <Award className="w-16 h-16 mb-4" />
                          <p className="font-medium text-lg">{t('common.noData')}</p>
                        </div>
                    </td></tr>
                ) : (
                    filteredCerts.map((cert) => (
                       <tr key={cert.id} className="hover:bg-accent/10 transition-colors group">
                          <td className="whitespace-nowrap py-5 pl-6 pr-3">
                              <div className="font-bold text-foreground">{cert.recipient_name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{cert.title}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm font-mono text-foreground/80">
                              <div className="font-bold text-xs bg-accent/50 px-2 py-1 rounded inline-block border border-border/50">{cert.cert_code}</div>
                              {cert.registry_number && <div className="text-[10px] text-primary font-bold mt-1 uppercase tracking-tighter">Reg: {cert.registry_number}</div>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm">
                              {cert.status === 'valid' || cert.status === 'active' ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      <CheckCircle size={14} /> {t('certificates.status.valid')}
                                  </span>
                              ) : cert.status === 'replaced' ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      <RotateCcw size={14} /> {t('certificates.status.replaced')}
                                  </span>
                              ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-destructive/10 text-destructive dark:text-destructive/80 border border-destructive/20">
                                      <XCircle size={14} /> {t('certificates.status.revoked')}
                                  </span>
                              )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm text-muted-foreground">
                             {new Date(cert.issued_at).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap py-5 pl-3 pr-6 text-right text-sm font-medium flex justify-end gap-3">
                             <a 
                                href={cert.pdf_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1','') || 'https://api.siu.edu.vn/certificate'}${cert.pdf_url}` : '#'}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-2 text-foreground bg-accent/50 hover:bg-accent px-4 py-2 rounded-xl transition-all duration-200 border border-border/50 font-bold group ${!cert.pdf_url && 'opacity-30 pointer-events-none'}`}
                             >
                                 <Download size={16} className="text-primary group-hover:scale-110 transition-transform" /> 
                                 <span className="text-xs">PDF</span>
                             </a>
                             {(cert.status === 'valid' || cert.status === 'active') && (
                                 <button
                                   onClick={() => {
                                     setRevokeTarget(cert);
                                     setRevokeReason("");
                                   }}
                                   className="inline-flex items-center gap-2 text-destructive bg-destructive/5 hover:bg-destructive/10 px-4 py-2 rounded-xl transition-all duration-200 border border-transparent hover:border-destructive/20 font-bold group"
                                 >
                                     <XCircle size={16} className="group-hover:rotate-12 transition-transform" />
                                     <span className="text-xs">{t('certificates.revoke')}</span>
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
        title={t('certificates.revokeTitle')}
      >
        <div className="space-y-6 p-1">
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
              {t('certificates.revokeConfirm')} <br/>
              <span className="font-bold text-destructive">{revokeTarget?.cert_code}</span> ({revokeTarget?.recipient_name}).
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('common.reason')}</label>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl bg-accent/30 border border-border px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              placeholder={t('certificates.revokeReasonPlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={isRevoking}
              onClick={() => {
                setRevokeTarget(null);
                setRevokeReason("");
              }}
              className="px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-bold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={isRevoking}
              onClick={handleRevoke}
              className="px-5 py-2.5 rounded-xl bg-destructive text-white text-sm font-bold hover:opacity-90 shadow-lg shadow-destructive/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isRevoking ? <RotateCcw size={16} className="animate-spin" /> : null}
              {isRevoking ? t('common.loading') : t('common.confirm')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
