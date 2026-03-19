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
import { useTranslation } from 'react-i18next';

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

const VARIABLE_MAP_KEYS: Record<string, string> = {
  "{{recipient_name}}": "builder.variables.recipient_name",
  "{{recipient_email}}": "builder.variables.recipient_email",
  "{{recipient_id}}": "builder.variables.recipient_id",
  "{{title}}": "builder.variables.title",
  "{{issued_at}}": "builder.variables.issued_at",
  "{{expires_at}}": "builder.variables.expires_at",
  "{{decision.number}}": "builder.variables.decision_number",
  "{{decision.date}}": "builder.variables.decision_date",
  "{{certificate.serial}}": "builder.variables.cert_serial",
  "{{certificate.registry_number}}": "builder.variables.cert_registry",
};

const VARIABLE_MAP_STYLES: Record<string, string> = {
  "{{recipient_name}}": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "{{recipient_email}}": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "{{recipient_id}}": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "{{title}}": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "{{issued_at}}": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "{{expires_at}}": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "{{decision.number}}": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "{{decision.date}}": "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "{{certificate.serial}}": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "{{certificate.registry_number}}": "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
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
  const { t } = useTranslation();
  const [elements, setElements] = useState<BuilderElement[]>(initialLayout?.elements || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "elements">(isNew ? "settings" : "elements");

  const [metadata, setMetadata] = useState<TemplateMetadata>(initialMetadata || {
    name: "",
    category: t('common.general'),
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
        const transKey = VARIABLE_MAP_KEYS[part];
        const label = transKey ? t(transKey) : key;
        const colorClass = VARIABLE_MAP_STYLES[part] || "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";

        // In issue mode, if we have a real-time value, show it in a special style
        const displayValue = (mode === 'issue' && el.runtime_values?.[key]) ? el.runtime_values[key] : label;
        const isFilled = mode === 'issue' && !!el.runtime_values?.[key];

        return (
          <span
            key={i}
            className={`inline-block px-1.5 py-0.5 mx-0.5 rounded text-[0.85em] font-bold border border-current align-baseline whitespace-nowrap ${isFilled ? 'bg-primary/10 text-primary border-primary/20' : 'opacity-90'} ${colorClass}`}
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
      content: t('builder.placeholders.newText')
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
    <div className="relative flex flex-1 min-h-0 bg-muted/30 border border-border mt-1 rounded-2xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col z-10 text-foreground">

        {/* Tabs */}
        {mode === "builder" && (
          <div className="flex border-b border-border">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${activeTab === 'settings' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} /> {t('common.settings')}
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${activeTab === 'elements' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
              onClick={() => setActiveTab('elements')}
            >
              <Layers size={16} /> {t('common.elements')}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {mode === "issue" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-foreground border-b border-border pb-2 flex items-center gap-2 mb-4">
                  <FileText className="text-primary" size={18} />
                  {t('builder.issueInfo')}
                </h3>

                <div className="space-y-4">
                  {extraIssueData && (
                    <>
                      <div className="bg-accent/30 p-3 rounded-xl border border-border/50 shadow-sm">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{t('builder.decisionLink')}</label>
                        <select
                          value={extraIssueData.decisionId}
                          onChange={(e) => extraIssueData.setDecisionId(e.target.value)}
                          className="w-full text-sm border-border rounded-lg p-2 border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        >
                          <option value="">{t('builder.noDecision')}</option>
                          {extraIssueData.decisions.map(d => (
                            <option key={d.id} value={d.id}>{d.decision_number} ({new Date(d.decision_date).toLocaleDateString()})</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-accent/30 p-3 rounded-xl border border-border/50 shadow-sm">
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{t('builder.registryNum')}</label>
                        <input
                          type="text"
                          value={extraIssueData.registryNumber}
                          onChange={(e) => extraIssueData.setRegistryNumber(e.target.value)}
                          placeholder="v.d. 001/2026"
                          className="w-full text-sm border-border rounded-lg p-2 border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        />
                      </div>
                      <div className="h-px bg-border/50 my-2" />
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
                        label: t(VARIABLE_MAP_KEYS[`{{${k}}}`] || k),
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
                            const transKey = VARIABLE_MAP_KEYS[`{{${el.key}}}`];
                            otherInputs.push({ key: el.key, label: transKey ? t(transKey) : el.key, elId: el.id });
                          }
                        }
                      } else if (el.content?.includes('{{')) {
                        const matches = el.content.match(/\{\{([^{}]+)\}\}/g);
                        matches?.forEach(m => {
                          const key = m.replace(/[{}]/g, '').trim();
                          if (coreKeys.includes(key)) return;
                          if (key.startsWith('decision.') || key === 'certificate.registry_number' || key === 'certificate.serial') return;

                          if (!otherInputs.find(i => i.key === key)) {
                            otherInputs.push({ key, label: t(VARIABLE_MAP_KEYS[`{{${key}}}`] || key) });
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
                        <div key={input.key} className="bg-accent/30 p-3 rounded-xl border border-border/50 shadow-sm transition-all hover:bg-card hover:border-primary/50 group/input">
                          <label className="block text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isCore ? 'bg-primary' : 'bg-emerald-500'}`}></span>
                            {input.label}
                            {isCore && <span className="text-[8px] bg-primary/10 text-primary px-1.5 rounded ml-auto font-black">{t('common.required')}</span>}
                            {!isCore && input.elId && <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1.5 rounded ml-auto font-black">{t('common.inDesign')}</span>}
                          </label>
                          <input
                            type="text"
                            className="w-full border-border rounded-lg shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 px-3 py-2 border text-sm bg-card outline-none transition-all"
                            placeholder={`${t('common.add')} ${input.label.toLowerCase()}...`}
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
                          <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">{t('builder.basicInfo')}</h4>
                          {coreInputs.map(i => renderInput(i, true))}
                        </div>

                        {otherInputs.length > 0 && (
                          <div className="space-y-4 pt-4 border-t border-dashed border-border">
                            <h4 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1">{t('builder.designFields')}</h4>
                            {otherInputs.map(i => renderInput(i, false))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-[11px] text-primary/80 leading-relaxed font-medium">
                    <span className="font-bold">{t('builder.note')}:</span> {t('builder.noteText')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === "builder" && activeTab === 'settings' && (
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">{t('common.templateName')}</label>
                <input
                  type="text"
                  value={metadata.name}
                  onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                  className="w-full text-sm border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-2 border bg-card outline-none"
                  placeholder={t('builder.placeholders.templateName')}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">{t('sidebar.certTypes')}</label>
                <select
                  value={metadata.certificate_type_id}
                  onChange={(e) => setMetadata({ ...metadata, certificate_type_id: e.target.value })}
                  className="w-full text-sm border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-2 border bg-card outline-none"
                >
                  <option value="">{t('builder.placeholders.selectType')}</option>
                  {availableCertTypes.map(t => (
                    <option key={t.id} value={t.id} className="bg-card">{t.name} ({t.code})</option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-muted-foreground uppercase font-bold tracking-tight opacity-60">
                  {t('builder.typeSelectionHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">{t('common.category')}</label>
                <input
                  type="text"
                  value={metadata.category}
                  onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                  className="w-full text-sm border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-2 border bg-card outline-none"
                  placeholder={t('builder.category')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">{t('common.pageSize')}</label>
                  <select
                    value={metadata.page_size}
                    onChange={(e) => setMetadata({ ...metadata, page_size: e.target.value })}
                    className="w-full text-sm border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-2 border bg-card outline-none"
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">{t('common.orientation')}</label>
                  <select
                    value={metadata.orientation}
                    onChange={(e) => setMetadata({ ...metadata, orientation: e.target.value })}
                    className="w-full text-sm border-border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-2 border bg-card outline-none"
                  >
                    <option value="landscape">{t('common.landscape')}</option>
                    <option value="portrait">{t('common.portrait')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">{t('builder.background')}</label>
                <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:bg-accent/50 transition-all cursor-pointer relative group/bg overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBgUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center gap-2 group-hover:scale-110 transition-transform">
                    <ImageIcon className="text-muted-foreground group-hover:text-primary transition-colors" size={32} />
                    <span className="text-sm text-foreground font-bold">{t('builder.placeholders.uploadBg')}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t('builder.uploadFormatHint')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === "builder" && activeTab === 'elements' && (
            <>
              <div className="p-4 space-y-3 border-b border-border">
                <button
                  onClick={handleAddText}
                  className="w-full flex items-center justify-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all font-bold text-sm shadow-sm"
                >
                  <Type size={18} /> {t('builder.addText')}
                </button>
                <button
                  onClick={handleAddQR}
                  className="w-full flex items-center justify-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all font-bold text-sm shadow-sm"
                >
                  <QrCode size={18} /> {t('builder.addQR')}
                </button>
                <div className="relative">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleAddImage(e.target.files[0]);
                    }}
                  />
                  <button
                    className="w-full flex items-center justify-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all font-bold text-sm shadow-sm"
                  >
                    <ImageIcon size={18} /> {t('builder.addImage')}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-muted/30 min-h-full">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 uppercase text-[10px] tracking-widest opacity-60">
                  <Settings size={14} className="text-primary" /> {t('builder.propertiesLabel')}
                </h3>
                {activeElement ? (
                  <>
                    {/* Improved Field Suggestions */}
                    {(metadata.certificate_type_id || true) && (
                      <div className="mt-1 space-y-3">
                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('builder.smartTags')}</label>

                        {(() => {
                          const certType = availableCertTypes.find(t => t.id === metadata.certificate_type_id);

                          const categories = [
                            {
                              title: t('builder.categories.recipient'),
                              fields: ["{{recipient_name}}", "{{recipient_email}}", "{{recipient_id}}"],
                              icon: <Plus size={10} className="text-blue-500" />
                            },
                            {
                              title: t('builder.categories.certificate'),
                              fields: ["{{title}}", "{{issued_at}}", "{{expires_at}}", "{{certificate.serial}}", "{{certificate.registry_number}}"],
                              icon: <Plus size={10} className="text-purple-500" />
                            },
                            {
                              title: t('builder.categories.decision'),
                              fields: ["{{decision.number}}", "{{decision.date}}"],
                              icon: <Plus size={10} className="text-amber-500" />
                            }
                          ];

                          // Add custom fields
                          if (certType?.field_schema?.custom_fields?.length) {
                            categories.push({
                              title: t('builder.categories.custom'),
                              fields: certType.field_schema.custom_fields.map((f: string) => `{{${f}}}`),
                              icon: <Plus size={10} className="text-emerald-500" />
                            });
                          }

                          return categories.map(cat => (
                            <div key={cat.title} className="space-y-1.5">
                              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider block px-1">{cat.title}</span>
                              <div className="flex flex-wrap gap-1.5">
                                {cat.fields.map(f => {
                                  const transKey = VARIABLE_MAP_KEYS[f];
                                  const label = transKey ? t(transKey) : f.replace(/[{}]/g, '');
                                  const colorClass = VARIABLE_MAP_STYLES[f] || "bg-accent text-foreground border-border";
                                  return (
                                    <button
                                      key={f}
                                      type="button"
                                      onClick={() => {
                                        const currentContent = activeElement?.content || "";
                                        handleUpdateActive({ content: currentContent + (currentContent ? " " : "") + f });
                                      }}
                                      className={`group px-2 py-1.5 rounded-lg text-[10px] font-bold border transform active:scale-95 transition-all flex items-center gap-1.5 hover:shadow-md hover:-translate-y-0.5 ${colorClass}`}
                                    >
                                      {cat.icon}
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        })()}

                        <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mt-2">
                          <p className="text-[10px] text-primary leading-relaxed font-bold italic">
                            💡 {t('builder.smartTagHint')}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeElement?.type === "text" && (
                      <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
                        <div>
                          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
                            {t('builder.textContent')}
                          </label>
                          <textarea
                            value={activeElement.content || ""}
                            onChange={(e) => handleUpdateActive({ content: e.target.value })}
                            className="w-full text-sm border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 border bg-card text-foreground outline-none transition-all"
                            placeholder={t('builder.placeholders.enterContent')}
                            rows={3}
                          />
                          <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">
                            {t('builder.newlineHint')} <code>\n</code>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">{t('builder.font')}</label>
                            <select
                              value={activeElement.font}
                              onChange={(e) => handleUpdateActive({ font: e.target.value })}
                              className="w-full text-sm border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-2 border bg-card text-foreground outline-none transition-all"
                            >
                              {availableFonts.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">{t('builder.fontSize')}</label>
                            <input
                              type="number"
                              value={activeElement.font_size || 24}
                              onChange={(e) => handleUpdateActive({ font_size: parseInt(e.target.value) })}
                              className="w-full text-sm border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-2 border bg-card text-foreground outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center border border-border rounded-lg p-1 bg-card">
                            <button
                              onClick={() => handleUpdateActive({ bold: !activeElement.bold })}
                              className={`p-1.5 rounded transition-colors ${activeElement.bold ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
                            >
                              <Bold size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateActive({ italic: !activeElement.italic })}
                              className={`p-1.5 rounded transition-colors ${activeElement.italic ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
                            >
                              <Italic size={16} />
                            </button>
                            <button
                              onClick={() => handleUpdateActive({ underline: !activeElement.underline })}
                              className={`p-1.5 rounded transition-colors ${activeElement.underline ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
                            >
                              <Underline size={16} />
                            </button>
                          </div>

                          <div className="flex items-center border border-border rounded-lg p-1 bg-card">
                            {(["left", "center", "right"] as const).map(align => (
                              <button
                                key={align}
                                onClick={() => handleUpdateActive({ align })}
                                className={`p-1.5 rounded transition-colors ${activeElement.align === align ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
                              >
                                {align === 'left' && <AlignLeft size={16} />}
                                {align === 'center' && <AlignCenter size={16} />}
                                {align === 'right' && <AlignRight size={16} />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">{t('builder.textColor')}</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={rgbToHex(activeElement.color?.[0] || 0, activeElement.color?.[1] || 0, activeElement.color?.[2] || 0)}
                              onChange={(e) => handleUpdateActive({ color: hexToRgb(e.target.value) })}
                              className="h-10 w-16 rounded-xl cursor-pointer border-border border p-1 bg-card hover:bg-accent transition-colors"
                            />
                            <span className="text-xs font-black font-mono text-muted-foreground uppercase tracking-widest opacity-60">
                              {rgbToHex(activeElement.color?.[0] || 0, activeElement.color?.[1] || 0, activeElement.color?.[2] || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeElement?.type === "qr" && (
                      <div className="pt-2 border-t border-border mt-4">
                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
                          {t('builder.qrSize')}: {activeElement.size}px
                        </label>
                        <input
                          type="range"
                          min="20" max="400"
                          value={activeElement.size || 80}
                          onChange={(e) => handleUpdateActive({ size: parseInt(e.target.value) })}
                          className="w-full accent-primary"
                        />
                      </div>
                    )}

                    {activeElement?.type === "image" && (
                      <div className="space-y-4 pt-2 border-t border-border mt-4">
                        <div className="bg-muted/50 rounded-xl p-3 flex flex-col items-center gap-2 border border-border">
                          {activeElement.src && (
                            <img src={getFullUrl(activeElement.src)} alt="Preview" className="max-h-32 object-contain rounded-lg shadow-sm" />
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
                            <button className="w-full text-xs font-bold bg-card border border-border py-2 rounded-lg hover:bg-accent transition-all shadow-sm">
                              {t('builder.changeImage')}
                            </button>
                          </div>
                                       <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">{t('builder.width')}</label>
                            <input
                              type="number"
                              value={activeElement.width}
                              onChange={(e) => handleUpdateActive({ width: parseInt(e.target.value) })}
                              className="w-full text-sm border-border rounded-lg p-2 border bg-card text-foreground outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">{t('builder.height')}</label>
                            <input
                              type="number"
                              value={activeElement.height}
                              onChange={(e) => handleUpdateActive({ height: parseInt(e.target.value) })}
                              className="w-full text-sm border-border rounded-lg p-2 border bg-card text-foreground outline-none transition-all"
                            />
                          </div>
                        </div>
          </div>
                      </div>
                    )}

                    <div className="pt-8 mb-12">
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive hover:text-white hover:border-destructive transition-all text-xs font-black uppercase tracking-widest shadow-sm"
                      >
                        <Trash2 size={16} /> {t('builder.deleteElement')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="w-20 h-20 bg-accent/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border shadow-inner">
                      <Layers className="text-muted-foreground/30" size={32} />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                      {t('builder.selectToConfigure')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer with Action Button */}
        <div className="p-5 border-t border-border bg-accent/30">
          {onSave && (
            <button
              onClick={() => onSave && onSave({ elements }, metadata, bgFile)}
              className="w-full bg-primary text-primary-foreground px-5 py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2.5 hover:opacity-90 transform active:scale-95 transition-all font-black text-xs uppercase tracking-widest"
            >
              {mode === 'issue' ? (
                <>
                  <Award size={18} />
                  {t('certificates.issue.singleTitle')}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isNew ? t('common.create') : t('common.saveChanges')}
                </>
              )}
            </button>
          )}
          {mode === 'issue' && (
            <p className="text-[10px] text-muted-foreground font-bold text-center mt-4 tracking-tight opacity-60">
              {t('builder.issueHint')}
            </p>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 bg-muted/20 overflow-hidden relative flex items-center justify-center p-8 backdrop-blur-[2px]"
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
                className={`${isSelected ? 'ring-2 ring-primary ring-offset-4' : 'hover:ring-1 hover:ring-primary/40 border border-dashed border-transparent hover:border-primary/50'}`}
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
                      <div className="w-full h-full bg-accent/50 flex items-center justify-center border-2 border-dashed border-border rounded-lg pointer-events-none">
                        <ImageIcon className="text-muted-foreground/30" size={32} />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <GripHorizontal size={14} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="bg-card/90 flex items-center justify-center border-2 border-dashed border-border rounded-xl shadow-lg drag-handle backdrop-blur-sm"
                    style={{
                      width: `${el.size || 80}px`,
                      height: `${el.size || 80}px`
                    }}
                  >
                    <QrCode size={Math.max(20, (el.size || 80) / 2)} className="text-muted-foreground" />
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
