import React from 'react';

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_36%),linear-gradient(to_bottom_right,_#f8fbff,_#ffffff_45%,_#f6f7ff)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center">
        {children}
      </div>
    </div>
  )
}
