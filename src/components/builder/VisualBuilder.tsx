"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { 
  Type, QrCode, Trash2, Settings, Download, Plus, Save, 
  AlignLeft, AlignCenter, AlignRight, FileText, Image as ImageIcon, 
  Layers, Bold, Italic, Underline, Lock, Unlock, GripHorizontal 
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
}

export interface TemplateMetadata {
  name: string;
  category: string;
  page_size: string;
  orientation: string;
}

interface VisualBuilderProps {
  initialLayout?: { elements: BuilderElement[] };
  initialMetadata?: TemplateMetadata;
  backgroundUrl?: string;
  onSave?: (layout: { elements: BuilderElement[] }, metadata: TemplateMetadata, bgFile: File | null) => void;
  isNew?: boolean;
  mode?: "builder" | "issue";
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

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

export default function VisualBuilder({ initialLayout, initialMetadata, backgroundUrl, onSave, isNew, mode = "builder" }: VisualBuilderProps) {
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
  
  // Calculate scale once
  const currentScale = isPortrait ? 0.75 : 0.6;

  const [editingId, setEditingId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

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
      is_variable: true,
      content: "Sample text content"
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
    <div className="relative flex h-[calc(100vh-100px)] bg-gray-50 border border-gray-200 mt-4 rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col z-10">
        
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

        <div className="flex-1 overflow-y-auto">
          {mode === "issue" && (
            <div className="p-5 space-y-6">
              <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <FileText className="text-indigo-600" size={18} />
                Recipient Information
              </h3>
              <div className="space-y-4">
                {elements.filter(el => el.type === 'text' && el.is_variable).map(el => (
                  <div key={el.id}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">
                      {el.key.replace(/_/g, ' ')}
                    </label>
                    <input 
                      type="text"
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border text-sm"
                      placeholder={`Enter ${el.key.replace(/_/g, ' ')}`}
                      value={el.content || ''}
                      onChange={(e) => {
                        setElements(elements.map(item => item.id === el.id ? { ...item, content: e.target.value } : item));
                      }}
                      onFocus={() => setSelectedId(el.id)}
                    />
                  </div>
                ))}
                {elements.filter(el => el.type === 'text' && el.is_variable).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No variable fields found in this template.</p>
                )}
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
                  onChange={(e) => setMetadata({...metadata, name: e.target.value})}
                  className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder="e.g. Course Completion 2024"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input 
                  type="text" 
                  value={metadata.category}
                  onChange={(e) => setMetadata({...metadata, category: e.target.value})}
                  className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  placeholder="e.g. Workshop"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
                  <select 
                    value={metadata.page_size}
                    onChange={(e) => setMetadata({...metadata, page_size: e.target.value})}
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
                    onChange={(e) => setMetadata({...metadata, orientation: e.target.value})}
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
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Field Key</label>
                            <input 
                              type="text" 
                              value={activeElement.key}
                              onChange={(e) => handleUpdateActive({ key: e.target.value })}
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border font-mono bg-white"
                              placeholder="e.g. recipient_name"
                            />
                          </div>
                          <button 
                             onClick={() => handleUpdateActive({ is_variable: !activeElement.is_variable })}
                             title={activeElement.is_variable !== false ? "Variable Field (Unique per cert)" : "Static Field (Same for all certs)"}
                             className={`p-2 rounded-md border transition-all ${activeElement.is_variable !== false ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-gray-200 border-gray-300 text-gray-600'}`}
                          >
                            {activeElement.is_variable !== false ? <Unlock size={18} /> : <Lock size={18} />}
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 uppercase font-semibold flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${activeElement.is_variable !== false ? 'bg-indigo-500' : 'bg-gray-400'}`}></span>
                          {activeElement.is_variable !== false ? 'Variable: Unique for each certificate' : 'Static: Same for all certificates'}
                        </p>
                      </div>
                    </div>

                    {activeElement.type === "text" && (
                      <div className="space-y-4 pt-2">
                         {!activeElement.is_variable && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Static Content</label>
                            <textarea 
                              value={activeElement.content || ""}
                              onChange={(e) => handleUpdateActive({ content: e.target.value })}
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                              placeholder="Enter fixed text here..."
                              rows={2}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Font</label>
                            <select 
                              value={activeElement.font}
                              onChange={(e) => handleUpdateActive({ font: e.target.value })}
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1.5 border bg-white"
                            >
                              {availableFonts.map(f => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Size</label>
                            <input 
                              type="number" 
                              value={activeElement.font_size || 24}
                              onChange={(e) => handleUpdateActive({ font_size: parseInt(e.target.value) })}
                              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-1.5 border"
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
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Text Color</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={rgbToHex(activeElement.color?.[0]||0, activeElement.color?.[1]||0, activeElement.color?.[2]||0)}
                              onChange={(e) => handleUpdateActive({ color: hexToRgb(e.target.value) })}
                              className="h-8 w-12 rounded cursor-pointer border-gray-200 border p-0.5"
                            />
                            <span className="text-xs font-mono text-gray-500">{rgbToHex(activeElement.color?.[0]||0, activeElement.color?.[1]||0, activeElement.color?.[2]||0)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeElement.type === "qr" && (
                      <div className="pt-2">
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

                    {activeElement.type === "image" && (
                      <div className="space-y-4 pt-2">
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
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-gray-200/70 overflow-auto relative flex items-center justify-center p-12" onClick={() => { setSelectedId(null); setEditingId(null); }}>
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
                       color: `rgb(${el.color?.[0]||0}, ${el.color?.[1]||0}, ${el.color?.[2]||0})`,
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
                        value={el.is_variable !== false ? el.key : (el.content || '')}
                        onChange={(e) => {
                          if (el.is_variable !== false) {
                            handleUpdateActive({ key: e.target.value });
                          } else {
                            handleUpdateActive({ content: e.target.value });
                          }
                        }}
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
                      el.is_variable !== false ? `[${el.key}]` : (el.content || 'Static Text')
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
      
      {/* Save action floating directly on canvas area */}
      {onSave && (
        <button 
          onClick={() => onSave && onSave({ elements }, metadata, bgFile)}
          className="absolute bottom-6 right-6 z-20 bg-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 hover:bg-indigo-700 hover:shadow-xl transition-all font-medium"
        >
          <Save size={18} /> {mode === 'issue' ? 'Issue Certificate' : (isNew ? 'Create Template' : 'Save Changes')}
        </button>
      )}
    </div>
  );
}
