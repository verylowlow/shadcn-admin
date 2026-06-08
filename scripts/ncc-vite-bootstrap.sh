#!/bin/bash
# One-shot bootstrap after copying shadcn-admin + _legacy-next
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LEG="$ROOT/_legacy-next"

cp -r "$LEG/src/types" "$ROOT/src/"
cp "$LEG/src/lib/api-client.ts" "$LEG/src/lib/queries.ts" "$LEG/src/lib/constants.ts" \
  "$LEG/src/lib/call-format.ts" "$LEG/src/lib/agent-display.ts" \
  "$LEG/src/lib/agent-profile-config.ts" "$LEG/src/lib/status-badges.tsx" "$ROOT/src/lib/"
cp "$LEG/src/hooks/use-call-events.ts" "$ROOT/src/hooks/"
mkdir -p "$ROOT/src/components/ncc"
for f in page-header loading-state status-badge pagination call-audio-player \
  static-clips-panel agent-profile-form-fields; do
  cp "$LEG/src/components/$f.tsx" "$ROOT/src/components/ncc/" 2>/dev/null || true
done

bash "$ROOT/scripts/migrate-legacy-pages.sh"

find "$ROOT/src/features" -path '*/ncc-*' -name '*.tsx' -exec sed -i \
  -e 's|@/components/ncc/ui/|@/components/ui/|g' \
  -e 's|import Link from "@tanstack/react-router"|import { Link } from "@tanstack/react-router"|g' \
  -e 's|href={`/contacts/|to={`/contacts/|g' \
  -e 's|href={`/calls/|to={`/calls/|g' \
  -e 's|href={`/campaigns/|to={`/campaigns/|g' \
  -e 's|href={`/templates/|to={`/templates/|g' \
  -e 's|href="/contacts|to="/contacts|g' \
  -e 's|href="/calls|to="/calls|g' \
  -e 's|href="/campaigns|to="/campaigns|g' \
  -e 's|href="/templates|to="/templates|g' \
  -e 's|to="/dashboard|to="/overview|g' \
  {} \;

echo "Bootstrap file copy done."
