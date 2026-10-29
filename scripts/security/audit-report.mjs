// Wraps `npm audit --json` so the output always has severity, what it affects and
// how to fix it, and so CI can choose "fail" or "warn only" per run.
//
//   node scripts/security/audit-report.mjs [--omit-dev] [--level high] [--warn-only]
//
// Exit code: 0 ok (or warn-only), 1 findings at or above --level, 2 audit could not run.
import { spawnSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'

const ORDER = ['info', 'low', 'moderate', 'high', 'critical']
const args = process.argv.slice(2)
const omitDev = args.includes('--omit-dev')
const warnOnly = args.includes('--warn-only')
const levelIdx = args.indexOf('--level')
const level = levelIdx >= 0 ? args[levelIdx + 1] : 'high'
if (!ORDER.includes(level)) {
  console.error(`Unknown --level "${level}". Use one of: ${ORDER.join(', ')}`)
  process.exit(2)
}

const npmArgs = ['audit', '--json']
if (omitDev) npmArgs.push('--omit=dev')
const run = spawnSync('npm', npmArgs, {
  encoding: 'utf8',
  shell: process.platform === 'win32',
  maxBuffer: 64 * 1024 * 1024,
})

let report
try {
  report = JSON.parse(run.stdout)
} catch {
  console.error('npm audit did not return JSON (offline or registry problem?). Re-run the job.')
  console.error((run.stderr || '').trim().split('\n').slice(0, 5).join('\n'))
  process.exit(2)
}
if (report.error) {
  console.error(`npm audit failed: ${report.error.code || ''} ${report.error.summary || ''}`.trim())
  process.exit(2)
}

const scope = omitDev ? 'production dependencies' : 'all dependencies (incl. dev tooling)'
const rank = (s) => ORDER.indexOf(s)
const vulns = Object.values(report.vulnerabilities || {}).sort((a, b) => rank(b.severity) - rank(a.severity))

function fixHint(v) {
  const f = v.fixAvailable
  if (f === true) return 'run `npm audit fix` (updates package-lock.json within the allowed ranges)'
  if (f && typeof f === 'object') {
    const major = f.isSemVerMajor ? ' (semver-major, check the changelog and run the tests)' : ''
    return `upgrade to ${f.name}@${f.version}${major}`
  }
  return 'no fix published yet: check the advisory for a workaround, or replace/pin the package'
}

const lines = []
let blocking = 0
for (const v of vulns) {
  const hit = rank(v.severity) >= rank(level)
  if (hit) blocking++
  const advisories = (v.via || []).filter((x) => typeof x === 'object')
  const viaPkgs = (v.via || []).filter((x) => typeof x === 'string')
  lines.push(`${hit ? '*' : ' '} [${v.severity.toUpperCase()}] ${v.name}  (${v.isDirect ? 'direct' : 'transitive'}, affected ${v.range})`)
  for (const a of advisories) lines.push(`      ${a.title}\n      ${a.url}`)
  if (viaPkgs.length) lines.push(`      comes in through: ${viaPkgs.join(', ')}`)
  lines.push(`      fix: ${fixHint(v)}`)
}

const t = report.metadata?.vulnerabilities || {}
const counts = ORDER.slice().reverse().map((s) => `${t[s] || 0} ${s}`).join(', ')
console.log(`npm audit, ${scope}: ${counts}`)
if (lines.length) console.log(`(* = at or above "${level}")\n${lines.join('\n')}`)

if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [`### npm audit: ${scope}`, '', `${counts}`, '']
  for (const v of vulns) md.push(`- **${v.severity}** \`${v.name}\`: ${fixHint(v)}`)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n') + '\n')
}

if (blocking === 0) {
  console.log(`OK: nothing at "${level}" or above in ${scope}.`)
  process.exit(0)
}
if (warnOnly) {
  console.log(`::warning title=npm audit (${scope})::${blocking} finding(s) at "${level}" or above. Report only, not blocking. See the job log for severity and fix.`)
  process.exit(0)
}
console.log(`::error title=npm audit (${scope})::${blocking} finding(s) at "${level}" or above. See the job log for severity and fix.`)
process.exit(1)
