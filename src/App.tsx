import { useEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Stage from './components/Stage';
import TopBar from './components/TopBar';
import BottomPanels from './components/BottomPanels';
import ControlBar from './components/ControlBar';
import { CASES, sim, istClock } from './engine';

interface Hud { decisions: number; latency: number; cost: number; confidence: number; caseIdx: number; clock: string; fps: number }

export default function App() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [hud, setHud] = useState<Hud>({ decisions: sim.decisions, latency: 256, cost: 0.42, confidence: CASES[0].confidence, caseIdx: 0, clock: istClock(), fps: 60 });
  const frames = useRef(0);
  const fpsT = useRef(performance.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      frames.current++;
      const now = performance.now();
      const el = now - fpsT.current;
      let fps = hud.fps;
      if (el >= 1000) { fps = Math.round(frames.current * 1000 / el); frames.current = 0; fpsT.current = now; }
      setHud({ decisions: sim.decisions, latency: sim.latency, cost: sim.cost, confidence: sim.confidence, caseIdx: sim.caseIdx, clock: istClock(), fps });
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#010204] text-slate-200 font-mono flex flex-col select-none">
      <TopBar hud={hud} />
      <AnimatePresence mode="wait">
        <motion.div key={hud.caseIdx} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="hidden" />
      </AnimatePresence>
      <ControlBar onChange={force} />
      <main className="relative flex-1 min-h-0 mx-3 border border-slate-800/80 overflow-hidden">
        <Stage />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-2 pt-1 text-[8.5px] tracking-[0.18em] text-slate-500 z-10">
          <span>01 · STATE / IN</span><span>02 · TYPED / QUESTIONS</span><span>03 · JEV / SYSTEM ONE</span><span>04 · GATE / ROUTE</span><span>05 · CODE / ACTS</span>
        </div>
      </main>
      <BottomPanels caseIdx={hud.caseIdx} tick={Math.floor(hud.decisions)} />
    </div>
  );
}
