import { useMutation, useQuery } from '@tanstack/react-query'
import { cloudFetch, localApiFetch } from '@/lib/cloud-api-client'
import type {
  CloudAccountStatus,
  CloudBilling,
  CloudRelease,
  CloudRenewalPlan,
  CloudSupport,
  LicenseApplyResult,
  RuntimeInfo,
} from '@/types/cloud'

export function useCloudBilling() {
  return useQuery({
    queryKey: ['cloud', 'billing'],
    queryFn: () => cloudFetch<CloudBilling>('/account/billing'),
  })
}

export function useCloudStatus() {
  return useQuery({
    queryKey: ['cloud', 'status'],
    queryFn: () => cloudFetch<CloudAccountStatus>('/account/status'),
  })
}

export function useCloudReleases() {
  return useQuery({
    queryKey: ['cloud', 'releases'],
    queryFn: () => cloudFetch<CloudRelease[]>('/releases'),
  })
}

export function useCloudPlans() {
  return useQuery({
    queryKey: ['cloud', 'plans'],
    queryFn: () => cloudFetch<CloudRenewalPlan[]>('/renewal/plans'),
  })
}

export function useCloudSupport() {
  return useQuery({
    queryKey: ['cloud', 'support'],
    queryFn: () => cloudFetch<CloudSupport>('/support'),
  })
}

export function useRuntimeInfo(enabled: boolean) {
  return useQuery({
    queryKey: ['edge', 'runtime'],
    queryFn: () => localApiFetch<RuntimeInfo>('/account/runtime'),
    enabled,
  })
}

export function useApplyLicense() {
  return useMutation({
    mutationFn: () =>
      localApiFetch<LicenseApplyResult>('/account/license/apply', {
        method: 'POST',
      }),
  })
}
