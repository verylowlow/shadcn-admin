import { createFileRoute } from '@tanstack/react-router'
import { NccCallDetail } from '@/features/ncc-calls/call-detail-index'

export const Route = createFileRoute('/_authenticated/calls/$id')({
  component: NccCallDetail,
})
