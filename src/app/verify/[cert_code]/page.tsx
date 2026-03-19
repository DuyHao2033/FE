"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  BadgeCheck,
  CalendarDays,
  CircleAlert,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

type VerifyResponse = {
  is_valid?: boolean;
  cert_code: string;
  status?: string;
  recipient_name?: string;
  title?: string;
  organization_name?: string;
  issued_at?: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  revoked_reason?: string | null;
  replaced_by?: string | null;
  cert_id?: string;
  pdf_url?: string | null;
  custom_data?: Record<string, unknown>;
  decision?: {
    id: string;
    decision_number: string;
    decision_date: string;
    title?: string | null;
  } | null;
  certificate_type?: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    field_schema?: Record<string, unknown>;
  } | null;
};

type CertificateTypeDetail = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  field_schema?: {
    custom_fields?: Array<string | { key?: string; name?: string; label?: string; type?: string }>;
    [key: string]: unknown;
  };
};

type PdfPreviewState = {
  status: "loading" | "ready" | "error";
  url: string | null;
  message: string | null;
  pages: number;
};

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatExpiryDate(value?: string | null) {
  if (!value) return "No expiration";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No expiration";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getApiOrigin() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.250:8065/api/v1";
  return apiBase.replace(/\/api\/v1\/?$/, "");
}

