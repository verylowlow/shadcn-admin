import { createFileRoute } from '@tanstack/react-router'
import { NccTags } from '@/features/ncc-contacts/tags-index'

export const Route = createFileRoute('/_authenticated/contacts/tags/')({
  component: NccTags,
})
