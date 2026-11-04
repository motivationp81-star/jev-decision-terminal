import { useEffect, useRef } from 'react';
import { createChart, LineSeries, type IChartApi, type UTCTimestamp } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { CASES, sim } from '../engine';

const UC = ['email', 'youtube', 'skool', 'x feed', 'meetings', 'clips', 'contracts', 'leads', 'brain-dump', 'support', 'trading', 'agents'];
const PQ = [
  { k: 'Choice A', v: 0.92, c: '#ff5c8a' }, { k: 'Choice B', v: 0.64, c: '#25e6ff' },
  { k: 'Score A', v: 0.71, c: '#25e6ff' }, { k: 'Score B', v: 0.45, c: '#ffd23e' },
  { k: 'Noul A', v: 0.83, c: '#e8f4ff' }, { k: 'Noul B', v: 0.38, c: '#9dff00' },
];

function Panel({ title, right, children, className = '' }: { title: string; right?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-slate-800/90 bg-black/70 px-2 py-1.5 min-w-0 ${className}`}>
      <div className="flex justify-between items-baseline">
        <div className="text-[8.5px] tracking-[0.18em] text-slate-400 font-bold truncate">{title}</div>
        {right && <div className="text-[8.5px] text-slate-500">{right}</div>}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function BottomPanels({ caseIdx, tick }: { caseIdx: number; tick: number }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi | null>(null);
  const series = useRef<{ setData: (d: { time: UTCTimestamp; value: number }[]) => void }[]>([]);
  const dataRef = useRef<{ t: number; a: number; b: number; c: number }[]>([]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = createChart(chartRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#5b6b84', fontSize: 8, fontFamily: 'ui-monospace, Menlo, monospace' },
      grid: { vertLines: { color: 'rgba(60,80,110,0.15)' }, horzLines: { color: 'rgba(60,80,110,0.15)' } },
      rightPriceScale: { visible: false }, leftPriceScale: { visible: false },
      timeScale: { visible: false }, crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      autoSize: true,
    });
    chartApi.current = chart;
    const mk = (color: string) => chart.addSeries(LineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false });
    series.current = [mk('#ff5c8a'), mk('#ffd23e'), mk('#25e6ff')] as unknown as typeof series.current;
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < 60; i++) dataRef.current.push({ t: now - (60 - i) * 2, a: 0.7 + Math.sin(i * 0.4) * 0.15, b: 0.65 + Math.cos(i * 0.3) * 0.18, c: 0.75 + Math.sin(i * 0.23 + 2) * 0.12 });
    return () => { chart.remove(); chartApi.current = null; series.current = []; };
  }, []);

  useEffect(() => {
    if (!sim.running || sim.paused || series.current.length < 3) return;
    const now = Math.floor(Date.now() / 1000);
    const lastT = dataRef.current.length ? dataRef.current[dataRef.current.length - 1].t : now - 2;
    if (now <= lastT) return;
    const cs = CASES[caseIdx];
    dataRef.current.push({ t: now, a: cs.confidence + Math.sin(now * 0.4) * 0.05, b: 0.65 + Math.cos(now * 0.3) * 0.15, c: 0.72 + Math.sin(now * 0.23 + 2) * 0.1 });
    if (dataRef.current.length > 90) dataRef.current = dataRef.current.slice(-90);
    const D = dataRef.current;
    series.current[0].setData(D.map((d) => ({ time: d.t as UTCTimestamp, value: d.a })));
    series.current[1].setData(D.map((d) => ({ time: d.t as UTCTimestamp, value: d.b })));
    series.current[2].setData(D.map((d) => ({ time: d.t as UTCTimestamp, value: d.c })));
  }, [tick, caseIdx]);

  const spend = Math.min(1, 0.14 + (Math.floor(sim.decisions) % 4000) / 4000 * 0.5);

  return (
    <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-20 px-3 pb-1">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-1.5">
        <Panel title="PARALLEL QUESTIONS" right="one state">
          {PQ.map((p, i) => (
            <div key={p.k} className="flex items-center gap-1.5 text-[8.5px] text-slate-400 leading-[13px]">
              <span className="w-11 shrink-0">{p.k}</span>
              <span className="flex-1 h-[5px] bg-slate-900 relative overflow-hidden">
                <span className="absolute inset-y-0 left-0 transition-all duration-700" style={{ width: `${Math.round(p.v * 100 * (0.85 + 0.15 * Math.sin(tick / 3 + i)))}%`, background: p.c }} />
              </span>
              <span className="w-6 text-right text-slate-500">{['review', 'billing', '', 'critical', '', 'yes'][i]}</span>
            </div>
          ))}
          <div className="text-[8px] text-slate-600 mt-0.5">three answers = one cheap decision</div>
        </Panel>

        <Panel title="CONFIDENCE STREAM" right="SIM · live chart">
          <div ref={chartRef} className="h-[62px] w-full" />
          <div className="flex gap-2 text-[8px] text-slate-500"><span style={{ color: '#ff5c8a' }}>Choice</span><span style={{ color: '#ffd23e' }}>Score</span><span style={{ color: '#25e6ff' }}>Noul</span><span>under — human</span></div>
        </Panel>

        <Panel title="12 USE CASES" right={`case 0${caseIdx + 1}`}>
          <div className="grid grid-cols-3 gap-1">
            {UC.map((u, i) => (
              <div key={u} className={`text-[8.5px] px-1 py-0.5 border truncate ${i === caseIdx * 2 ? 'text-black font-bold' : 'border-slate-800 text-slate-400'}`} style={i === caseIdx * 2 ? { background: CASES[caseIdx].color } : undefined}>
                <span className="text-slate-500 mr-1">{String(i + 1).padStart(2, '0')}</span>{u}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="chief.py" right="14 l/s">
          <pre className="text-[8px] leading-[11px] text-slate-400 overflow-hidden">{`answer = result.choices["next_worker"]
destination = resolve(answer)
if answer.confidence >= 0.85:
    job = folder / f"{uuid4().hex}.json"
    job.write_text(json.dumps(payload))
import json
from pathlib import Path`}</pre>
        </Panel>

        <Panel title="RUN LOG" right={`${sim.log.length} lines`}>
          <div className="text-[8.5px] leading-[13px] font-mono">
            {sim.log.length === 0 && <div className="text-slate-600">waiting for first events…</div>}
            {sim.log.map((l, i) => (
              <div key={i} className="flex gap-1.5 truncate">
                <span className="text-slate-600 shrink-0">{l.t}</span>
                <span className={l.kind === 'warn' ? 'text-amber-300' : 'text-slate-300'}>{l.text}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="THE SPLIT" right="who does what">
          {[
            { k: 'LLM writes', n: 18, c: '#ffd23e' }, { k: 'Jev decides', n: 22, c: '#ff5c8a' }, { k: 'code acts', n: 22, c: '#25e6ff' },
          ].map((r) => (
            <div key={r.k} className="mb-1">
              <div className="text-[8.5px] text-slate-400">{r.k}</div>
              <div className="flex gap-[2px]">{Array.from({ length: 22 }).map((_, i) => (<span key={i} className={`h-[6px] w-[5px] ${i < r.n ? '' : 'opacity-20'}`} style={{ background: r.c }} />))}</div>
            </div>
          ))}
        </Panel>

        <Panel title="GUARDRAILS" right="always on">
          <div className="text-[8.5px] text-slate-400 leading-[15px]">
            <div className="flex justify-between"><span>spend cap</span><span className="text-slate-200">$0.14 / 1.00</span></div>
            <div className="h-[5px] bg-slate-900"><div className="h-full bg-lime-400 transition-all duration-700" style={{ width: `${Math.round(spend * 100)}%` }} /></div>
            <div className="flex justify-between mt-0.5"><span>actions</span><span className="text-slate-200">{Math.min(10, 3 + Math.floor(sim.decisions / 1500))} / 10</span></div>
            <div className="text-slate-500">never auto-post to X · progress saved</div>
          </div>
        </Panel>

        <Panel title="SYSTEM MONITOR" right={sim.paused ? 'PAUSED' : sim.running ? 'RUNNING' : 'STOPPED'}>
          <div className="text-[8.5px] text-slate-400 leading-[15px] font-mono">
            <div className="flex justify-between"><span>engine</span><span className={sim.running && !sim.paused ? 'text-lime-300' : 'text-amber-300'}>{sim.running && !sim.paused ? 'LIVE' : 'HOLD'}</span></div>
            <div className="flex justify-between"><span>speed</span><span className="text-slate-200">{sim.speed.toFixed(2)}×</span></div>
            <div className="flex justify-between"><span>theme</span><span className="text-slate-200 uppercase">{sim.theme}</span></div>
            <div className="flex justify-between"><span>data</span><span className="text-amber-300">SIMULATED</span></div>
            <div className="flex justify-between"><span>uptime</span><span className="text-slate-200">{Math.max(0, Math.floor((Date.now() - sim.startedAt) / 1000))}s</span></div>
          </div>
        </Panel>
      </div>
      <div className="flex justify-between text-[8.5px] tracking-[0.2em] text-slate-500 mt-1">
        <span>LLM WRITES · JEV DECIDES · CODE ACTS</span>
        <span>all data simulated · no real market feed</span>
      </div>
    </motion.footer>
  );
}
