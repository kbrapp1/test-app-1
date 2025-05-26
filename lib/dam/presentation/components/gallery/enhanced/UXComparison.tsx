'use client';

import React from 'react';
import { X, Check, MousePointer2, GripVertical } from 'lucide-react';

/**
 * UXComparison - Visual demonstration of click vs drag improvements
 * 
 * Shows the difference between old (entire thumbnail draggable) 
 * and new (dedicated drag handles) patterns.
 */
export const UXComparison: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
        Click vs Drag UX Improvements
      </h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Before - Problematic Design */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <X className="w-5 h-5 text-red-500" />
            <h3 className="font-medium text-red-700">Before: Confusing Interactions</h3>
          </div>
          
          <div className="relative p-4 border border-red-200 rounded-lg bg-red-50/30">
            <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center relative">
              {/* Entire area shows as draggable */}
              <div className="absolute inset-0 cursor-grab border-2 border-dashed border-red-400 rounded-lg">
                <div className="absolute top-2 left-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded">
                  ENTIRE AREA = DRAG
                </div>
              </div>
              <span className="text-gray-500 text-sm">Image Preview</span>
            </div>
            <p className="font-medium text-sm text-gray-900">asset-name.jpg</p>
            <p className="text-xs text-gray-500">2.4 MB</p>
          </div>
          
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <X className="w-4 h-4" />
              <span>Click conflicts with drag</span>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <X className="w-4 h-4" />
              <span>Accidental drags during clicks</span>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <X className="w-4 h-4" />
              <span>Unclear interaction zones</span>
            </div>
          </div>
        </div>

        {/* After - Enhanced Design */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <h3 className="font-medium text-green-700">After: Clear Interactions</h3>
          </div>
          
          <div className="relative p-4 border border-green-200 rounded-lg bg-green-50/30">
            <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center relative group">
              {/* Click area */}
              <div className="cursor-pointer">
                <span className="text-gray-500 text-sm">Image Preview</span>
              </div>
              
              {/* Dedicated drag handle */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-grab shadow-md border border-gray-200">
                <GripVertical className="w-3 h-3 text-gray-600" />
              </div>
              
              <div className="absolute top-2 left-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
                CLICK TO PREVIEW
              </div>
              <div className="absolute bottom-2 left-2 bg-blue-500/80 text-white text-xs px-1 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                DRAG HANDLE
              </div>
            </div>
            <p className="font-medium text-sm text-gray-900">asset-name.jpg</p>
            <p className="text-xs text-gray-500">2.4 MB</p>
          </div>
          
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span>Separate click & drag zones</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span>Clear visual cues</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span>Hover reveals drag handle</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Interaction Guide */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">Enhanced Interaction Patterns</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <MousePointer2 className="w-4 h-4 text-blue-600" />
            <div>
              <span className="font-medium">Click main area</span>
              <p className="text-blue-700">Opens preview/details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-blue-600" />
            <div>
              <span className="font-medium">Drag grip handle</span>
              <p className="text-blue-700">Moves the asset</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 