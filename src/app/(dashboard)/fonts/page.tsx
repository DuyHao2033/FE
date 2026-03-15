"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Type, Upload, Trash2, Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAuthStore } from '@/lib/store';

interface Font {
  name: string;
  filename: string;
}

export default function FontsPage() {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const fetchFonts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/fonts');
      setFonts(response.data.items);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching fonts:', err);
      setError('Could not load fonts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFonts();
  }, []);

  useEffect(() => {
    if (fonts.length > 0) {
      const styleId = 'fonts-page-styles';
      let styleEl = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        document.head.appendChild(styleEl);
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
      const fontRules = fonts.map(f => `
        @font-face {
          font-family: '${f.name}';
          src: url('${baseUrl}/fonts-static/${f.filename}') format('truetype');
        }
      `).join('\n');
      styleEl.innerHTML = fontRules;
    }
  }, [fonts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.ttf')) {
        setError('Only .ttf files are supported.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/fonts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(`Font "${selectedFile.name}" uploaded successfully!`);
      setShowUploadModal(false);
      setSelectedFile(null);
      fetchFonts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error uploading font:', err);
      setError(err.response?.data?.detail || 'Failed to upload font.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete font "${filename}"?`)) return;

    try {
      await api.delete(`/fonts/${filename}`);
      setSuccess('Font deleted successfully!');
      fetchFonts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting font:', err);
      setError('Failed to delete font.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Font Management</h1>
          <p className="text-gray-500 mt-1">Manage system-wide fonts for your certificate templates.</p>
        </div>
        {isSuperAdmin && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition-all font-medium"
          >
            <Plus size={18} />
            <span>Upload Font</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600 h-10 w-10 mb-4" />
            <p className="text-gray-500 font-medium">Loading fonts...</p>
          </div>
        ) : fonts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Type className="text-gray-300" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No fonts found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">
              Upload .ttf fonts to use them in your certificate templates. These fonts must support the characters you plan to use (e.g., Vietnamese).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Font Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Filename</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Preview</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fonts.map((font) => (
                  <tr key={font.filename} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <Type size={16} />
                        </div>
                        <span className="font-medium text-gray-900">{font.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                        {font.filename}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xl text-gray-800" style={{ fontFamily: font.name }}>
                        Abc 123 Tiếng Việt
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isSuperAdmin && (
                        <button 
                          onClick={() => handleDelete(font.filename)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Font"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal 
        isOpen={showUploadModal} 
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setError(null);
        }}
        title="Upload New Font"
      >
        <div className="space-y-6 py-2">
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${selectedFile ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'}`}
          >
            <input 
              type="file" 
              accept=".ttf"
              onChange={handleFileChange}
              className="hidden"
              id="font-upload"
            />
            <label htmlFor="font-upload" className="cursor-pointer flex flex-col items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${selectedFile ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {isUploading ? <Loader2 className="animate-spin" size={28} /> : <Upload size={28} />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">
                  {selectedFile ? selectedFile.name : 'Click to select font file'}
                </p>
                <p className="text-xs text-gray-500">Only .ttf files are supported. Max size 10MB.</p>
              </div>
            </label>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="text-amber-600 shrink-0" size={20} />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Note:</strong> Ensure the font supports Vietnamese characters (diacritics) if you plan to use them in certificates. Standard fonts like Arial, Times New Roman, or Roboto are recommended.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${!selectedFile || isUploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Upload Font</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
