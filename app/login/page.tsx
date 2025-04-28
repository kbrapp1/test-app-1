import { LoginForm } from '@/components/auth/login-form'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <Image
          src="/ironmark-logo.png"
          alt="Ironmark USA Logo"
          width={200}
          height={50}
          priority
        />
      </div>
      <LoginForm />
    </div>
  )
} 