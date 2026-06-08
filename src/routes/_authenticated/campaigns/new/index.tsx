import { createFileRoute } from '@tanstack/react-router'
import { NccCampaignNew } from '@/features/ncc-campaigns/campaign-new-index'

export const Route = createFileRoute('/_authenticated/campaigns/new/')({
  component: NccCampaignNew,
})
