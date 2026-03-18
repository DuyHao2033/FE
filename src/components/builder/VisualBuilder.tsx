"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import {
  Type, QrCode, Trash2, Settings, Download, Plus, Save,
  AlignLeft, AlignCenter, AlignRight, FileText, Image as ImageIcon,
  Layers, Bold, Italic, Underline, Lock, Unlock, GripHorizontal,
  Award
} from 'lucide-react';
import { getFullUrl } from '@/utils/url';
import { api } from '@/lib/api';

export type ElementType = "text" | "qr" | "image";

export interface BuilderElement {
  id: string;
  type: ElementType;
  key: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  size?: number; // for QR
  font?: string;
  font_size?: number;
  color?: number[]; // [r, g, b]
  align?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  path?: string;
  src?: string;
  file?: File;
  is_variable?: boolean;
  content?: string;
  runtime_values?: Record<string, string>; // Store multiple placeholder values for a single element
}

export interface TemplateMetadata {
  name: string;
  category: string;
  page_size: string;
  orientation: string;
  certificate_type_id?: string;
}

interface VisualBuilderProps {
  initialLayout?: { elements: BuilderElement[] };
  initialMetadata?: TemplateMetadata;
  backgroundUrl?: string;
  onSave?: (layout: { elements: BuilderElement[] }, metadata: TemplateMetadata, bgFile: File | null) => void;
  isNew?: boolean;
  mode?: "builder" | "issue";
  extraIssueData?: {
    decisionId: string;
    setDecisionId: (id: string) => void;
    registryNumber: string;
    setRegistryNumber: (val: string) => void;
    decisions: any[];
  };
}

const FALLBACK_FONTS = [
  "Helvetica", "Helvetica-Bold", "Times-Roman", "Times-Bold", "Courier", "Courier-Bold"
];

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

