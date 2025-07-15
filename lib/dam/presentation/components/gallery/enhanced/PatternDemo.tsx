'use client';

import React from 'react';
import { Folder, Image, GripVertical } from 'lucide-react';

/**
 * PatternDemo - Side-by-side demonstration of enhanced click vs drag patterns
 * 
 * Shows consistent UX patterns applied to both folders and assets.
 * Perfect for showcasing the improvements to stakeholders.
 */
export const PatternDemo: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
        Enhanced Click vs Drag Patterns
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Folder Pattern */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800 text-center">📁 Folder Items</h3>
          
          {/* Grid Folder */}
          <div className="p-4 border border-gray-200 rounded-lg group">
            <div className="w-16 h-16 mx-auto rounded-lg bg-blue-100 flex items-center justify-center mb-3 relative group/thumbnail">
              <Folder className="w-8 h-8 text-blue-600" />
              
              {/* Grid drag handle - top-right */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-200/90 rounded-full opacity-0 group-hover/thumbnail:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-grab shadow-sm">
                <GripVertical className="w-2.5 h-2.5 text-blue-700" />
              </div>
            </div>
            <p className="text-sm font-medium text-center">Documents</p>
            <p className="text-xs text-gray-500 text-center">Grid View</p>
          </div>
          
          {/* List Folder */}
          <div className="p-3 border border-gray-200 rounded-lg group">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-md bg-blue-100 flex items-center justify-center mr-3 relative group/thumbnail">
                <Folder className="w-4 h-4 text-blue-600" />
                
                {/* List drag handle - right side */}
                <div className="absolute -right-1 top-0 bottom-0 w-3 bg-blue-200/80 rounded-r-md opacity-0 group-hover/thumbnail:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-grab">
                  <GripVertical className="w-2 h-2 text-blue-700" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Documents</p>
                <p className="text-xs text-gray-500">List View</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Asset Pattern */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800 text-center">🖼️ Asset Items</h3>
          
          {/* Grid Asset */}
          <div className="p-4 border border-gray-200 rounded-lg group">
            <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center relative group/thumbnail">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-8 h-8 text-green-600" />
              
              {/* Asset drag handle - bottom-right */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-white/90 rounded-full opacity-0 group-hover/thumbnail:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-grab shadow-md border border-gray-200">
                <GripVertical className="w-3 h-3 text-gray-600" />
              </div>
            </div>
            <p className="text-sm font-medium">vacation.jpg</p>
            <p className="text-xs text-gray-500">2.4 MB</p>
          </div>
        </div>
      </div>
      
      {/* Pattern Guide */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Interaction Guide</h4>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span><strong>Click main area</strong> - Opens/navigates to item</span>
          </div>
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-600" />
            <span><strong>Drag grip handle</strong> - Moves the item (appears on hover)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-gray-300 rounded"></div>
            <span><strong>Hover to reveal</strong> - Drag handles appear when needed</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 