import React from 'react';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-slate-900 font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
