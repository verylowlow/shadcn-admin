import { createFileRoute } from '@tanstack/react-router'
import { NccAgents } from '@/features/ncc-agents'

export const Route = createFileRoute('/_authenticated/agents/')({
  component: NccAgents,
})
