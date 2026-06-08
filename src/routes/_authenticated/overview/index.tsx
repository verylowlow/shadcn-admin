import { createFileRoute } from '@tanstack/react-router'
import { NccOverview } from '@/features/ncc-overview'

export const Route = createFileRoute('/_authenticated/overview/')({
  component: NccOverview,
})
