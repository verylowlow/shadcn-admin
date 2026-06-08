export const API_BASE =
  import.meta.env.VITE_API_BASE?.replace(/\/$/, '') ?? '/admin/api'

export class AuthError extends Error {
  constructor(message = "未授权，请重新登录") {
    super(message);
    this.name = "AuthError";
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  static async fromResponse(res: Response): Promise<ApiError> {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }
    const msg = ApiError.messageFromBody(body, res.statusText || `HTTP ${res.status}`);
    return new ApiError(res.status, msg, body);
  }

  static messageFromBody(body: unknown, fallback: string): string {
    if (typeof body === "string" && body.trim()) {
      return body.trim();
    }
    if (typeof body !== "object" || body === null) {
      return fallback;
    }
    const record = body as Record<string, unknown>;
    const detail = record.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail)) {
      const parts = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return null;
        })
        .filter(Boolean);
      if (parts.length > 0) return parts.join("；");
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    return fallback;
  }
}

export function getStoredAuth(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("ncc_basic_auth");
}

export function setStoredAuth(username: string, password: string): void {
  const token = btoa(`${username}:${password}`);
  sessionStorage.setItem("ncc_basic_auth", token);
  sessionStorage.setItem("ncc_username", username);
}

export function clearStoredAuth(): void {
  sessionStorage.removeItem("ncc_basic_auth");
  sessionStorage.removeItem("ncc_username");
}

export function getStoredUsername(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("ncc_username");
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const auth = getStoredAuth();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (auth) {
    headers.set("Authorization", `Basic ${auth}`);
  }
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    throw new AuthError();
  }
  if (!res.ok) {
    throw await ApiError.fromResponse(res);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function verifyAuth(): Promise<boolean> {
  try {
    await apiFetch<Record<string, unknown>>("/settings");
    return true;
  } catch (e) {
    if (e instanceof AuthError) {
      // 无 Authorization 再试一次（后端未设 ADMIN_BASIC_PASS 时放行）
      try {
        const prev = getStoredAuth();
        sessionStorage.removeItem("ncc_basic_auth");
        await apiFetch<Record<string, unknown>>("/settings");
        if (prev) sessionStorage.setItem("ncc_basic_auth", prev);
        return true;
      } catch {
        return false;
      }
    }
    // 网络错误 / 后端未启动
    return false;
  }
}

/** 是否允许无密码登录（仅当后端未配置 ADMIN_BASIC_PASS） */
export async function probeAnonymousAccess(): Promise<boolean> {
  const prev = getStoredAuth();
  sessionStorage.removeItem("ncc_basic_auth");
  try {
    await apiFetch<Record<string, unknown>>("/settings");
    return true;
  } catch {
    return false;
  } finally {
    if (prev) sessionStorage.setItem("ncc_basic_auth", prev);
    else sessionStorage.removeItem("ncc_basic_auth");
  }
}
