import { create } from 'zustand'
import {
  clearCloudToken,
  cloudFetch,
  getCloudToken,
  setCloudToken,
  type CloudAuthError,
} from '@/lib/cloud-api-client'
import type { CloudUser } from '@/types/cloud'

type CloudAuthState = {
  user: CloudUser | null
  isLoading: boolean
  bootstrap: () => Promise<void>
  login: (loginName: string, password: string) => Promise<void>
  logout: () => void
}

export const useCloudAuthStore = create<CloudAuthState>((set) => ({
  user: null,
  isLoading: true,
  bootstrap: async () => {
    set({ isLoading: true })
    if (!getCloudToken()) {
      set({ user: null, isLoading: false })
      return
    }
    try {
      const user = await cloudFetch<CloudUser>('/auth/me')
      set({ user, isLoading: false })
    } catch {
      clearCloudToken()
      set({ user: null, isLoading: false })
    }
  },
  login: async (loginName, password) => {
    const data = await cloudFetch<{
      access_token: string
      user: CloudUser
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login_name: loginName, password }),
    })
    setCloudToken(data.access_token)
    set({ user: data.user })
  },
  logout: () => {
    clearCloudToken()
    set({ user: null })
  },
}))

export function cloudIsAuthenticated(): boolean {
  return Boolean(getCloudToken())
}

export function isCloudAuthError(e: unknown): e is CloudAuthError {
  return e instanceof Error && e.name === 'CloudAuthError'
}
