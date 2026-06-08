const CLOUD_BASE =
  import.meta.env.VITE_CLOUD_API_BASE || 'https://tokendance.run/api/v1'

const TOKEN_KEY = 'ncc_cloud_token'

export class CloudAuthError extends Error {
  constructor(message = '云账号未登录') {
    super(message)
    this.name = 'CloudAuthError'
  }
}

export function getCloudToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setCloudToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearCloudToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function cloudFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getCloudToken()
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${CLOUD_BASE}${path}`, { ...init, headers })
  if (res.status === 401) {
    throw new CloudAuthError()
  }
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body.detail) detail = String(body.detail)
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}

export async function localApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const apiBase = import.meta.env.VITE_API_BASE || '/admin/api'
  const token = getCloudToken()
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${apiBase}${path}`, { ...init, headers })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body.detail) detail = String(body.detail)
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}