function normalizePublicUrl(url: string) {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      const apiOrigin = getApiOrigin();
      const api = new URL(apiOrigin);
      parsed.protocol = api.protocol;
      parsed.hostname = api.hostname;
      parsed.port = api.port;
      return parsed.toString();
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function getPdfUrl(data?: VerifyResponse | null) {
  if (!data?.pdf_url) return null;
  if (data.pdf_url.startsWith("http")) return normalizePublicUrl(data.pdf_url);
  return `${getApiOrigin()}${data.pdf_url}`;
}

function getFallbackPdfUrl(data?: VerifyResponse | null) {
  if (!data?.cert_id) return null;
  return `${process.env.NEXT_PUBLIC_API_URL || "http://192.168.1.250:8065/api/v1"}/certificates/${data.cert_id}/pdf`;
}

function formatDisplayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function buildCertificateSummary(
  data: VerifyResponse,
  certType: CertificateTypeDetail | null,
) {
  const customData = data.custom_data || {};
  const fields = certType?.field_schema?.custom_fields || [];
  const normalizedFields = fields
    .map((field) => {
      if (typeof field === "string") return { key: field, label: field };
      return {
        key: field.key || field.name || field.label || "",
        label: field.label || field.name || field.key || "",
      };
    })
    .filter((field) => field.key);

  const valueByKey = (key: string) => formatDisplayValue(customData[key]);
  const hasValue = (key: string) => Boolean(valueByKey(key));

  const courseName = valueByKey("course_name") || valueByKey("course") || valueByKey("program_name");
  const gpa = valueByKey("gpa");
  const studentId = valueByKey("student_id");

  if ((certType?.code || "").toUpperCase() === "COURSE_COMPLETION") {
    const parts = [];
    if (courseName) parts.push(`Đã hoàn thành khóa học ${courseName}.`);
    if (studentId) parts.push(`Mã sinh viên: ${studentId}.`);
    if (gpa) parts.push(`GPA: ${gpa}.`);
    return parts.join(" ");
  }

  const generatedParts = normalizedFields
    .filter((field) => hasValue(field.key))
    .map((field) => `${field.label}: ${valueByKey(field.key)}.`);

  if (generatedParts.length) {
    return generatedParts.join(" ");
  }

  return "";
}

function getFriendlyPdfError(detail?: string | null) {
  if (!detail) {
    return "PDF preview is not available right now.";
  }

  if (detail.includes("not eligible for public PDF preview")) {
    return "This certificate is expired, revoked, or replaced, so the public PDF preview is not available.";
  }

  if (detail.includes("PDF not yet generated")) {
    return "The certificate exists, but the PDF has not been generated yet.";
  }

  if (detail.includes("PDF file not found on disk")) {
    return "The certificate PDF file is missing from storage.";
  }

  return detail;
}

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

function getStatusMeta(data: VerifyResponse | null) {
  const status = (data?.status || "").toLowerCase();
  const isExpired = Boolean(data?.expires_at && new Date(data.expires_at).getTime() < Date.now());
  const isRevoked = status === "revoked" || Boolean(data?.revoked_at);
  const isReplaced = status === "replaced";
  const isActive = Boolean(data?.is_valid) || status === "active" || status === "valid";

  if (isRevoked) {
    return {
      tone: "red",
      title: "Certificate revoked",
      description: "This certificate is no longer valid because it has been revoked.",
      icon: ShieldAlert,
      badge: "Revoked",
    };
  }

  if (isExpired) {
    return {
      tone: "amber",
      title: "Certificate expired",
      description: "This certificate was valid, but its validity period has ended.",
      icon: TriangleAlert,
      badge: "Expired",
    };
  }

  if (isReplaced) {
    return {
      tone: "orange",
      title: "Certificate replaced",
      description: "This certificate has been replaced by a newer record.",
      icon: CircleAlert,
      badge: "Replaced",
    };
  }

  if (isActive) {
    return {
      tone: "green",
      title: "Certificate verified",
      description: "The certificate details match the issuing record.",
      icon: ShieldCheck,
      badge: "Valid",
    };
  }

  return {
    tone: "slate",
    title: "Verification result",
    description: "We found a certificate record, but its status needs review.",
    icon: BadgeCheck,
    badge: "Unknown",
  };
}

function getPreviewOverlay(data: VerifyResponse | null) {
  const status = (data?.status || "").toLowerCase();
  const isExpired = Boolean(data?.expires_at && new Date(data.expires_at).getTime() < Date.now());
  const isRevoked = status === "revoked" || Boolean(data?.revoked_at);
  const isReplaced = status === "replaced";

  if (isRevoked) {
    return {
      blocked: true,
      message: "This certificate is expired, revoked, or replaced, so the public PDF preview is not available.",
    };
  }

  if (isExpired) {
    return {
      blocked: true,
      message: "This certificate is expired, revoked, or replaced, so the public PDF preview is not available.",
    };
  }

  if (isReplaced) {
    return {
      blocked: true,
      message: "This certificate is expired, revoked, or replaced, so the public PDF preview is not available.",
    };
  }

  return null;
}

export default function VerifyPage() {
  const params = useParams();
  const cert_code = params.cert_code as string;
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<PdfPreviewState>({
    status: "loading",
    url: null,
    message: null,
    pages: 0,
  });
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [certificateType, setCertificateType] = useState<CertificateTypeDetail | null>(null);

  useEffect(() => {
    const fn = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/verify/${cert_code}`);
        setData(res.data);
      } catch (err: unknown) {
        const message =
          typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null;
        setError(message || "Certificate not found or invalid.");
      } finally {
        setLoading(false);
      }
    };

    if (cert_code) fn();
  }, [cert_code]);

  useEffect(() => {
    const loadCertificateType = async () => {
      if (!data?.certificate_type?.id) {
        setCertificateType(null);
        return;
      }

      try {
        const res = await api.get(`/certificate-types/${data.certificate_type.id}`);
        setCertificateType(res.data);
      } catch (err) {
        console.error("Failed to load certificate type details", err);
        setCertificateType(data.certificate_type as CertificateTypeDetail);
      }
    };

    loadCertificateType();
  }, [data?.certificate_type?.id]);

  const statusMeta = useMemo(() => getStatusMeta(data), [data]);
  const previewOverlay = useMemo(() => getPreviewOverlay(data), [data]);
  const pdfUrl = useMemo(() => getPdfUrl(data) || getFallbackPdfUrl(data), [data]);
  const certificateSummary = useMemo(() => {
    if (!data) return "";
    return buildCertificateSummary(data, certificateType);
  }, [data, certificateType]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    const loadPdf = async () => {
      if (!pdfUrl) {
        setPdfPreview({
          status: "error",
          url: null,
          message: "PDF preview is not available for this certificate.",
          pages: 0,
        });
        return;
      }

      setPdfPreview({ status: "loading", url: null, message: null, pages: 0 });

      try {
        const res = await fetch(pdfUrl, {
          method: "GET",
          headers: {
            Accept: "application/pdf",
          },
        });

        if (!res.ok) {
          let detail = null;
          try {
            const payload = await res.json();
            detail = payload?.detail ?? null;
          } catch {
            detail = null;
          }

          throw new Error(getFriendlyPdfError(detail || `Unable to load PDF preview (${res.status}).`));
        }

        const blob = await res.blob();
        revokedUrl = URL.createObjectURL(blob);

        if (!cancelled) {
          setPdfPreview({ status: "ready", url: revokedUrl, message: null, pages: 0 });
        }
      } catch (err) {
        if (!cancelled) {
          setPdfPreview({
            status: "error",
            url: null,
            message: err instanceof Error ? err.message : "PDF preview is not available right now.",
            pages: 0,
          });
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [pdfUrl]);

  const copyVerificationLink = async () => {
    const link = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = link;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) throw new Error("Copy failed");
      }
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  };

  useEffect(() => {
    if (pdfPreview.status !== "ready" || !pdfPreview.url) return;

    let cancelled = false;
    const renders: Promise<void>[] = [];

    const renderPdf = async () => {
      const url = pdfPreview.url;
      if (!url) return;
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = (await loadingTask.promise) as PDFDocumentProxy;
      if (cancelled) return;

      setPdfPreview((prev) => ({ ...prev, pages: pdf.numPages }));

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        renders.push(
          (async () => {
            const page = await pdf.getPage(pageNumber);
            if (cancelled) return;

            const canvas = canvasRefs.current[pageNumber - 1];
            if (!canvas) return;

            const viewport = page.getViewport({ scale: 1.6 });
            const context = canvas.getContext("2d");
            if (!context) return;

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = "100%";
            canvas.style.height = "auto";

            await page.render({
              canvasContext: context,
              viewport,
            }).promise;
          })(),
        );
      }

      await Promise.all(renders);
    };

    renderPdf().catch((err) => {
      if (!cancelled) {
        setPdfPreview({
          status: "error",
          url: null,
          message: err instanceof Error ? err.message : "Unable to render PDF preview.",
          pages: 0,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdfPreview.status, pdfPreview.url]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm text-slate-600 shadow-sm backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
          Verifying certificate...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="border-b border-red-100 bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6" />
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-red-100">Verification failed</div>
              <div className="text-lg font-semibold">Unable to verify this certificate</div>
            </div>
          </div>
        </div>
        <div className="space-y-6 p-6 sm:p-10">
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            {error || "The certificate code you entered does not exist in our records."}
          </p>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Please check the certificate code again or contact the issuing organization.
          </div>
        </div>
      </div>
    );
  }

  const StatusIcon = statusMeta.icon;

  return (
    <div className="w-full max-h-[calc(100vh-2rem)] overflow-hidden">
      <div className="grid max-h-[calc(100vh-2rem)] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[0.95fr_1.05fr]">
        <div
          className={`border-b px-5 py-5 lg:col-span-2 ${
            statusMeta.tone === "green"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
              : statusMeta.tone === "amber"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                : statusMeta.tone === "red"
                  ? "bg-gradient-to-r from-rose-600 to-red-600 text-white"
                  : "bg-gradient-to-r from-slate-700 to-slate-900 text-white"
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                Public certificate verify
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/15 p-3">
                  <StatusIcon className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold sm:text-2xl">{statusMeta.title}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">{statusMeta.description}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.2em] text-white/70">Certificate code</div>
              <div className="mt-1 font-mono text-lg font-semibold">{data.cert_code}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 overflow-hidden p-5 sm:p-6 lg:col-span-2 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-4 overflow-hidden">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
              <div className="text-sm text-slate-500">
                {data.organization_name || "Issuing organization not provided"}
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="text-sm text-slate-500">Recipient</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                    {data.recipient_name || "N/A"}
                  </div>
                </div>
                {/* <div>
                  <div className="text-sm text-slate-500">Certificate title</div>
                  <div className="mt-1 text-lg font-medium text-slate-900">
                    {data.title || "N/A"}
                  </div>
                </div> */}
                {certificateSummary ? (
                  <div>
                    <div className="mt-1 text-lg font-medium text-slate-800">
                      {certificateSummary}
                    </div>
                  </div>
                ) : null}
                {data.decision ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="text-sm text-slate-500">Linked decision</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {data.decision.title || data.decision.decision_number}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {data.decision.decision_number} - {formatDate(data.decision.decision_date)}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Issued at" value={formatDate(data.issued_at)} icon={CalendarDays} />
              <InfoCard label="Expires at" value={formatExpiryDate(data.expires_at)} icon={TriangleAlert} />
            </div>

            {(data.revoked_reason || data.revoked_at || data.replaced_by) && (
              <div className="space-y-3 rounded-3xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <ShieldAlert className="h-5 w-5" />
                  <div className="font-semibold">Additional status details</div>
                </div>
                <div className="grid gap-3 text-sm text-red-900/90 sm:grid-cols-2">
                  <DetailLine label="Revoked at" value={formatDate(data.revoked_at)} />
                  <DetailLine label="Replaced by" value={data.replaced_by || "N/A"} />
                </div>
                {data.revoked_reason ? (
                  <div className="rounded-2xl bg-white/70 p-4 text-sm text-red-900">
                    <div className="mb-1 font-semibold">Reason</div>
                    {data.revoked_reason}
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copyVerificationLink}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                {copyState === "copied" ? "Link copied" : copyState === "error" ? "Copy failed" : "Copy verification link"}
              </button>
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Open PDF
                </a>
              ) : null}
            </div>
          </section>

          <section className="space-y-3 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Certificate preview
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Read-only preview for public verification.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-100 shadow-inner">
              {pdfPreview.status === "ready" && pdfPreview.url ? (
                <div className="relative h-[calc(100vh-22rem)] min-h-[420px] max-h-[700px] overflow-auto bg-white p-3 select-none">
                  {previewOverlay?.blocked ? (
                    <div className="flex h-full min-h-[380px] items-center justify-center p-8 text-center">
                      <div>
                        <FileText className="mx-auto h-12 w-12 text-slate-300" />
                        <div className="mt-4 text-lg font-semibold text-slate-800">PDF preview unavailable</div>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                          {previewOverlay.message}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.from({ length: Math.max(pdfPreview.pages, 1) }, (_, index) => (
                        <canvas
                          key={`pdf-page-${index + 1}`}
                          ref={(node) => {
                            canvasRefs.current[index] = node;
                          }}
                          draggable={false}
                          onContextMenu={(e) => {
                            if (previewOverlay) e.preventDefault();
                          }}
                          className="mx-auto block w-full max-w-full rounded-lg border border-slate-200 bg-white shadow-sm"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : pdfPreview.status === "loading" ? (
                <div className="flex h-[calc(100vh-22rem)] min-h-[420px] max-h-[700px] items-center justify-center bg-white">
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                    Loading PDF preview...
                  </div>
                </div>
              ) : (
                <div className="flex h-[calc(100vh-22rem)] min-h-[420px] max-h-[700px] items-center justify-center p-8 text-center">
                  <div>
                    <FileText className="mx-auto h-12 w-12 text-slate-300" />
                    <div className="mt-4 text-lg font-semibold text-slate-800">PDF preview unavailable</div>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      {pdfPreview.message || "The public PDF endpoint is not available for this certificate."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
  mono = false,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className={`mt-3 text-sm font-medium text-slate-900 ${mono ? "font-mono break-all" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-red-700/70">{label}</div>
      <div className="mt-1 font-medium text-red-950">{value}</div>
    </div>
  );
}
