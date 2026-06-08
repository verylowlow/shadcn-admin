import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { NccSignInForm } from '@/features/ncc-auth/sign-in-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            NewCallCall 管理端
          </CardTitle>
          <CardDescription>
            使用 HTTP Basic 凭证登录。仅当后端{' '}
            <code className='text-xs'>NEWCALLCALL_ADMIN_BASIC_PASS</code>{' '}
            为空时可留空密码；若已在 <code className='text-xs'>.env</code>{' '}
            中设置密码，须填写正确密码。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NccSignInForm redirectTo={redirect} />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
