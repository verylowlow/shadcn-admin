import { create } from 'zustand'
import {
  clearStoredAuth,
  getStoredAuth,
  getStoredUsername,
  probeAnonymousAccess,
  setStoredAuth,
  verifyAuth,
} from '@/lib/api-client'

interface NccAuthState {
  username: string | null
  isLoading: boolean
  isAuthenticated: boolean
  bootstrap: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const useNccAuthStore = create<NccAuthState>((set) => ({
  username: null,
  isLoading: true,
  isAuthenticated: false,
  bootstrap: async () => {
    set({ isLoading: true })
    const stored = getStoredAuth()
    if (stored) {
      const name = getStoredUsername()
      const ok = await verifyAuth()
      if (!ok) {
        clearStoredAuth()
        set({ username: null, isAuthenticated: false, isLoading: false })
        return
      }
      set({ username: name ?? 'admin', isAuthenticated: true, isLoading: false })
      return
    }
    const anonymousOk = await verifyAuth()
    set({
      username: anonymousOk ? 'admin' : null,
      isAuthenticated: anonymousOk,
      isLoading: false,
    })
  },
  login: async (username: string, password: string) => {
    if (!password.trim()) {
      const anon = await probeAnonymousAccess()
      if (anon) {
        clearStoredAuth()
        set({ username: username || 'admin', isAuthenticated: true })
        return
      }
    }
    setStoredAuth(username, password)
    const ok = await verifyAuth()
    if (!ok) {
      clearStoredAuth()
      throw new Error(
        '用户名或密码错误。若已在 .env 设置 NEWCALLCALL_ADMIN_BASIC_PASS，请填写该密码。',
      )
    }
    set({ username, isAuthenticated: true })
  },
  logout: () => {
    clearStoredAuth()
    set({ username: null, isAuthenticated: false })
  },
}))

export function nccIsAuthenticated(): boolean {
  return Boolean(getStoredAuth()) || useNccAuthStore.getState().isAuthenticated
}
