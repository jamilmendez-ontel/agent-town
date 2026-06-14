export interface Building {
  project: string
  label: string
  gx: number // grid column
  gy: number // grid row
  color: number // placeholder fill until real art (Task 16)
}

export const GRID = { cols: 5, rows: 4, cell: 160 } // px per cell

// One building per real monorepo project. gx/gy are unique grid cells.
export const TOWN: Building[] = [
  { project: 'local-pipeline',   label: 'Pipeline Hall',     gx: 0, gy: 0, color: 0x3b5b6e },
  { project: 'quote-automation', label: 'Quote Market',      gx: 1, gy: 0, color: 0x6e4b3b },
  { project: 'date-validator',   label: 'Scrying Tower',     gx: 2, gy: 0, color: 0x4b3b6e },
  { project: 'gc-asset-lake',    label: 'Asset Mine',        gx: 3, gy: 0, color: 0x3b6e4f },
  { project: 'gmail-scraper',    label: 'Post Office',       gx: 4, gy: 0, color: 0x6e6b3b },
  { project: 'report-automation',label: 'Press House',       gx: 0, gy: 1, color: 0x5b6e3b },
  { project: 'portal',           label: 'Town Hall',         gx: 1, gy: 1, color: 0x6e3b5b },
  { project: 'pipeline-guardian',label: 'Watchtower',        gx: 2, gy: 1, color: 0x3b6e6e },
  { project: 'local-ai-agent',   label: 'Oracle Den',        gx: 3, gy: 1, color: 0x5b3b6e },
  { project: 'rfds-extractor',   label: 'Archive',           gx: 4, gy: 1, color: 0x6e5b3b },
  { project: 'swift_pdf_extractor', label: 'Scriptorium',    gx: 0, gy: 2, color: 0x3b4b6e },
  { project: 'daily-claude-digest', label: 'Herald Post',    gx: 1, gy: 2, color: 0x4b6e3b },
  { project: 'data-analyst-reporting-agent', label: 'Counting House', gx: 2, gy: 2, color: 0x6e3b3b },
  { project: 'career-development', label: 'Guild Hall',       gx: 3, gy: 2, color: 0x3b6e5b },
  { project: 'journal',          label: 'Chronicle',         gx: 4, gy: 2, color: 0x5b5b6e },
]

const byProject = new Map(TOWN.map((b) => [b.project, b]))
export function buildingFor(project: string): Building | undefined {
  return byProject.get(project)
}
