import { createFileRoute } from '@tanstack/react-router'
import { NccTemplateDetail } from '@/features/ncc-templates/template-detail-index'

export const Route = createFileRoute('/_authenticated/templates/$id')({
  component: NccTemplateDetail,
})
