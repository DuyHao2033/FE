"use client";

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { 
  Award, Plus, FileText, Download, CheckCircle, 
  XCircle, Search, Layers, RotateCcw, HelpCircle, ListFilter 
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from 'react-i18next';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

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
  const router = useRouter();
  
  // States cơ bản
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // States cho Help Menu
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  
  // States cho Thu hồi (Revoke)
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  // 1. Chức năng Driver.js: Trỏ vào Tìm kiếm, Nút PDF và Nút Thu hồi
  const startLocalTour = useCallback(() => {
    const isDark = document.documentElement.classList.contains('dark');

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      overlayColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.7)',
      nextBtnText: t('tour.next'),
      prevBtnText: t('tour.prev'),
      doneBtnText: t('tour.done'),
      steps: [
        { 
          element: '#tour-search', 
          popover: { title: t('tour.certificatesSearchTitle'), description: t('tour.certificatesSearchDesc'), side: "bottom" } 
        },
        { 
          element: '#tour-pdf-btn', 
          popover: { title: t('tour.certificatesPdfTitle'), description: t('tour.certificatesPdfDesc'), side: "left" } 
        },
        { 
          element: '#tour-revoke-btn', 
          popover: { title: t('tour.certificatesRevokeTitle'), description: t('tour.certificatesRevokeDesc'), side: "left" } 
        },
      ]
    });
    driverObj.drive();
  }, [t]);

  // 2. Chức năng: Điều hướng từ Menu hướng dẫn (4 chức năng)
  const handleRecipeClick = (taskId: 'single' | 'batch' | 'manage' | 'batch-list') => {
    setShowHelpMenu(false);
    switch (taskId) {
      case 'single':
        router.push('/certificates/issue?startTour=true');
        break;
      case 'batch':
        router.push('/certificates/batch-issue?startTour=true');
        break;
      case 'batch-list':
        router.push('/certificates/batches');
        break;
      case 'manage':
        startLocalTour();
        break;
    }
  };

  const fetchCerts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates');
      setCertificates(res.data);
    } catch (error) {
      console.error("Failed to fetch certificates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const filteredCerts = certificates.filter(c => 
      c.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.cert_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRevoke = async () => {
    if (!revokeTarget || !revokeReason.trim()) return;
    try {
      setIsRevoking(true);
      await api.post(`/certificates/${revokeTarget.id}/revoke`, { reason: revokeReason.trim() });
      setRevokeTarget(null);
      setRevokeReason("");
      fetchCerts();
    } catch (error) {
      console.error("Failed to revoke certificate", error);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 relative">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('certificates.title')}</h1>
            
            <div className="relative">
              <button 
                onClick={() => setShowHelpMenu(!showHelpMenu)}
                className={`p-1.5 transition-all rounded-full border ${showHelpMenu ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-lg' : 'text-muted-foreground hover:text-primary border-border hover:border-primary/50'}`}
              >
                <HelpCircle size={20} />
              </button>

              {showHelpMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowHelpMenu(false)}></div>
                  <div className="absolute left-0 mt-3 w-80 bg-card border border-border shadow-2xl rounded-2xl z-20 p-2 animate-in zoom-in-95 duration-200">
                    <p className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 mb-1">Hướng dẫn nhanh</p>
                    
                    <button onClick={() => handleRecipeClick('single')} className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-xl transition-all text-left group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all"><Plus size={16} /></div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">Cấp bằng cho 1 người</p>
                        <p className="text-[10px] text-muted-foreground italic leading-tight">Quy trình chọn phôi và nhập liệu lẻ</p>
                      </div>
                    </button>

                    <button onClick={() => handleRecipeClick('batch')} className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-xl transition-all text-left group">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all"><FileText size={16} /></div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">Cấp bằng hàng loạt</p>
                        <p className="text-[10px] text-muted-foreground italic leading-tight">Cách dùng file Excel để cấp số lượng lớn</p>
                      </div>
                    </button>

                    {/* CHỨC NĂNG: Quản lý đợt cấp */}
                    <button onClick={() => handleRecipeClick('batch-list')} className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-xl transition-all text-left group">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all"><ListFilter size={16} /></div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">Quản lý đợt cấp</p>
                        <p className="text-[10px] text-muted-foreground italic leading-tight">Theo dõi trạng thái các tệp đã tải lên</p>
                      </div>
                    </button>

                    <button onClick={() => handleRecipeClick('manage')} className="w-full flex items-center gap-3 p-3 hover:bg-accent rounded-xl transition-all text-left group">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all"><Search size={16} /></div>
                      <div>
                        <p className="text-sm font-bold tracking-tight">Quản lý danh sách</p>
                        <p className="text-[10px] text-muted-foreground italic leading-tight">Cách tìm kiếm, tải PDF và thu hồi bằng</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="mt-2 text-muted-foreground">{t('certificates.subtitle')}</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link href="/certificates/batches" className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold text-foreground border border-border shadow-sm hover:bg-accent transition-all">
             <Layers size={18} className="text-primary" />
             {t('certificates.manageBatches')}
          </Link>
          <Link href="/certificates/batch-issue" className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-bold text-foreground border border-border shadow-sm hover:bg-accent transition-all">
             <FileText size={18} className="text-blue-500" />
             {t('certificates.batchIssue')}
          </Link>
          <Link href="/certificates/issue" className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <Plus size={18} />
            {t('certificates.issueSingle')}
          </Link>
        </div>
      </div>
      
      {/* Ô tìm kiếm - Có ID cho Tour */}
      <div id="tour-search" className="relative max-w-lg">
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
                  <th className="py-4 pl-6 pr-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificates.recipient')} & {t('certificates.certTitle')}</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificates.codeRegistry')}</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.status')}</th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificates.issuedOn')}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.actions')}</th>
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
                    filteredCerts.map((cert, index) => (
                       <tr key={cert.id} className="hover:bg-accent/10 transition-colors group">
                          <td className="whitespace-nowrap py-5 pl-6 pr-3">
                              <div className="font-bold text-foreground">{cert.recipient_name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{cert.title}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm font-mono text-foreground/80">
                              <div className="font-bold text-xs bg-accent/50 px-2 py-1 rounded inline-block border border-border/50">{cert.cert_code}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm">
                              {(cert.status === 'valid' || cert.status === 'active') ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                      <CheckCircle size={14} /> {t('certificates.status.valid')}
                                  </span>
                              ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
                                      <XCircle size={14} /> {t('certificates.status.revoked')}
                                  </span>
                              )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm text-muted-foreground">
                             {new Date(cert.issued_at).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap py-5 pl-3 pr-6 text-right text-sm font-medium flex justify-end gap-3">
                              {/* Gắn ID cho nút PDF và Thu hồi của hàng đầu tiên để Tour nhận diện */}
                              <a 
                                 id={index === 0 ? "tour-pdf-btn" : undefined}
                                 href={cert.pdf_url ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1','') || 'https://api.siu.edu.vn'}${cert.pdf_url}` : '#'}
                                 target="_blank" rel="noreferrer"
                                 className={`inline-flex items-center gap-2 text-foreground bg-accent/50 hover:bg-accent px-4 py-2 rounded-xl border border-border/50 font-bold transition-all ${!cert.pdf_url && 'opacity-30 pointer-events-none'}`}
                              >
                                  <Download size={16} className="text-primary" /> 
                                  <span className="text-xs">PDF</span>
                              </a>
                              {(cert.status === 'valid' || cert.status === 'active') && (
                                  <button
                                    id={index === 0 ? "tour-revoke-btn" : undefined}
                                    onClick={() => { setRevokeTarget(cert); setRevokeReason(""); }}
                                    className="inline-flex items-center gap-2 text-destructive bg-destructive/5 hover:bg-destructive/10 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-destructive/20 font-bold group"
                                  >
                                      <XCircle size={16} />
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
        onClose={() => { if (!isRevoking) setRevokeTarget(null); }}
        title={t('certificates.revokeTitle')}
      >
        <div className="space-y-6 p-1">
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-sm leading-relaxed font-medium">
             {t('certificates.revokeConfirm')} <br/>
             <span className="font-bold text-destructive">{revokeTarget?.cert_code}</span> ({revokeTarget?.recipient_name}).
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{t('common.reason')}</label>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl bg-accent/30 border border-border px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder={t('certificates.revokeReasonPlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button disabled={isRevoking} onClick={() => setRevokeTarget(null)} className="px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-bold text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50">
              {t('common.cancel')}
            </button>
            <button disabled={isRevoking} onClick={handleRevoke} className="px-5 py-2.5 rounded-xl bg-destructive text-white text-sm font-bold hover:opacity-90 shadow-lg flex items-center gap-2">
              {isRevoking && <RotateCcw size={16} className="animate-spin" />}
              {isRevoking ? t('common.loading') : t('common.confirm')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}