"use client";

import React from 'react';
import VisualBuilder from '@/components/builder/VisualBuilder';

export default function BuilderDemo() {
  const handleSave = (layout: any) => {
    console.log("Saving layout:", layout);
    alert("Layout saved! Check console.");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Visual Builder Demo</h1>
      <p className="text-gray-600 mb-8">
        This is a demonstration of the visual builder that will be integrated into the templates page.
        Drag and drop elements, customize fonts, colors, and more.
      </p>

      <VisualBuilder 
        backgroundUrl="https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" // Sample background
        onSave={handleSave}
      />
    </div>
  );
}
