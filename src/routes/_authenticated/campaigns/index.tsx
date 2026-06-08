import { createFileRoute } from '@tanstack/react-router'
import { NccCampaigns } from '@/features/ncc-campaigns'

export const Route = createFileRoute('/_authenticated/campaigns/')({
  component: NccCampaigns,
})
