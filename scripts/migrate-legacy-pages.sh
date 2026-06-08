#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LEG="$ROOT/_legacy-next/src/app/(app)"
OUT="$ROOT/src/features"

migrate_file() {
  local src="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  sed -e '/^"use client";$/d' \
    -e 's|from "next/link"|from "@tanstack/react-router"|g' \
    -e 's|from "next/navigation"|from "@tanstack/react-router"|g' \
    -e 's|@/components/|@/components/ncc/|g' \
    -e 's|<Link href=\([^>]*\)>|<Link to=\1>|g' \
    "$src" > "$dest"
  sed -i 's/useRouter/useNavigate/g; s/router\.replace/navigate/g; s/router\.push/navigate/g' "$dest" 2>/dev/null || \
    sed -i '' 's/useRouter/useNavigate/g' "$dest"
}

migrate_file "$LEG/dashboard/page.tsx" "$OUT/ncc-overview/overview-page.tsx"
migrate_file "$LEG/contacts/page.tsx" "$OUT/ncc-contacts/contacts-page.tsx"
migrate_file "$LEG/tags/page.tsx" "$OUT/ncc-contacts/tags-page.tsx"
migrate_file "$LEG/campaigns/page.tsx" "$OUT/ncc-campaigns/campaigns-page.tsx"
migrate_file "$LEG/campaigns/new/page.tsx" "$OUT/ncc-campaigns/campaign-new-page.tsx"
migrate_file "$LEG/calls/page.tsx" "$OUT/ncc-calls/calls-page.tsx"
migrate_file "$LEG/calls/[id]/call-detail.tsx" "$OUT/ncc-calls/call-detail-page.tsx"
migrate_file "$LEG/contacts/[id]/contact-detail.tsx" "$OUT/ncc-contacts/contact-detail-page.tsx"
migrate_file "$LEG/campaigns/[id]/campaign-detail.tsx" "$OUT/ncc-campaigns/campaign-detail-page.tsx"
migrate_file "$LEG/templates/[id]/template-detail.tsx" "$OUT/ncc-templates/template-detail-page.tsx"
migrate_file "$LEG/wiki/page.tsx" "$OUT/ncc-wiki/wiki-page.tsx"
migrate_file "$LEG/templates/page.tsx" "$OUT/ncc-templates/templates-page.tsx"
migrate_file "$LEG/agents/page.tsx" "$OUT/ncc-agents/agents-page.tsx"
migrate_file "$LEG/inbound-settings/page.tsx" "$OUT/ncc-inbound/inbound-settings-page.tsx"
migrate_file "$LEG/settings/page.tsx" "$OUT/ncc-settings/settings-page.tsx"
echo "Migrated pages to $OUT"
