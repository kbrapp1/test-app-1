'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    async function handleSessionFromUrl() {
      setLoading(true)
      // 1) Try tokens in URL hash (implicit recovery flow)
      const hash = typeof window !== 'undefined' ? window.location.hash.substring(1) : ''
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (setSessionError) {
          setError('Invalid or expired link. Please request a new password reset.')
          setLoading(false)
          return
        }
        // clear hash
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
        }
      } else {
        // 2) Try recovery code in query params (admin reset flow)
        const searchParams = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams()
        const code = searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError('Invalid or expired link. Please request a new password reset.')
            setLoading(false)
            return
          }
          // clear code param
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }
      }
      setLoading(false)
    }
    handleSessionFromUrl()
  }, [supabase.auth])

  const validateForm = () => {
    if (!password) return setValidationError('Password is required'), false
    if (password.length < 8) return setValidationError('Password must be at least 8 characters'), false
    if (password !== confirmPassword) return setValidationError('Passwords do not match'), false
    setValidationError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || isComplete) return
    if (!validateForm()) return

    setSubmitting(true)
    setError(null)

    try {
      // update password
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      // complete onboarding membership if needed
      const { data: sessionData, error: sessErr } = await supabase.auth.getSession()
      if (!sessErr && sessionData.session) {
        const { error: funcErr } = await supabase.functions.invoke('complete-onboarding-membership', { headers: { Authorization: `Bearer ${sessionData.session.access_token}` } })
        if (funcErr) throw funcErr
        await supabase.auth.refreshSession()
      }

      setIsComplete(true)
      toast({ title: 'Password Reset', description: 'Your password has been set. Redirecting...' })
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (e: any) {
      setError(e.message || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>
  if (isComplete) return <div className="flex flex-col items-center justify-center min-h-screen"><CheckCircle className="h-8 w-8 text-green-500 mb-4"/><p>Password reset successful! Redirecting...</p></div>

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>Enter a new password to complete your account setup.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
          {validationError && <Alert variant="destructive"><AlertCircle className="h-4 w-4"/><AlertTitle>Validation Error</AlertTitle><AlertDescription>{validationError}</AlertDescription></Alert>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
            <div><Label>Confirm Password</Label><Input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={submitting}>{submitting? <Loader2 className="animate-spin"/>:'Set Password'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 