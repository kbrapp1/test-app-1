'use client';

import { Suspense } from 'react';
import { SecuritySection } from '@/components/settings/security-section';
 
export default function SecurityPage() {
  return (
    <Suspense fallback={<div>Loading security settings...</div>}>
      <SecuritySection />
    </Suspense>
  );
} 