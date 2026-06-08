import { createFileRoute } from '@tanstack/react-router'
import { NccCampaignDetail } from '@/features/ncc-campaigns/campaign-detail-index'

export const Route = createFileRoute('/_authenticated/campaigns/$id')({
  component: NccCampaignDetail,
})
