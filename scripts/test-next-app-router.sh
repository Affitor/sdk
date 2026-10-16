#!/usr/bin/env bash
# Builds a fresh Next.js App Router app whose root layout renders <AffitorProvider> directly (the
# dashboard's npm snippet, verbatim) against the SDK packed from this checkout. Exit 0 = the build passes.
# Needs network for next/react. Usage: bash scripts/test-next-app-router.sh
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
(cd "$ROOT" && npm run build >/dev/null && npm pack --silent >/dev/null) || { echo "sdk build/pack failed"; exit 2; }
TGZ="$ROOT/$(cd "$ROOT" && ls -t affitor-sdk-*.tgz | head -1)"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT; cd "$T" || exit 2
echo '{ "name": "affitor-next-app-router-test", "private": true }' > package.json
npm install next@16.3.8 react@19.3.0 react-dom@19.3.0 "$TGZ" --ignore-scripts --no-audit --no-fund >/dev/null 2>&1 || { echo "npm install failed"; exit 2; }
mkdir app
cat > app/layout.jsx <<'SNIP'
import { AffitorProvider } from '@affitor/sdk/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AffitorProvider programId="58">{children}</AffitorProvider>
      </body>
    </html>
  );
}
SNIP
echo 'export default function Page() { return <main>hello</main>; }' > app/page.jsx
NEXT_TELEMETRY_DISABLED=1 npx --no-install next build > build.log 2>&1; code=$?
grep -m1 "createContext" build.log || true
echo "next build exit=$code"
[ "$code" -ne 0 ] && tail -20 build.log
rm -f "$TGZ"
exit $code
