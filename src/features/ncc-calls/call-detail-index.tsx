import { NccPageShell } from '@/components/ncc/page-shell'
import { CallDetailClient } from './call-detail-page'

export function NccCallDetail() {
  return (
    <NccPageShell>
      <CallDetailClient />
    </NccPageShell>
  )
}
