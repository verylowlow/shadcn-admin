import { createFileRoute } from '@tanstack/react-router'
import { NccContacts } from '@/features/ncc-contacts'

export const Route = createFileRoute('/_authenticated/contacts/')({
  component: NccContacts,
})
