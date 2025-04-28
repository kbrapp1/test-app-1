// import { redirect } from 'next/navigation' // No longer needed here

// Middleware now handles redirection for both authenticated and unauthenticated users.
// This page component can potentially render a public landing page if desired,
// or simply return null if the root path should always redirect via middleware.
export default function RootPage() {
  // const { data: { user } } = await supabase.auth.getUser(); // Example if fetching data here
  // if (user) redirect('/dashboard') // Logic moved to middleware

  // Render a basic landing page, or nothing if middleware handles all cases.
  // For now, let's return a simple placeholder.
  return (
    <div className="flex items-center justify-center h-screen">
      <h1 className="text-xl">Root Page</h1>
      {/* Or return null; if middleware truly handles every possible state */}
    </div>
  );
} 