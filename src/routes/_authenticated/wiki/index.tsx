import { createFileRoute } from '@tanstack/react-router'
import { NccWiki } from '@/features/ncc-wiki'

export const Route = createFileRoute('/_authenticated/wiki/')({
  component: NccWiki,
})
