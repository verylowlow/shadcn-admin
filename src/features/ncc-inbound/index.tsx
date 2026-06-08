import { NccPageShell } from '@/components/ncc/page-shell'
import InboundSettingsPage from './inbound-settings-page'

export function NccInbound() {
  return (
    <NccPageShell>
      <InboundSettingsPage />
    </NccPageShell>
  )
}
