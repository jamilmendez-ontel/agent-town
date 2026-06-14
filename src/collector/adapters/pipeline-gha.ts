import type { RawEvent } from '../../shared/types'

// Maps GitHub repo -> town project.
const REPOS: Record<string, string> = {
  'jamilmendez-ontel/local-pipeline': 'local-pipeline',
  'jamilmendez-ontel/gmail-scraper': 'gmail-scraper',
}

interface GhaRun { id: number; status: string; conclusion: string | null; repository?: { full_name: string } }

const seen = new Map<number, string>() // runId -> last status we emitted

async function fetchRuns(repo: string, token: string): Promise<GhaRun[]> {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=10`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) throw new Error(`GHA ${repo}: ${res.status}`)
  const data = await res.json() as { workflow_runs: GhaRun[] }
  return data.workflow_runs ?? []
}

// Poll loop. Calls emit(event) for new run state transitions. Errors in one
// repo never stop the loop (adapter isolation).
export function startPipelineGha(emit: (e: RawEvent) => void, opts: { token?: string; intervalMs?: number } = {}) {
  const token = opts.token ?? process.env.GITHUB_TOKEN ?? ''
  const intervalMs = opts.intervalMs ?? 30000
  if (!token) { console.warn('[agent-town] no GITHUB_TOKEN; pipeline-gha adapter idle'); return () => {} }

  let stopped = false
  const tick = async () => {
    for (const [repo, project] of Object.entries(REPOS)) {
      try {
        for (const run of await fetchRuns(repo, token)) {
          const prev = seen.get(run.id)
          const now = Date.now()
          if (run.status !== 'completed' && prev !== 'running') {
            seen.set(run.id, 'running')
            emit({ kind: 'run_start', project, runId: String(run.id), source: 'gha', ts: now })
          } else if (run.status === 'completed' && prev !== 'done') {
            seen.set(run.id, 'done')
            emit(run.conclusion === 'success'
              ? { kind: 'run_success', project, runId: String(run.id), source: 'gha', ts: now }
              : { kind: 'run_fail', project, runId: String(run.id), source: 'gha', ts: now })
          }
        }
      } catch (err) { console.warn('[agent-town] pipeline-gha:', (err as Error).message) }
    }
    if (!stopped) setTimeout(tick, intervalMs)
  }
  tick()
  return () => { stopped = true }
}