const VARIABLE_MAP: Record<string, { label: string, color: string, icon?: string }> = {
  "{{recipient_name}}": { label: "Họ tên người nhận", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "{{recipient_email}}": { label: "Email", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "{{recipient_id}}": { label: "Mã định danh (ID)", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "{{title}}": { label: "Tiêu đề chứng chỉ", color: "bg-purple-100 text-purple-700 border-purple-200" },
  "{{issued_at}}": { label: "Ngày cấp", color: "bg-purple-100 text-purple-700 border-purple-200" },
  "{{expires_at}}": { label: "Ngày hết hạn", color: "bg-purple-100 text-purple-700 border-purple-200" },
  "{{decision.number}}": { label: "Số quyết định", color: "bg-amber-100 text-amber-700 border-amber-200" },
  "{{decision.date}}": { label: "Ngày quyết định", color: "bg-amber-100 text-amber-700 border-amber-200" },
  "{{certificate.serial}}": { label: "Mã số chứng chỉ", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "{{certificate.registry_number}}": { label: "Số vào sổ", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

export default function VisualBuilder({ initialLayout, initialMetadata, backgroundUrl, onSave, isNew, mode = "builder", extraIssueData }: VisualBuilderProps) {
  const [elements, setElements] = useState<BuilderElement[]>(initialLayout?.elements || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "elements">(isNew ? "settings" : "elements");

  const [metadata, setMetadata] = useState<TemplateMetadata>(initialMetadata || {
    name: "",
    category: "General",
    page_size: "A4",
    orientation: "landscape"
  });

  const [bgFile, setBgFile] = useState<File | null>(null);
  const [previewBg, setPreviewBg] = useState<string | undefined>(getFullUrl(backgroundUrl));
  const [availableFonts, setAvailableFonts] = useState<string[]>(FALLBACK_FONTS);
  const [availableCertTypes, setAvailableCertTypes] = useState<any[]>([]);

  useEffect(() => {
    const fetchCertTypes = async () => {
      try {
        const response = await api.get('/certificate-types');
        setAvailableCertTypes(Array.isArray(response.data) ? response.data : (response.data.items || []));
      } catch (err) {
        console.error('Failed to fetch certificate types', err);
      }
    };
    fetchCertTypes();
  }, []);

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const response = await api.get('/fonts');
        if (response.data.items && response.data.items.length > 0) {
          setAvailableFonts(response.data.items.map((f: { name: string }) => f.name));
        }
      } catch (err) {
        console.error('Failed to fetch fonts, using fallbacks', err);
      }
    };
    fetchFonts();
  }, []);

  useEffect(() => {
    if (availableFonts.length > 0) {
      const styleId = 'builder-fonts';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
      const fontRules = availableFonts.map(f => `
        @font-face {
          font-family: '${f}';
          src: url('${baseUrl}/fonts-static/${f}.ttf') format('truetype');
        }
      `).join('\n');
      styleEl.innerHTML = fontRules;
    }
  }, [availableFonts]);

  // A4 dimensions in mm
  const mmWidth = 210;
  const mmHeight = 297;

  // A4 size in pixels at 96 DPI
  const canvasScaling = 3.7795; // 1mm = 3.7795px

  const isPortrait = (metadata.orientation || 'landscape').toLowerCase() === 'portrait';
  const canvasWidth = (isPortrait ? mmWidth : mmHeight) * canvasScaling;
  const canvasHeight = (isPortrait ? mmHeight : mmWidth) * canvasScaling;

  // Dynamic scaling
  const [currentScale, setCurrentScale] = useState(isPortrait ? 0.75 : 0.6);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const padding = 64; // p-8 * 2
        const availableWidth = width - padding;
        const availableHeight = height - padding;

        const scaleX = availableWidth / canvasWidth;
        const scaleY = availableHeight / canvasHeight;

        // Use the smaller scale but cap it at a reasonable max or min if desired
        const newScale = Math.min(scaleX, scaleY, 1) * 0.95;
        setCurrentScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasWidth, canvasHeight, metadata.orientation]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const renderBeautifiedContent = (el: BuilderElement) => {
    const content = el.content || "";
    if (!content) return null;

    const parts = content.split(/(\{\{[^{}]+\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.replace(/[{}]/g, '');
        const mapped = VARIABLE_MAP[part] || { label: key, color: "bg-gray-100 text-gray-700 border-gray-200" };

        // In issue mode, if we have a real-time value, show it in a special style
        const displayValue = (mode === 'issue' && el.runtime_values?.[key]) ? el.runtime_values[key] : mapped.label;
        const isFilled = mode === 'issue' && !!el.runtime_values?.[key];

        return (
          <span
            key={i}
            className={`inline-block px-1.5 py-0.5 mx-0.5 rounded text-[0.85em] font-bold border border-current align-baseline whitespace-nowrap ${isFilled ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'opacity-90'}`}
            style={{
              backgroundColor: isFilled ? undefined : 'rgba(255,255,255,0.8)',
              fontSize: '0.75em',
              verticalAlign: 'middle',
              lineHeight: 1
            }}
          >
            {displayValue}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBgFile(file);
      setPreviewBg(URL.createObjectURL(file));
    }
  };

  const handleAddText = () => {
    const newEl: BuilderElement = {
      id: Date.now().toString(),
      type: "text",
      key: "new_text",
      x: 100,
      y: 100,
      width: 200,
      height: 40,
      font: availableFonts[0] || "Helvetica",
      font_size: 24,
      color: [0, 0, 0],
      align: "left",
      content: "Nhấn đúp để chỉnh sửa văn bản"
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleAddQR = () => {
    const newEl: BuilderElement = {
      id: Date.now().toString(),
      type: "qr",
      key: "qr_code",
      x: 100,
      y: 100,
      size: 80,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleAddImage = (file: File) => {
    const newId = Date.now().toString();
    const newEl: BuilderElement = {
      id: newId,
      type: "image",
      key: `image_${newId.substring(0, 4)}`,
      x: 100,
      y: 150,
      width: 100,
      height: 100,
      src: URL.createObjectURL(file),
      file: file
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleUpdateActive = (updates: Partial<BuilderElement>) => {
    if (!selectedId) return;
    setElements(elements.map(el => el.id === selectedId ? { ...el, ...updates } : el));
  };

  const activeElement = elements.find(e => e.id === selectedId);

  const handleDelete = () => {
    if (selectedId) {
      setElements(elements.filter(e => e.id !== selectedId));
      setSelectedId(null);
    }
  };

  return (
    <div className="relative flex flex-1 min-h-0 bg-gray-50 border border-gray-200 mt-1 rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col z-10 text-gray-900">

        {/* Tabs */}
        {mode === "builder" && (
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} /> Settings
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${activeTab === 'elements' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('elements')}
            >
              <Layers size={16} /> Elements
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {mode === "issue" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2 mb-4">
                  <FileText className="text-indigo-600" size={18} />
                  Thông tin cấp phát
                </h3>

                <div className="space-y-4">
                  {extraIssueData && (
                    <>
                      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Quyết định khen thưởng</label>
                        <select
                          value={extraIssueData.decisionId}
                          onChange={(e) => extraIssueData.setDecisionId(e.target.value)}
                          className="w-full text-sm border-gray-200 rounded-lg p-2 border bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                        >
                          <option value="">Không liên kết quyết định</option>
                          {extraIssueData.decisions.map(d => (
                            <option key={d.id} value={d.id}>{d.decision_number} ({new Date(d.decision_date).toLocaleDateString()})</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Số vào sổ</label>
                        <input
                          type="text"
                          value={extraIssueData.registryNumber}
                          onChange={(e) => extraIssueData.setRegistryNumber(e.target.value)}
                          placeholder="v.d. 001/2026"
                          className="w-full text-sm border-gray-200 rounded-lg p-2 border focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div className="h-px bg-gray-100 my-2" />
                    </>
                  )}

                  {(() => {
                    const coreKeys = ['recipient_name', 'recipient_id', 'recipient_email', 'title', 'issued_at'];

                    // Separate inputs into categories
                    const coreInputs: { key: string, label: string, existsInTemplate: boolean, elId?: string }[] = [];
                    const otherInputs: { key: string, label: string, elId?: string }[] = [];

                    // 1. Map Core Fields
                    coreKeys.forEach(k => {
                      // Check if this core key exists anywhere in templates
                      const foundEl = elements.find(el =>
                        (el.type === 'text' && el.is_variable && el.key === k) ||
                        (el.type === 'text' && el.content?.includes(`{{${k}}}`))
                      );

                      coreInputs.push({
                        key: k,
                        label: VARIABLE_MAP[`{{${k}}}`]?.label || k,
                        existsInTemplate: !!foundEl,
                        elId: foundEl?.id
                      });
                    });

                    // 2. Identify all other placeholders in template
                    elements.forEach(el => {
                      if (el.type !== 'text') return;

                      if (el.is_variable) {
                        if (!coreKeys.includes(el.key)) {
                          if (!otherInputs.find(i => i.key === el.key)) {
                            otherInputs.push({ key: el.key, label: VARIABLE_MAP[`{{${el.key}}}`]?.label || el.key, elId: el.id });
                          }
                        }
                      } else if (el.content?.includes('{{')) {
                        const matches = el.content.match(/\{\{([^{}]+)\}\}/g);
                        matches?.forEach(m => {
                          const key = m.replace(/[{}]/g, '').trim();
                          if (coreKeys.includes(key)) return;
                          if (key.startsWith('decision.') || key === 'certificate.registry_number' || key === 'certificate.serial') return;

                          if (!otherInputs.find(i => i.key === key)) {
                            otherInputs.push({ key, label: VARIABLE_MAP[`{{${key}}}`]?.label || key });
                          }
                        });
                      }
                    });

                    const renderInput = (input: any, isCore: boolean = false) => {
                      const value = elements.find(e =>
                        (e.id === input.elId && e.is_variable) ||
                        (e.type === 'text' && e.content?.includes(`{{${input.key}}}`))
                      )?.runtime_values?.[input.key]
                        || (input.elId ? (elements.find(e => e.id === input.elId)?.content || '') : '')
                        || (elements[0]?.runtime_values?.[input.key] || '');

                      return (
                        <div key={input.key} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 shadow-sm transition-all hover:bg-white hover:border-indigo-100">
                          <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isCore ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                            {input.label}
                            {isCore && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1 rounded ml-auto">YÊU CẦU</span>}
                            {!isCore && input.elId && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1 rounded ml-auto">THIẾT KẾ</span>}
                          </label>
                          <input
                            type="text"
                            className="w-full border-gray-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border text-sm bg-white"
                            placeholder={`Nhập ${input.label.toLowerCase()}...`}
                            value={value}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              // Update all elements that use this key
                              setElements(elements.map((item, idx) => {
                                let updated = false;
                                let newItem = { ...item };

                                // Case 1: Legacy variable element
                                if (item.id === input.elId && item.is_variable) {
                                  newItem.content = newVal;
                                  updated = true;
                                }

                                // Case 2: Element containing this placeholder
                                if (item.type === 'text' && item.content?.includes(`{{${input.key}}}`)) {
                                  newItem.runtime_values = { ...(item.runtime_values || {}), [input.key]: newVal };
                                  updated = true;
                                }

                                // Case 3: For core fields NOT in template, store in the first available element 
                                // so the parent Issue page can still extract it from the layout
                                if (isCore && !input.existsInTemplate && idx === 0) {
                                  newItem.runtime_values = { ...(item.runtime_values || {}), [input.key]: newVal };
                                  updated = true;
                                }

                                return updated ? newItem : item;
                              }));
                            }}
                            onFocus={() => input.elId && setSelectedId(input.elId)}
                          />
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Thông tin cơ bản</h4>
                          {coreInputs.map(i => renderInput(i, true))}
                        </div>

                        {otherInputs.length > 0 && (
                          <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Trường bổ sung (Thiết kế)</h4>
                            {otherInputs.map(i => renderInput(i, false))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    <span className="font-bold">Lưu ý:</span> Các trường <strong>Yêu cầu</strong> sẽ được lưu vào hồ sơ ngay cả khi không hiển thị trên mẫu in.
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === "builder" && activeTab === 'settings' && (
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={metadata.name}
                  onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder="e.g. Course Completion 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
                <select
                  value={metadata.certificate_type_id}
                  onChange={(e) => setMetadata({ ...metadata, certificate_type_id: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white"
                >
                  <option value="">Select a type...</option>
                  {availableCertTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                  Linking a type provides field suggestions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={metadata.category}
                  onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                  className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder="e.g. Workshop"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
                  <select
                    value={metadata.page_size}
                    onChange={(e) => setMetadata({ ...metadata, page_size: e.target.value })}
                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                  <select
                    value={metadata.orientation}
                    onChange={(e) => setMetadata({ ...metadata, orientation: e.target.value })}
                    className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border bg-white"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBgUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="text-gray-400" size={24} />
                    <span className="text-sm text-gray-600 font-medium">Click to upload background</span>
                    <span className="text-xs text-gray-400">PNG, JPG up to 10MB</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === "builder" && activeTab === 'elements' && (
            <>
              <div className="p-4 space-y-2 border-b border-gray-100">
                <button
                  onClick={handleAddText}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                >
                  <Type size={18} /> Add Text Field
                </button>
                <button
                  onClick={handleAddQR}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                >
                  <QrCode size={18} /> Add QR Code
                </button>
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleAddImage(e.target.files[0]);
                    }}
                  />
                  <button
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                  >
                    <ImageIcon size={18} /> Add Image
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50/50 min-h-full">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Settings size={18} className="text-gray-500" /> Properties
                </h3>
                {activeElement ? (
                  <>
                    {/* Improved Field Suggestions */}
                    {(metadata.certificate_type_id || true) && (
                      <div className="mt-1 space-y-3">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Thư viện Thẻ thông minh</label>

                        {(() => {
                          const certType = availableCertTypes.find(t => t.id === metadata.certificate_type_id);

                          const categories = [
                            {
                              title: "Người nhận",
                              fields: ["{{recipient_name}}", "{{recipient_email}}", "{{recipient_id}}"],
                              icon: <Plus size={10} className="text-blue-500" />
                            },
                            {
                              title: "Chứng chỉ",
                              fields: ["{{title}}", "{{issued_at}}", "{{expires_at}}", "{{certificate.serial}}", "{{certificate.registry_number}}"],
                              icon: <Plus size={10} className="text-purple-500" />
                            },
                            {
                              title: "Quyết định",
                              fields: ["{{decision.number}}", "{{decision.date}}"],
                              icon: <Plus size={10} className="text-amber-500" />
                            }
                          ];

                          // Add custom fields
                          if (certType?.field_schema?.custom_fields?.length) {
                            categories.push({
                              title: "Trường mở rộng",
                              fields: certType.field_schema.custom_fields.map((f: string) => `{{${f}}}`),
                              icon: <Plus size={10} className="text-emerald-500" />
                            });
                          }

                          return categories.map(cat => (
                            <div key={cat.title} className="space-y-1.5">
                              <span className="text-[9px] font-semibold text-gray-400 block px-1">{cat.title}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {cat.fields.map(f => {
                                  const mapped = VARIABLE_MAP[f] || { label: f.replace(/[{}]/g, ''), color: "bg-gray-100 text-gray-700 border-gray-200" };
                                  return (
                                    <button
                                      key={f}
                                      type="button"
                                      onClick={() => {
                                        const currentContent = activeElement?.content || "";
                                        handleUpdateActive({ content: currentContent + (currentContent ? " " : "") + f });
                                      }}
                                      className={`group px-2 py-1 rounded-md text-[10px] font-medium border transition-all flex items-center gap-1.5 hover:shadow-sm hover:-translate-y-0.5 ${mapped.color}`}
                                    >
                                      {cat.icon}
                                      {mapped.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}

                        <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 mt-2">
                          <p className="text-[9px] text-blue-600 leading-relaxed font-medium">
                            💡 Click để chèn các thẻ này vào vùng soạn thảo bên dưới.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeElement?.type === "text" && (
                      <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                            Nội dung văn bản / Mẫu (Template)
                          </label>
                          <textarea
                            value={activeElement.content || ""}
                            onChange={(e) => handleUpdateActive({ content: e.target.value })}
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border text-gray-900"
                            placeholder="Nhập nội dung kèm {{placeholder}}..."
                            rows={3}
                          />
                          <p className="text-[10px] text-gray-400 mt-1">
                            Sử dụng <code>\n</code> để xuống dòng.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Font</label>
                            <select
                              value={activeElement.font}
                              onChange={(e) => handleUpdateActive({ font: e.target.value })}
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1.5 border bg-white text-gray-900"
                            >
                              {availableFonts.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Size</label>
                            <input
                              type="number"
                              value={activeElement.font_size || 24}
                              onChange={(e) => handleUpdateActive({ font_size: parseInt(e.target.value) })}
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1.5 border text-gray-900"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-white">
                            <button
                              onClick={() => handleUpdateActive({ bold: !activeElement.bold })}
                              className={`p-1.5 rounded transition-colors ${activeElement.bold ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                              <Bold size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateActive({ italic: !activeElement.italic })}
                              className={`p-1.5 rounded transition-colors ${activeElement.italic ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                              <Italic size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateActive({ underline: !activeElement.underline })}
                              className={`p-1.5 rounded transition-colors ${activeElement.underline ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                              <Underline size={16} />
                            </button>
                          </div>

                          <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-white">
                            {(["left", "center", "right"] as const).map(align => (
                              <button
                                key={align}
                                onClick={() => handleUpdateActive({ align })}
                                className={`p-1.5 rounded transition-colors ${activeElement.align === align ? 'bg-gray-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
                              >
                                {align === 'left' && <AlignLeft size={16} />}
                                {align === 'center' && <AlignCenter size={16} />}
                                {align === 'right' && <AlignRight size={16} />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Text Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={rgbToHex(activeElement.color?.[0] || 0, activeElement.color?.[1] || 0, activeElement.color?.[2] || 0)}
                              onChange={(e) => handleUpdateActive({ color: hexToRgb(e.target.value) })}
                              className="h-8 w-12 rounded cursor-pointer border-gray-200 border p-0.5"
                            />
                            <span className="text-xs font-mono text-gray-600">{rgbToHex(activeElement.color?.[0] || 0, activeElement.color?.[1] || 0, activeElement.color?.[2] || 0)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeElement?.type === "qr" && (
                      <div className="pt-2 border-t border-gray-100 mt-4">
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Size: {activeElement.size}px</label>
                        <input
                          type="range"
                          min="20" max="300"
                          value={activeElement.size || 80}
                          onChange={(e) => handleUpdateActive({ size: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    )}

                    {activeElement?.type === "image" && (
                      <div className="space-y-4 pt-2 border-t border-gray-100 mt-4">
                        <div className="bg-gray-100 rounded-lg p-3 flex flex-col items-center gap-2 border border-gray-200">
                          {activeElement.src && (
                            <img src={getFullUrl(activeElement.src)} alt="Preview" className="max-h-32 object-contain rounded shadow-sm" />
                          )}
                          <div className="relative w-full">
                            <input
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  const file = e.target.files[0];
                                  handleUpdateActive({
                                    src: URL.createObjectURL(file),
                                    file: file
                                  });
                                }
                              }}
                            />
                            <button className="w-full text-xs bg-white border border-gray-300 py-1.5 rounded hover:bg-gray-50 transition-colors">Change Image</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Width (px)</label>
                            <input
                              type="number"
                              value={activeElement.width}
                              onChange={(e) => handleUpdateActive({ width: parseInt(e.target.value) })}
                              className="w-full text-sm border-gray-300 rounded-md p-1.5 border"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Height (px)</label>
                            <input
                              type="number"
                              value={activeElement.height}
                              onChange={(e) => handleUpdateActive({ height: parseInt(e.target.value) })}
                              className="w-full text-sm border-gray-300 rounded-md p-1.5 border"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-6">
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        <Trash2 size={16} /> Delete Element
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <Layers className="text-gray-300" size={24} />
                    </div>
                    <p className="text-sm text-gray-500">Select an element on the canvas to configure its properties.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer with Action Button */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          {onSave && (
            <button
              onClick={() => onSave && onSave({ elements }, metadata, bgFile)}
              className="w-full bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 hover:shadow-xl transition-all font-bold text-sm"
            >
              {mode === 'issue' ? (
                <>
                  <Award size={18} />
                  Issue Certificate
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isNew ? 'Create Template' : 'Save Changes'}
                </>
              )}
            </button>
          )}
          {mode === 'issue' && (
            <p className="text-[10px] text-gray-400 text-center mt-3 font-medium">
              Review all fields before issuing the certificate.
            </p>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 bg-gray-200/70 overflow-hidden relative flex items-center justify-center p-8"
        onClick={() => { setSelectedId(null); setEditingId(null); }}
      >
        {/* The Document Canvas */}
        <div
          className="relative bg-white shadow-2xl transition-all duration-300 ease-in-out flex-shrink-0"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            minWidth: canvasWidth,
            minHeight: canvasHeight,
            backgroundImage: previewBg ? `url(${previewBg})` : 'none',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: `scale(${currentScale})`,
            transformOrigin: 'center center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {elements.map((el) => {
            const isSelected = selectedId === el.id;

            return (
              <Rnd
                key={el.id}
                scale={currentScale}
                size={{
                  width: el.width || (el.type === 'qr' ? (el.size || 80) : 'auto'),
                  height: el.height || (el.type === 'qr' ? (el.size || 80) : 'auto')
                }}
                position={{ x: el.x, y: el.y }}
                bounds="parent"
                dragHandleClassName={isSelected && editingId !== el.id ? "drag-handle" : undefined}
                onDragStop={(e, d) => {
                  setElements(elements.map(item => item.id === el.id ? { ...item, x: d.x, y: d.y } : item));
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setElements(elements.map(item => item.id === el.id ? {
                    ...item,
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                    ...position
                  } : item));
                }}
                onMouseDown={() => setSelectedId(el.id)}
                onDoubleClick={() => {
                  if (el.type === 'text' && mode === "builder") setEditingId(el.id);
                }}
                disableDragging={mode === "issue"}
                enableResizing={mode === "builder" && editingId !== el.id && (el.type === 'text' || el.type === 'image')}
                lockAspectRatio={el.type === 'image'}
                className={`${isSelected ? 'ring-2 ring-indigo-500 ring-offset-4' : 'hover:ring-1 hover:ring-indigo-300 border border-dashed border-transparent hover:border-indigo-400'}`}
                style={{
                  zIndex: isSelected ? 50 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center',
                }}
              >
                {el.type === 'text' ? (
                  <div
                    className={`w-full h-full drag-handle flex items-center ${el.align === 'left' ? 'justify-start' : el.align === 'right' ? 'justify-end' : 'justify-center'}`}
                    style={{
                      fontFamily: el.font,
                      fontSize: `${(el.font_size || 24)}px`,
                      color: `rgb(${el.color?.[0] || 0}, ${el.color?.[1] || 0}, ${el.color?.[2] || 0})`,
                      textAlign: el.align,
                      fontWeight: el.bold ? 'bold' : 'normal',
                      fontStyle: el.italic ? 'italic' : 'normal',
                      textDecoration: el.underline ? 'underline' : 'none',
                      width: '100%',
                      wordBreak: 'break-word',
                      lineHeight: 1.2,
                      padding: '4px',
                      cursor: isSelected ? 'move' : 'pointer'
                    }}
                  >
                    {editingId === el.id ? (
                      <textarea
                        ref={editInputRef}
                        value={el.content || ""}
                        onChange={(e) => handleUpdateActive({ content: e.target.value })}
                        onBlur={() => setEditingId(null)}
                        className="bg-transparent border-0 outline-none w-full h-full p-0 m-0 overflow-hidden resize-none"
                        style={{
                          textAlign: el.align,
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          fontWeight: 'inherit',
                          fontStyle: 'inherit',
                          color: 'inherit'
                        }}
                      />
                    ) : (
                      <div className="w-full">
                        {renderBeautifiedContent(el)}
                      </div>
                    )}
                  </div>
                ) : el.type === 'image' ? (
                  <div className="w-full h-full relative group drag-handle">
                    {el.src ? (
                      <img
                        src={getFullUrl(el.src)}
                        alt="Asset"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg pointer-events-none">
                        <ImageIcon className="text-gray-400" size={32} />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-0 right-0 p-1 bg-indigo-600 text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <GripHorizontal size={14} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="bg-white/80 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg shadow-sm drag-handle"
                    style={{
                      width: `${el.size || 80}px`,
                      height: `${el.size || 80}px`
                    }}
                  >
                    <QrCode size={Math.max(20, (el.size || 80) / 2)} className="text-gray-500" />
                  </div>
                )}
              </Rnd>
            );
          })}
        </div>
      </div>

      {/* Floating indicators could go here if needed, but the main save button is now in the sidebar */}
    </div>
  );
}
