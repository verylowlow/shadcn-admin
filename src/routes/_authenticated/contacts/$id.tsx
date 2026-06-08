import { createFileRoute } from '@tanstack/react-router'
import { NccContactDetail } from '@/features/ncc-contacts/contact-detail-index'

export const Route = createFileRoute('/_authenticated/contacts/$id')({
  component: NccContactDetail,
})
