"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  CircleAlert, 
  Clock3, 
  FileText, 
  Layers, 
  Loader2, 
  Search, 
  Sparkles, 
  HelpCircle, 
  X,
  Info // Đã thêm Info vào đây để hết lỗi
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

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

export default function CertificateBatchesPage() {
  const { t } = useTranslation();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateNameById, setTemplateNameById] = useState<Record<string, string>>({});
  const [decisionNumberById, setDecisionNumberById] = useState<Record<string, string>>({});
  const [showGuide, setShowGuide] = useState(false);

  const statusTone: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    processing: 'bg-primary/10 text-primary border-primary/20',
    completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    completed_with_errors: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    failed: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Tiếp theo',
      prevBtnText: 'Quay lại',
      doneBtnText: 'Hoàn tất',
      steps: [
        { 
          element: '#btn-create-batch', 
          popover: { 
            title: 'Bước 1: Tạo đợt cấp', 
            description: 'Nhấn vào đây khi bạn muốn bắt đầu tạo một đợt cấp chứng chỉ mới hàng loạt từ file dữ liệu.', 
            side: "left", 
            align: 'start' 
          } 
        },
      ]
    });
    driverObj.drive();
  };

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <Layers size={14} />
            {t('certificates.batches.title')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('certificates.batches.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('certificates.batches.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={startTour}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-primary transition-all duration-200 hover:shadow-md"
            title="Hướng dẫn từng bước"
          >
            <HelpCircle size={20} />
          </button>
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`p-2.5 rounded-xl border transition-all duration-200 ${showGuide ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
          >
            {showGuide ? <X size={20} /> : <Info size={20} />}
          </button>
          <Link
            id="btn-create-batch"
            href="/certificates/batch-issue"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200"
          >
            <Sparkles size={18} />
            {t('certificates.batches.create')}
          </Link>
        </div>
      </div>

      {showGuide && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-primary/[0.03] border border-primary/10 animate-in zoom-in-95 duration-300">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-primary uppercase tracking-wider">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">1</div>
              Chuẩn bị dữ liệu
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tải file Excel mẫu và điền thông tin người nhận. Đảm bảo các cột dữ liệu trùng khớp với các biến (tags) bạn đã đặt trên mẫu phôi.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-primary uppercase tracking-wider">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">2</div>
              Xử lý hàng loạt
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hệ thống sẽ render PDF tự động cho từng dòng dữ liệu. Bạn có thể rời khỏi trang, quá trình này vẫn sẽ tiếp tục chạy ngầm trên server.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-primary uppercase tracking-wider">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">3</div>
              Quản lý kết quả
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Trạng thái <b>Completed</b> xác nhận đợt cấp thành công. Bạn có thể xem chi tiết từng chứng chỉ hoặc thực hiện thu hồi nếu cần.
            </p>
          </div>
        </div>
      )}

      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <input
          type="text"
          placeholder={t('certificates.batches.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
        />
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary opacity-50" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">{t('common.loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
          <FileText className="mx-auto mb-4 h-14 w-14 text-muted-foreground/20" />
          <h3 className="text-lg font-bold text-foreground">{t('common.noData')}</h3>
          <p className="mt-2 text-sm text-muted-foreground"> {t('certificates.batches.searchPlaceholder')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-accent/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('certificates.batches.title')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.category')} / {t('certificates.decisions.title' as any)}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.status')} / {t('common.date')}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((batch) => {
                  const total = batch.total_records ?? 0;
                  const processed = batch.processed_records ?? batch.success_count ?? 0;
                  const status = (batch.status || 'pending').toLowerCase();
                  
                  return (
                    <tr key={batch.id} className="hover:bg-accent/10 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-foreground">{batch.name || t('common.untitled')}</div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock3 size={12} className="text-primary" />
                          <span>{t('certificates.batches.total')}: {total}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-medium text-foreground italic">
                          {batch.template_name || batch.template?.name || templateNameById[batch.template_id || ''] || t('certificates.batches.noTemplate')}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground opacity-70">
                          {batch.decision_number || batch.decision?.decision_number || decisionNumberById[batch.decision_id || ''] || t('certificates.batches.noDecision')}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center self-start gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold border ${statusTone[status] || 'bg-muted text-muted-foreground border-border'}`}>
                            {status === 'completed' || status === 'completed_with_errors' ? <CheckCircle2 size={12} /> : status === 'failed' ? <CircleAlert size={12} /> : <Clock3 size={12} />}
                            {t(`certificates.status.${status}` as any).toUpperCase() || status.toUpperCase()}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                            <Calendar size={12} />
                            {batch.created_at ? new Date(batch.created_at).toLocaleDateString() : '---'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/certificates/batches/${batch.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-foreground hover:bg-accent/80 border border-border/50 transition-all duration-200"
                        >
                          {t('common.view')}
                          <ArrowRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}