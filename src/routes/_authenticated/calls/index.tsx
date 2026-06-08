import { createFileRoute } from '@tanstack/react-router'
import { NccCalls } from '@/features/ncc-calls'

export const Route = createFileRoute('/_authenticated/calls/')({
  component: NccCalls,
})
