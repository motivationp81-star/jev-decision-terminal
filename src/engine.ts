/* Simulation engine — ALL data on this dashboard is simulated.
   Nothing here is a real market feed or a real decision system. */

export interface CaseDef {
  name: string;
  sub: string;
  color: string;
  confidence: number;
}

export const CASES: CaseDef[] = [
  { name: 'EMAIL TRIAGE',    sub: 'Choice · folder — phishing 0.97 — quarantine — mail moved · LLM never woke', color: '#ff2a3c', confidence: 0.97 },
  { name: 'YOUTUBE COMMENT', sub: 'Noul · worth_reply — yes 0.91 — draft reply — review folder',               color: '#9dff00', confidence: 0.91 },
  { name: 'INBOUND LEAD',    sub: 'Score · lead_quality — high 0.89 — book_call — calendar link sent',          color: '#ffb400', confidence: 0.89 },
  { name: 'BROWSER AGENT',   sub: 'Choice · action — type_destination 0.94 — code clicks — progress saved',     color: '#19d7ff', confidence: 0.94 },
  { name: 'X FEED POST',     sub: 'Score · viral_fit — high 0.92 — draft_short — review folder · you hit Post', color: '#ff2e88', confidence: 0.92 },
  { name: 'SUPPORT TICKET',  sub: 'Score · urgency — critical 0.71 — gate HOLD — human gate · ask',             color: '#8b5cff', confidence: 0.71 },
];

export const THEMES: { id: string; label: string; color: string | null }[] = [
  { id: 'auto',   label: 'AUTO CYCLE', color: null },
  { id: 'green',  label: 'GREEN',  color: '#39ff39' },
  { id: 'pink',   label: 'PINK',   color: '#ff2e88' },
  { id: 'cyan',   label: 'CYAN',   color: '#19d7ff' },
  { id: 'purple', label: 'PURPLE', color: '#8b5cff' },
  { id: 'gold',   label: 'GOLD',   color: '#ffb400' },
  { id: 'red',    label: 'RED',    color: '#ff2a3c' },
];

/* Node label pools — names + the tiny right-hand microtext seen in the reference */
export const LABELS: { name: string; micro: string[] }[] = [
  { name: 'email',              micro: ['subject', 'sender'] },
  { name: 'comment',            micro: ['how did you wire…', '48 systems'] },
  { name: 'lead · DM',          micro: ['inbound', 'mentions', '2 weeks'] },
  { name: 'DOM state',          micro: ['flight + $400', '5 viable', 'null'] },
  { name: 'post',               micro: ['48 238', 'true', '$ 600'] },
  { name: 'ticket',             micro: ['enterprise', 'billing', '3'] },
  { name: 'goal',               micro: ['target', 'set'] },
  { name: 'Choice · folder',    micro: ['phishing', '0.97'] },
  { name: 'Noul · worth_reply', micro: ['yes / no', 'attached', 'creator'] },
  { name: 'Score · lead_quality', micro: ['labels', 'ordered', 'true 0.85'] },
  { name: 'Choice · action',    micro: ['legal only', 'every click', '5'] },
  { name: 'Score · viral_fit',  micro: ['low — high', '5k views', 'content'] },
  { name: 'Score · urgency',    micro: ['critical', 'routed'] },
  { name: 'Choice · next_worker', micro: ['handoff', 'ready'] },
  { name: 'choice head',        micro: ['one label', 'none'] },
  { name: 'parallel questions', micro: ['same state', '3 answers'] },
  { name: 'gate ≥ 0.85',        micro: ['starting', 'now'] },
  { name: 'no generation',      micro: ['chat', 'output', 'tokens out'] },
  { name: 'state encoder',      micro: ['JSON-ish', '~1k', 'packed'] },
  { name: 'score head',         micro: ['ordered', '0.91', 'none'] },
  { name: 'median latency',     micro: ['~256 ms', 'public', 'no'] },
  { name: 'noul head',          micro: ['under — human'] },
  { name: 'quarantine',         micro: ['phishing', 'held'] },
  { name: 'draft reply',        micro: ['writer', 'worth it', 'the gate'] },
  { name: 'book_call',          micro: ['high', 'nurture', 'calendar'] },
  { name: 'type_destination',   micro: ['picked by', 'typed by'] },
  { name: 'draft_short',        micro: ['small', 'model', 'submit'] },
  { name: 'mail moved',         micro: ['folder', 'done'] },
  { name: 'LLM writes',         micro: ['public', 'now', 'well spent'] },
  { name: 'calendar',           micro: ['sent', 'qualified', 'none'] },
  { name: 'code clicks',        micro: ['click', 'checked', 'saved'] },
  { name: 'review folder',      micro: ['saved', 'never', 'hit post'] },
  { name: 'Slack ping',         micro: ['on-call', 'routed', 'kept'] },
  { name: 'progress saved',     micro: ['always', 'on'] },
  { name: 'human gate',         micro: ['bigger', 'ask'] },
  { name: 'eng_oncall',         micro: ['routed', 'now'] },
  { name: 'cost',               micro: ['$0.042 / M', 'in — out'] },
  { name: 'safe_to_run',        micro: ['default', 'human', 'gated'] },
];

export const RESULTS = [
  'typed question asked', 'state passed · evidence', 'mail moved', 'draft saved · never sent',
  'gate passed · 0.97', 'calendar link sent', 'quarantine · held', 'choice written to state',
  'worker handed off', 'progress saved', 'review folder updated', 'ping routed · on-call',
];

export const LOG_LINES = [
  'jev → Choice folder · phishing 0.97',
  'gate 0.97 ≥ 0.85 pass',
  'code mail → quarantine',
  'state snapshot saved · 1/s',
  'noul worth_reply · yes 0.91',
  'score lead_quality · 0.89 high',
  'code clicks · checked · saved',
  'draft_short written · not sent',
  'median latency sample · 256 ms',
  'worker pool · 6 idle / 10',
  'guardrail · spend cap ok',
  'human gate · 1 waiting',
];

export interface SimState {
  running: boolean;
  paused: boolean;
  speed: number;
  theme: string; // theme id
  decisions: number;
  latency: number;
  cost: number;
  confidence: number;
  caseIdx: number;
  caseEndsAt: number; // performance.now() ms, in engine time
  log: { t: string; text: string; kind: 'ok' | 'warn' | 'bad' }[];
  frozenCols: boolean[]; // 5 column groups
  startedAt: number;
  resetNonce: number;
}

export const sim: SimState = {
  running: true,
  paused: false,
  speed: 1,
  theme: 'auto',
  decisions: 3403,
  latency: 256,
  cost: 0.42,
  confidence: CASES[0].confidence,
  caseIdx: 0,
  caseEndsAt: 0,
  log: [],
  frozenCols: [false, false, false, false, false],
  startedAt: Date.now(),
  resetNonce: 0,
};

export function currentColor(): string {
  if (sim.theme !== 'auto') {
    const t = THEMES.find((x) => x.id === sim.theme);
    if (t && t.color) return t.color;
  }
  return CASES[sim.caseIdx].color;
}

export function resetSim() {
  sim.decisions = 0;
  sim.cost = 0.42;
  sim.latency = 256;
  sim.caseIdx = 0;
  sim.confidence = CASES[0].confidence;
  sim.caseEndsAt = 0;
  sim.log = [];
  sim.startedAt = Date.now();
  sim.resetNonce++;
}

export function istClock(d = new Date()): string {
  return d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
}
