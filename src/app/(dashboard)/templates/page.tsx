"use client";

import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Layout, Search, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Loader2, Copy } from 'lucide-react';
import Link from 'next/link';
import { getFullUrl } from '@/utils/url';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';

interface Template {
  id: string;
  name: string;
  category: string;
  page_size: string;
  orientation: string;
  is_active: boolean;
  background_url?: string;
  certificate_type_id?: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(6);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/templates', {
        params: {
          q: debouncedSearch,
          page: currentPage,
          limit: pageSize
        }
      });
      
      // Handle both cases: backend returns array OR object with metadata
      if (Array.isArray(res.data)) {
        setTemplates(res.data);
        setTotalItems(res.data.length);
        setTotalPages(1);
      } else {
        setTemplates(res.data.items || []);
        setTotalItems(res.data.total || 0);
        setTotalPages(Math.ceil((res.data.total || 0) / pageSize));
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [debouncedSearch, currentPage]);

  const handleDuplicate = async (tmpl: Template) => {
    try {
      setIsSubmitting(true);
      // 1. Get full data
      const res = await api.get(`/templates/${tmpl.id}`);
      const fullTmpl = res.data;
      
      // 2. Create new template
      const createRes = await api.post('/templates', {
        name: `${fullTmpl.name} (Copy)`,
        category: fullTmpl.category,
        page_size: fullTmpl.page_size,
        orientation: fullTmpl.orientation,
        certificate_type_id: fullTmpl.certificate_type_id
      });
      const newId = createRes.data.id;

      // 3. Update with layout and background url
      await api.patch(`/templates/${newId}`, {
        layout_json: fullTmpl.layout_json,
        background_url: fullTmpl.background_url
      });
      
      setActiveMenuId(null);
      fetchTemplates();
    } catch (error) {
      console.error("Failed to duplicate template", error);
      alert("Failed to duplicate template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (tmpl: Template) => {
    try {
      setActiveMenuId(null);
      await api.patch(`/templates/${tmpl.id}`, {
        is_active: !tmpl.is_active
      });
      fetchTemplates();
    } catch (error) {
      console.error("Failed to toggle status", error);
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Templates</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage certificate designs, layouts, and mappings.
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3 items-end sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all bg-white"
            />
          </div>
          
          <Link
            href="/templates/create"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            Create Template
          </Link>
        </div>
      </div>
      
      {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">Loading templates...</div>
      ) : isSubmitting ? (
          <div className="py-20 text-center text-sm text-gray-500 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span>Processing request...</span>
          </div>
      ) : templates.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
             <Layout className="mx-auto h-12 w-12 text-gray-400 mb-4" />
             <h3 className="mt-2 text-sm font-semibold text-gray-900">No templates found</h3>
             <p className="mt-1 text-sm text-gray-500">Get started by creating a new certificate template.</p>
          </div>
      ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {templates.map((tmpl: Template) => (
                <div key={tmpl.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col relative">
                    <div className="h-48 bg-gray-100 flex items-center justify-center border-b border-gray-100 relative group-hover:opacity-90 transition-opacity overflow-hidden outline outline-1 outline-gray-200/50">
                        {tmpl.background_url ? (
                            <img 
                                src={getFullUrl(tmpl.background_url)} 
                                alt={tmpl.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Layout className="h-12 w-12 text-gray-300" />
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">No Background</span>
                            </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ring-1 ring-inset ${tmpl.is_active ? 'bg-green-500 text-white ring-green-600/20' : 'bg-gray-500 text-white ring-gray-600/20'}`}>
                                {tmpl.is_active ? 'Active' : 'Draft'}
                            </span>
                        </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{tmpl.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{tmpl.category || 'General'}</p>
                        
                        <div className="flex flex-col text-xs text-gray-400 gap-1 mb-4">
                            <div className="flex justify-between">
                                <span>Format: <span className="font-medium text-gray-700">{tmpl.page_size}</span></span>
                                <span>Orientation: <span className="font-medium text-gray-700 capitalize">{tmpl.orientation}</span></span>
                            </div>
                            {tmpl.certificate_type_id && (
                                <div className="mt-1">
                                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 uppercase tracking-tighter">
                                        Type ID: {tmpl.certificate_type_id.substring(0, 8)}...
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                            <Link 
                              href={`/templates/${tmpl.id}/builder`}
                              className="flex-1 text-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Edit Template
                            </Link>
                            <div className="relative">
                                <button 
                                    onClick={() => setActiveMenuId(activeMenuId === tmpl.id ? null : tmpl.id)}
                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                                >
                                    <MoreVertical size={16} />
                                </button>
                                
                                {activeMenuId === tmpl.id && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-10" 
                                            onClick={() => setActiveMenuId(null)}
                                        />
                                        <div className="absolute right-0 bottom-full mb-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-20 overflow-hidden border border-gray-100">
                                            <div className="py-1">
                                                <button
                                                    onClick={() => toggleActive(tmpl)}
                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    {tmpl.is_active ? (
                                                        <>
                                                            <XCircle size={16} className="text-gray-400" />
                                                            <span>Deactivate</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle size={16} className="text-indigo-500" />
                                                            <span>Activate</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(tmpl)}
                                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Copy size={16} className="text-gray-400" />
                                                    <span>Duplicate</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                  <div className="text-sm text-gray-500">
                      Showing <span className="font-medium text-gray-900">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium text-gray-900">{totalItems}</span> results
                  </div>
                  <div className="flex gap-2">
                      <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                      >
                          <ChevronLeft size={16} />
                          Previous
                      </button>
                      <div className="flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-700 border border-transparent hover:border-gray-200'}`}
                              >
                                  {page}
                              </button>
                          ))}
                      </div>
                      <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                      >
                          Next
                          <ChevronRight size={16} />
                      </button>
                  </div>
              </div>
          )}
          </>
      )}

    </div>
  );
}
