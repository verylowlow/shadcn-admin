import { createFileRoute } from '@tanstack/react-router'
import { NccTemplates } from '@/features/ncc-templates'

export const Route = createFileRoute('/_authenticated/templates/')({
  component: NccTemplates,
})
