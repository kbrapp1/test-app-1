'use client';

import { Suspense } from 'react';
import { ProfileForm } from '@/components/settings/profile-form';
 
export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <ProfileForm />
    </Suspense>
  );
} 