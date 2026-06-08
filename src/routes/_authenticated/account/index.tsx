import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { NccAccount } from '@/features/ncc-account'
import { useCloudAuthStore } from '@/stores/cloud-auth-store'

export const Route = createFileRoute('/_authenticated/account/')({
  component: function AccountRoute() {
    const bootstrap = useCloudAuthStore((s) => s.bootstrap)
    useEffect(() => {
      void bootstrap()
    }, [bootstrap])
    return <NccAccount />
  },
})
