import { useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ncc/page-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useApplyLicense,
  useCloudBilling,
  useCloudPlans,
  useCloudReleases,
  useCloudStatus,
  useCloudSupport,
  useRuntimeInfo,
} from '@/lib/cloud-queries'
import { useCloudAuthStore } from '@/stores/cloud-auth-store'

function CloudLoginForm() {
  const login = useCloudAuthStore((s) => s.login)
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(loginName, password)
      toast.success('登录成功')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className='max-w-md'>
      <CardHeader>
        <CardTitle>云账号登录</CardTitle>
        <CardDescription>
          个人中心需使用厂商开通的云账号。无自助注册，请联系厂商获取账号。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='login_name'>登录名</Label>
            <Input
              id='login_name'
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              autoComplete='username'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='cloud_password'>密码</Label>
            <Input
              id='cloud_password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete='current-password'
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
      </CardContent>
    </Card>
  )
}

function AccountDashboard() {
  const user = useCloudAuthStore((s) => s.user)!
  const logout = useCloudAuthStore((s) => s.logout)
  const billing = useCloudBilling()
  const status = useCloudStatus()
  const releases = useCloudReleases()
  const plans = useCloudPlans()
  const support = useCloudSupport()
  const runtime = useRuntimeInfo(true)
  const applyLicense = useApplyLicense()

  async function onApplyLicense() {
    try {
      const res = await applyLicense.mutateAsync()
      if (res.verify_ok && res.restart_ok) {
        toast.success(res.message)
      } else if (res.verify_ok) {
        toast.warning(res.message)
      } else {
        toast.error(res.message)
      }
      void runtime.refetch()
      void status.refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p className='text-sm text-muted-foreground'>已登录</p>
          <p className='font-medium'>
            {user.display_name}（{user.login_name}）
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={() => logout()}>
          退出云账号
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>授权状态</CardTitle>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {status.isLoading && <p>加载中…</p>}
          {status.data && (
            <>
              <p>
                状态：
                <span className='font-medium'>{status.data.account_status}</span>
              </p>
              <p>{status.data.message}</p>
              {status.data.valid_until && (
                <p>到期日：{status.data.valid_until}</p>
              )}
            </>
          )}
          <Button
            onClick={onApplyLicense}
            disabled={applyLicense.isPending}
            className='mt-2'
          >
            {applyLicense.isPending ? (
              <>
                <Loader2 className='me-2 size-4 animate-spin' />
                更新中…
              </>
            ) : (
              <>
                <RefreshCw className='me-2 size-4' />
                更新鉴权到本机并重启服务
              </>
            )}
          </Button>
          <p className='text-xs text-muted-foreground'>
            将从云端下载当前 license.lic 写入本机并执行 systemctl restart ncc
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近付费</CardTitle>
        </CardHeader>
        <CardContent className='text-sm'>
          {billing.isLoading && <p>加载中…</p>}
          {billing.error && (
            <p className='text-muted-foreground'>暂无付费记录</p>
          )}
          {billing.data && (
            <ul className='space-y-1'>
              <li>套餐：{billing.data.plan_label || '—'}</li>
              <li>
                金额：¥{(billing.data.amount_cents / 100).toFixed(2)}
              </li>
              <li>付费日：{billing.data.paid_at}</li>
              <li>到期日：{billing.data.valid_until}</li>
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>版本</CardTitle>
          <CardDescription>本机版本与云端发布列表</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2 text-sm'>
          {runtime.data && (
            <p>
              本机版本：<strong>{runtime.data.app_version}</strong>
              {runtime.data.license_expires && (
                <> · 本地 license 到期 {runtime.data.license_expires}</>
              )}
            </p>
          )}
          {releases.data?.length ? (
            <ul className='list-disc ps-5 space-y-1'>
              {releases.data.map((r) => (
                <li key={r.version}>
                  <a
                    href={r.download_url}
                    target='_blank'
                    rel='noreferrer'
                    className='text-primary underline'
                  >
                    {r.version}
                  </a>
                  {r.title ? ` — ${r.title}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground'>暂无发布版本</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>续费套餐</CardTitle>
          <CardDescription>扫码支付后请联系客服开通</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          {plans.data?.map((p) => (
            <div key={p.id} className='rounded-lg border p-4 space-y-2'>
              <p className='font-medium'>{p.name}</p>
              <p className='text-sm'>{p.price_display}</p>
              <div className='flex flex-wrap gap-2 text-xs'>
                {p.alipay_qr_url && (
                  <a
                    href={p.alipay_qr_url}
                    target='_blank'
                    rel='noreferrer'
                    className='text-primary underline'
                  >
                    支付宝收款码
                  </a>
                )}
                {p.wechat_qr_url && (
                  <a
                    href={p.wechat_qr_url}
                    target='_blank'
                    rel='noreferrer'
                    className='text-primary underline'
                  >
                    微信收款码
                  </a>
                )}
              </div>
            </div>
          ))}
          {!plans.data?.length && (
            <p className='text-sm text-muted-foreground'>暂无套餐配置</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>客服</CardTitle>
        </CardHeader>
        <CardContent className='text-sm space-y-2'>
          {support.data && (
            <>
              <p>微信号：{support.data.wechat_id || '—'}</p>
              <p>{support.data.hint_text}</p>
              {support.data.wechat_qr_url && (
                <a
                  href={support.data.wechat_qr_url}
                  target='_blank'
                  rel='noreferrer'
                  className='text-primary underline'
                >
                  查看客服二维码
                </a>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function AccountPage() {
  const user = useCloudAuthStore((s) => s.user)
  const isLoading = useCloudAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className='flex items-center gap-2 text-muted-foreground'>
        <Loader2 className='size-4 animate-spin' />
        加载中…
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='个人中心'
        description='云账号、授权、续费与版本信息'
      />
      {user ? <AccountDashboard /> : <CloudLoginForm />}
    </div>
  )
}
