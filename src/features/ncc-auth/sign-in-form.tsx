import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNccAuthStore } from '@/stores/ncc-auth-store'

type NccSignInFormProps = {
  redirectTo?: string
}

export function NccSignInForm({ redirectTo }: NccSignInFormProps) {
  const navigate = useNavigate()
  const login = useNccAuthStore((s) => s.login)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      if (redirectTo) {
        window.location.href = redirectTo
      } else {
        navigate({ to: '/overview' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='username'>用户名</Label>
        <Input
          id='username'
          autoComplete='username'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='password'>密码</Label>
        <Input
          id='password'
          type='password'
          autoComplete='current-password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <p className='text-sm text-destructive' role='alert'>
          {error}
        </p>
      )}
      <Button type='submit' className='w-full' disabled={loading}>
        {loading ? (
          <>
            <Loader2 className='me-2 size-4 animate-spin' />
            登录中…
          </>
        ) : (
          '登录'
        )}
      </Button>
    </form>
  )
}
