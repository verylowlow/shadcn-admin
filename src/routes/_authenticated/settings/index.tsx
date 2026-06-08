import { createFileRoute } from '@tanstack/react-router'
import { NccSettings } from '@/features/ncc-settings'

export const Route = createFileRoute('/_authenticated/settings/')({
  component: NccSettings,
})
