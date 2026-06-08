import { NccPageShell } from '@/components/ncc/page-shell'
import DashboardPage from './overview-page'

export function NccOverview() {
  return (
    <NccPageShell>
      <DashboardPage />
    </NccPageShell>
  )
}
