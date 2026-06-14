import chokidar from 'chokidar'
import { execFile } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { RawEvent } from '../../shared/types'

const ROOT = 'C:\\Users\\admin\\Desktop\\Projects\\ai-projects'
const IGNORED = new Set(['archive', 'reference', 'docs', 'presentation', 'journal', '.git', 'node_modules'])

function projects(): string[] {
  return readdirSync(ROOT)
    .filter((name) => !name.startsWith('.') && !IGNORED.has(name))
    .filter((name) => { try { return statSync(join(ROOT, name)).isDirectory() } catch { return false } })
}

function projectOf(path: string): string | null {
  const norm = path.replaceAll('/', '\\')
  if (!norm.startsWith(ROOT)) return null
  const rest = norm.slice(ROOT.length).replace(/^\\+/, '')
  const top = rest.split('\\')[0]
  return top && !IGNORED.has(top) ? top : null
}

function lastCommitAge(project: string): Promise<number | null> {
  return new Promise((resolve) => {
    execFile('git', ['-C', join(ROOT, project), 'log', '-1', '--format=%ct'], (err, stdout) => {
      if (err) return resolve(null)
      const secs = Number(stdout.trim())
      resolve(Number.isFinite(secs) ? (Date.now() / 1000 - secs) / 86400 : null) // days
    })
  })
}

// Watches files for edits (debounced) and periodically emits health.
export function startGitWatch(emit: (e: RawEvent) => void, opts: { healthMs?: number; staleDays?: number } = {}) {
  const healthMs = opts.healthMs ?? 120000
  const staleDays = opts.staleDays ?? 14

  const watcher = chokidar.watch(ROOT, {
    ignored: (p: string) => /[\\/](node_modules|\.git|dist|pipeline_logs)[\\/]/.test(p),
    ignoreInitial: true,
    depth: 6,
  })
  const lastEmit = new Map<string, number>()
  watcher.on('all', (_evt, path) => {
    const project = projectOf(path)
    if (!project) return
    const now = Date.now()
    if (now - (lastEmit.get(project) ?? 0) < 3000) return // debounce per project
    lastEmit.set(project, now)
    emit({ kind: 'file_edit', project, path, ts: now })
  })

  const healthTick = async () => {
    for (const project of projects()) {
      const ageDays = await lastCommitAge(project)
      if (ageDays === null) continue
      emit({ kind: 'health', project, status: ageDays > staleDays ? 'stale' : 'healthy', ts: Date.now() })
    }
  }
  healthTick()
  const timer = setInterval(healthTick, healthMs)

  return () => { watcher.close(); clearInterval(timer) }
}
