import { redirect } from 'next/navigation';

// This component exists only to redirect users.
// When navigating to /settings, they will be automatically
// sent to the default sub-page, /settings/profile.
export default function SettingsIndexPage() {
  redirect('/settings/profile');
} 