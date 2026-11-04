import { THEMES, sim, resetSim } from '../engine';

export default function ControlBar({ onChange }: { onChange: () => void }) {
  const btn = 'px-2.5 py-1 border border-slate-700 text-[10px] tracking-[0.12em] text-slate-200 hover:border-slate-400 bg-black/70';
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };
  return (
    <div className="relative z-20 flex flex-wrap items-center gap-1.5 px-3 py-1.5">
      <button className={btn} onClick={() => { sim.running = !sim.running; onChange(); }}>{sim.running ? '■ STOP' : '▶ START'}</button>
      <button className={btn} onClick={() => { sim.paused = !sim.paused; onChange(); }}>{sim.paused ? '▶ RESUME' : '❚❚ PAUSE'}</button>
      <button className={btn} onClick={() => { resetSim(); onChange(); }}>↺ RESET</button>
      <button className={btn} onClick={toggleFullscreen}>⛶ FULLSCREEN</button>
      <span className="text-[9px] tracking-[0.15em] text-slate-500 ml-2">THEME</span>
      <select
        className="bg-black border border-slate-700 text-[10px] text-slate-200 px-1.5 py-1"
        value={sim.theme}
        onChange={(e) => { sim.theme = e.target.value; onChange(); }}
      >
        {THEMES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
      </select>
      <span className="text-[9px] tracking-[0.15em] text-slate-500 ml-2">SPEED {sim.speed.toFixed(2)}×</span>
      <input
        type="range" min={0.25} max={3} step={0.25} value={sim.speed}
        onChange={(e) => { sim.speed = parseFloat(e.target.value); onChange(); }}
        className="w-28 accent-cyan-300"
      />
      <span className="text-[9px] tracking-[0.15em] text-slate-500 ml-2">FREEZE COLUMNS</span>
      {sim.frozenCols.map((f, i) => (
        <button
          key={i}
          className={`${btn} ${f ? 'border-amber-400 text-amber-300' : ''}`}
          onClick={() => { sim.frozenCols[i] = !sim.frozenCols[i]; onChange(); }}
        >C{i + 1}{f ? ' ❄' : ''}</button>
      ))}
      <span className="ml-auto text-[9px] tracking-[0.15em] text-slate-600">click a use-case tile in the grid below to jump cases · all data simulated</span>
    </div>
  );
}
