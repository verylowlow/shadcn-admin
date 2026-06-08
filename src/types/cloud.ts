export type CloudUser = {
  id: string
  login_name: string
  display_name: string
  company: string | null
  phone: string | null
}

export type CloudBilling = {
  amount_cents: number
  paid_at: string
  valid_until: string
  plan_label: string
  account_status: string
}

export type CloudRelease = {
  version: string
  title: string
  changelog: string
  download_url: string
  published_at: string | null
}

export type CloudRenewalPlan = {
  id: string
  name: string
  duration_days: number
  price_display: string
  alipay_qr_url: string | null
  wechat_qr_url: string | null
}

export type CloudSupport = {
  wechat_id: string
  wechat_qr_url: string | null
  hint_text: string
}

export type CloudAccountStatus = {
  account_status: string
  valid_until: string | null
  message: string
  latest_release_version: string | null
  last_reported_version: string | null
}

export type LicenseApplyResult = {
  verify_ok: boolean
  restart_ok: boolean
  message: string
}

export type RuntimeInfo = {
  app_version: string
  license_file: string
  license_expires: string | null
  last_heartbeat: Record<string, unknown> | null
}
