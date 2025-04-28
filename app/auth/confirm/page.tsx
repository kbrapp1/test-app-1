import { Suspense } from 'react'
import ConfirmLogic from './confirm-logic'

// This page wraps the client-side logic in a Suspense boundary
// as required by Next.js when using hooks like useSearchParams.
export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmLogic />
    </Suspense>
  )
}

// Basic fallback component
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Loading...</p>
    </div>
  )
} 