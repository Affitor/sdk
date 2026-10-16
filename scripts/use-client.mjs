// Marks the React entry as a Client Component module for frameworks with Server Components
// (Next.js App Router): tsup has no per-entry banner, so the directive is prepended after the build.
import { readFileSync, writeFileSync } from 'node:fs';

const DIRECTIVE = '"use client";\n';
for (const file of ['dist/react.js', 'dist/react.mjs']) {
  const code = readFileSync(file, 'utf8');
  if (!code.startsWith('"use client"')) writeFileSync(file, DIRECTIVE + code);
}
