import { CASES } from '../engine';

interface Hud { decisions: number; latency: number; cost: number; confidence: number; caseIdx: number; clock: string; fps: number }

export default function TopBar({ hud }: { hud: Hud }) {
  const cs = CASES[hud.caseIdx];
  const pass = hud.confidence >= 0.85;
  return (
    <header className="relative z-20 px-3 pt-2">
      <div className="flex items-center justify-between text-[10px] tracking-[0.18em] text-slate-400">
        <div className="text-slate-200 font-bold text-[13px] tracking-[0.08em]">JEV <span className="text-slate-500">/</span> DECISION PIPELINE</div>
        <div className="hidden md:block">SYSTEM ONE · jev-1.13.0</div>
        <div className="hidden lg:block">STATE — QUESTIONS — JEV — GATE — CODE</div>
        <div className="flex items-center gap-2">
          <span className="border border-amber-400/60 text-amber-300 px-1.5 py-0.5 rounded-sm font-bold">SIMULATED DATA</span>
          <span className="text-slate-300">{hud.clock} IST</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
        <div className="border border-slate-800 bg-black/60 px-3 py-1.5">
          <div className="text-[9px] tracking-[0.2em] text-slate-500">DECISIONS — THIS RUN</div>
          <div className="text-[26px] leading-7 font-extrabold text-white tabular-nums">{Math.floor(hud.decisions).toLocaleString('en-US').replace(/,/g, ' ')}</div>
          <div className="flex gap-[2px] mt-1">{Array.from({ length: 24 }).map((_, i) => (<span key={i} className={`h-[5px] w-[7px] ${i < 24 - (Math.floor(hud.decisions) % 5) ? 'bg-amber-400/90' : 'bg-slate-800'}`} />))}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">SIM · one loop · 10 000</div>
        </div>
        <div className="border border-slate-800 bg-black/60 px-3 py-1.5">
          <div className="text-[9px] tracking-[0.2em] text-slate-500">MEDIAN LATENCY · REPORTED</div>
          <div className="text-[26px] leading-7 font-extrabold text-white tabular-nums">~{Math.round(hud.latency)} <span className="text-[13px] text-slate-400">ms</span></div>
          <div className="text-[9px] text-slate-500 mt-0.5">public demos · not SLAs · {hud.fps} fps render</div>
        </div>
        <div className="border border-slate-800 bg-black/60 px-3 py-1.5">
          <div className="text-[9px] tracking-[0.2em] text-slate-500">COST · 10 000 DECISIONS</div>
          <div className="text-[26px] leading-7 font-extrabold tabular-nums" style={{ color: cs.color }}>≈ ${hud.cost.toFixed(2)}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">jev LLM $0.042 / M in · out free</div>
        </div>
        <div className="border border-slate-800 bg-black/60 px-3 py-1.5">
          <div className="text-[9px] tracking-[0.2em] text-slate-500">CONFIDENCE · LIVE</div>
          <div className="flex items-center gap-2">
            <div className="text-[26px] leading-7 font-extrabold tabular-nums" style={{ color: cs.color }}>{hud.confidence.toFixed(2)}</div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${pass ? 'bg-lime-400 text-black' : 'bg-red-500 text-white'}`}>{pass ? 'PASS' : 'HOLD'}</span>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">calibrate on yours · gate 0.85</div>
        </div>
      </div>

      <div className="flex items-end justify-between mt-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] font-bold px-2 py-1 rounded-sm text-black shrink-0" style={{ background: cs.color }}>CASE 0{hud.caseIdx + 1} / 06</span>
          <div className="min-w-0">
            <div className="text-[22px] leading-5 font-extrabold text-white truncate">{cs.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{cs.sub}</div>
          </div>
        </div>
        <div className="hidden md:flex gap-1 text-[9px] tracking-[0.15em]">
          {['STATE', 'ASK', 'JEV', 'GATE', 'CODE'].map((x, i) => (
            <span key={x} className={`px-2 py-1 border ${i === 2 ? 'text-black font-bold' : 'border-slate-700 text-slate-400'}`} style={i === 2 ? { background: cs.color } : undefined}>{x}</span>
          ))}
        </div>
      </div>
    </header>
  );
}
