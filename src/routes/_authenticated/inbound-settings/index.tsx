import { createFileRoute } from '@tanstack/react-router'
import { NccInbound } from '@/features/ncc-inbound'

export const Route = createFileRoute('/_authenticated/inbound-settings/')({
  component: NccInbound,
})
