"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Award, CheckCircle, XCircle, Loader2, Link as LinkIcon, Download } from 'lucide-react';

export default function VerifyPage() {
  const params = useParams();
  const cert_code = params.cert_code as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fn = async () => {
      try {
        const res = await api.get(`/verify/${cert_code}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Certificate not found or invalid.");
      } finally {
        setLoading(false);
      }
    };
    if (cert_code) fn();
  }, [cert_code]);

  if (loading) {
     return <div className="text-center pt-20"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;
  }

  if (error || !data) {
     return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100 p-12 text-center mt-12">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-500">{error || "The certificate code you entered does not exist in our records."}</p>
        </div>
     );
  }

  const isValid = data.is_valid || data.status === 'active' || data.status === 'valid';

  return (
    <div className="mt-8">
        <div className="text-center mb-10">
            <Award className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Credential Verification</h1>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">Verify the authenticity of digital certificates issued by Saigon International University.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
            {/* Status Banner */}
            <div className={`p-6 flex items-center justify-center gap-3 text-white ${isValid ? 'bg-green-600' : 'bg-red-600'}`}>
                {isValid ? (
                    <>
                       <CheckCircle className="w-8 h-8" />
                       <span className="text-xl font-bold tracking-wide">CERTIFICATE IS VALID</span>
                    </>
                ) : (
                    <>
                       <XCircle className="w-8 h-8" />
                       <span className="text-xl font-bold tracking-wide">CERTIFICATE IS REVOKED</span>
                    </>
                )}
            </div>

            <div className="p-8 sm:p-12 space-y-8">
                <div className="text-center border-b border-gray-100 pb-8">
                    <h2 className="text-sm font-semibold text-indigo-600 tracking-widest uppercase mb-2">Awarded To</h2>
                    <p className="text-4xl font-serif text-gray-900">{data.recipient_name}</p>
                </div>

                <div className="text-center">
                    <h2 className="text-sm font-semibold text-gray-500 tracking-widest uppercase mb-2">For Successfully Completing</h2>
                    <p className="text-2xl font-medium text-gray-800">{data.title}</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Issue Date</p>
                        <p className="font-medium text-gray-900">{new Date(data.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Certificate ID</p>
                        <p className="font-mono text-gray-900">{data.cert_code}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Issued By</p>
                        <p className="font-medium text-gray-900">{data.organization_name}</p>
                    </div>
                    {data.expires_at && (
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Expires On</p>
                            <p className="font-medium text-gray-900">{new Date(data.expires_at).toLocaleDateString()}</p>
                        </div>
                    )}
                </div>

                {!isValid && data.revoked_reason && (
                    <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                        <strong className="block mb-1">Reason for Revocation:</strong>
                        {data.revoked_reason}
                    </div>
                )}
            </div>
            
            <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-between items-center sm:flex-row flex-col gap-4">
                 <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2">
                     <LinkIcon size={16} /> Copy Verification Link
                 </button>
            </div>
        </div>
    </div>
  );
}
