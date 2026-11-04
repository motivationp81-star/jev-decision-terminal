import { useEffect, useRef } from 'react';
import { CASES, LABELS, RESULTS, LOG_LINES, sim, currentColor, istClock } from '../engine';

/* Canvas stage: a wide tilted plane of labels, braided white-core light rivers,
   hair-thin connection web, travelling signal boxes with result strips, and a
   thin lens circle — the anatomy of the reference video. */

interface NodeT { x: number; y: number; col: number; row: number; li: number; dash: string; tw: number }
interface Act { node: number; born: number; result: string }
interface Ghost { x: number; y: number; w: string; a: number; ph: number }

const COLS = 10;
const ROWS = 9;
const DASHES = ['#ff5c8a', '#25e6ff', '#ffd23e', '#e8f4ff', '#9dff00'];
const GHOST_WORDS = ['queue check', 'title len', 'api ping', 'log write', 'spam scan', 'hold gate', 'map read', 'token ok', 'reply draft', 'score head', 'state enc', 'gate pass', 'file hash', 'dm state', 'post id', 'cost chk', 'round no', 'part no', 'link out', 'note save', 'rank in', 'time ist'];

function hexRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function rgba(c: [number, number, number], a: number): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

export default function Stage() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = cvRef.current!;
    const wrap = wrapRef.current!;
    const ctx = cv.getContext('2d')!;

    /* build the plane */
    const nodes: NodeT[] = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        nodes.push({
          x: 0.045 + c * 0.101, y: 0.06 + r * 0.108,
          col: c, row: r,
          li: (c * ROWS + r * 7 + ((c * 3 + r) % 5)) % LABELS.length,
          dash: DASHES[(c * 3 + r * 2) % DASHES.length],
          tw: Math.random() * 6.28,
        });
      }
    }
    const edges: { a: number; b: number; ph: number; col: string }[] = [];
    const strandCols = ['255,255,255', '255,61,139', '37,230,255', '255,210,62'];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 1; r++) {
        edges.push({ a: c * ROWS + r, b: c * ROWS + r + 1, ph: Math.random() * 6.28, col: strandCols[(c + r) % 4] });
        if (c < COLS - 1 && (r + c) % 2 === 0) edges.push({ a: c * ROWS + r, b: (c + 1) * ROWS + r + 1, ph: Math.random() * 6.28, col: strandCols[(c + r + 1) % 4] });
        if (c > 0 && (r + c) % 3 === 0) edges.push({ a: c * ROWS + r, b: (c - 1) * ROWS + r + 1, ph: Math.random() * 6.28, col: strandCols[(c + r + 2) % 4] });
      }
    }
    const ghosts: Ghost[] = [];
    for (let i = 0; i < 240; i++) ghosts.push({ x: 0.02 + Math.random() * 0.96, y: 0.04 + Math.random() * 0.92, w: GHOST_WORDS[i % GHOST_WORDS.length], a: 0.14 + Math.random() * 0.3, ph: Math.random() * 6.28 });
    const rivers: number[] = [];
    for (let i = 0; i < 9; i++) rivers.push(0.085 + i * 0.104);

    let W = 0, H = 0, SW = 0, SH = 0;
    const fit = () => {
      const r = wrap.getBoundingClientRect();
      SW = r.width; SH = r.height;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      cv.width = Math.round(SW * dpr); cv.height = Math.round(SH * dpr);
      cv.style.width = SW + 'px'; cv.style.height = SH + 'px';
      W = cv.width; H = cv.height;
    };
    fit();
    window.addEventListener('resize', fit);

    const PW = () => W * 2.1;           // plane width in canvas px
    const PH = () => H * 1.5;           // plane height
    const projX = (x: number, y: number) => (0.5 + (x - 0.5) * (0.88 + 0.12 * y)) * PW();
    const projY = (y: number) => (0.04 + 0.96 * Math.pow(y, 1.07)) * PH();

    let colCur = hexRgb(CASES[0].color);
    let acts: Act[] = [];
    let actTimer = 0;
    let logTimer = 0;
    let last = performance.now();
    let raf = 0;
    let lastReset = sim.resetNonce;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const rawDt = Math.min(60, now - last); last = now;
      const active = sim.running && !sim.paused;
      const dt = active ? rawDt * sim.speed : 0;
      const t = now * 0.001;

      if (lastReset !== sim.resetNonce) { lastReset = sim.resetNonce; acts = []; }

      /* case timing + counters live here so everything stays in sync */
      if (active) {
        if (sim.caseEndsAt === 0) sim.caseEndsAt = now + 7000;
        if (now >= sim.caseEndsAt) {
          if (sim.theme === 'auto') sim.caseIdx = (sim.caseIdx + 1) % CASES.length;
          sim.caseEndsAt = now + 7000;
        }
        sim.decisions += (140 + Math.random() * 260) * (dt / 1000);
        sim.latency += (Math.random() - 0.5) * 1.6;
        sim.latency = Math.max(238, Math.min(274, sim.latency));
        const base = CASES[sim.caseIdx].confidence;
        sim.confidence += ((base + Math.sin(t * 0.7) * 0.02) - sim.confidence) * 0.03;
        logTimer -= dt;
        if (logTimer <= 0) {
          logTimer = 1400 + Math.random() * 1200;
          const kind: 'ok' | 'warn' = Math.random() < 0.12 ? 'warn' : 'ok';
          sim.log = [{ t: istClock(), text: LOG_LINES[(Math.random() * LOG_LINES.length) | 0], kind }, ...sim.log].slice(0, 7);
        }
      }
      const colTgt = hexRgb(currentColor());
      for (let i = 0; i < 3; i++) colCur[i] += (colTgt[i] - colCur[i]) * 0.04;

      /* camera: slow ping-pong pan across the wide plane */
      const cyc = (now * 0.001 * (active ? sim.speed : 0) + frameOff) % 52;
      const tri = cyc < 26 ? cyc / 26 : 2 - cyc / 26;
      const camX = tri * (PW() - W) * 0.92;
      const camY = (PH() - H) * (0.3 + 0.18 * Math.sin(t * 0.11));

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#010204';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(-camX, -camY);
      ctx.globalCompositeOperation = 'lighter';

      /* case colour wash */
      const wash = ctx.createRadialGradient(PW() * (0.2 + tri * 0.6), PH() * 0.4, 60, PW() * (0.2 + tri * 0.6), PH() * 0.4, PW() * 0.55);
      wash.addColorStop(0, rgba(colCur, 0.10)); wash.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = wash; ctx.fillRect(camX - 50, camY - 50, W + 100, H + 100);

      /* ghost micro-labels */
      ctx.font = `${Math.round(H * 0.016)}px ui-monospace, Menlo, monospace`;
      for (const g of ghosts) {
        const gx = projX(g.x, g.y), gy = projY(g.y);
        if (gx < camX - 80 || gx > camX + W + 80 || gy < camY - 30 || gy > camY + H + 30) continue;
        const a = g.a * (0.7 + 0.3 * Math.sin(t * 0.9 + g.ph));
        ctx.fillStyle = `rgba(255,255,255,${a + 0.2})`;
        ctx.beginPath(); ctx.arc(gx, gy, 1.6, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(178,205,245,${a})`;
        ctx.fillText(g.w, gx + 7, gy + 3);
      }

      /* connection web */
      for (const e of edges) {
        const A = nodes[e.a], B = nodes[e.b];
        const ax = projX(A.x, A.y), ay = projY(A.y), bx = projX(B.x, B.y), by = projY(B.y);
        if ((ax < camX - 60 && bx < camX - 60) || (ax > camX + W + 60 && bx > camX + W + 60)) continue;
        const mx = (ax + bx) / 2 + Math.sin(e.ph) * 10, my = (ay + by) / 2;
        const sh = 0.16 + 0.07 * Math.sin(t * 1.1 + e.ph);
        ctx.strokeStyle = `rgba(${e.col},${sh})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
      }

      /* braided light rivers — white cores, case-colour fringe */
      for (let ri = 0; ri < rivers.length; ri++) {
        const rx = rivers[ri];
        const ph = t * 1.4 + ri * 1.93;
        const path = (off: number, wob: number) => {
          ctx.beginPath();
          for (let v = 0; v <= 1.001; v += 0.03) {
            const y = projY(v);
            const x = projX(rx, v) + Math.sin(y * 0.008 + ph + off) * wob + Math.sin(y * 0.021 + ph * 1.6 + off) * wob * 0.45;
            if (v === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };
        ctx.strokeStyle = rgba(colCur, 0.05); ctx.lineWidth = 26; path(0, 15);
        ctx.strokeStyle = rgba(colCur, 0.10); ctx.lineWidth = 11; path(2.1, 18);
        ctx.strokeStyle = 'rgba(210,235,255,0.34)'; ctx.lineWidth = 3.4; path(0, 13);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.6; path(2.6, 16);
        ctx.strokeStyle = rgba(colCur, 0.20); ctx.lineWidth = 1.4; path(4.4, 19);
        /* bright beads travelling down the river */
        for (let k = 0; k < 4; k++) {
          const vv = ((t * (0.05 + k * 0.021) + k * 0.27 + ri * 0.13) % 1);
          const yy = projY(vv);
          const xx = projX(rx, vv) + Math.sin(yy * 0.008 + ph) * 13;
          if (xx < camX - 40 || xx > camX + W + 40) continue;
          const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, 9);
          g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.4, rgba(colCur, 0.5)); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, 9, 0, 6.283); ctx.fill();
        }
      }

      /* labels */
      const labelW = PW() * 0.088, labelH = PH() * 0.052;
      ctx.textBaseline = 'alphabetic';
      for (const n of nodes) {
        const x = projX(n.x, n.y), y = projY(n.y);
        if (x < camX - labelW || x > camX + W + 40 || y < camY - 30 || y > camY + H + 30) continue;
        const lab = LABELS[n.li];
        const depth = 0.72 + n.y * 0.4;
        /* node dot */
        const tw = 0.5 + 0.5 * Math.sin(t * 2 + n.tw);
        ctx.fillStyle = `rgba(255,255,255,${0.55 + tw * 0.3})`;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill();
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 13 * depth);
        glow.addColorStop(0, rgba(colCur, 0.30 * tw * depth)); glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 13 * depth, 0, 6.283); ctx.fill();
        /* name */
        ctx.font = `600 ${Math.round(H * (0.017 + n.y * 0.006))}px ui-monospace, Menlo, monospace`;
        ctx.fillStyle = `rgba(233,242,255,${0.82 * depth + 0.18})`;
        ctx.fillText(lab.name, x + 9, y + 4);
        /* microtext on the right */
        ctx.font = `${Math.round(H * 0.0135)}px ui-monospace, Menlo, monospace`;
        ctx.fillStyle = `rgba(150,180,220,${0.75 * depth})`;
        lab.micro.forEach((m, mi) => ctx.fillText(m, x + labelW * 0.62, y - 6 + mi * H * 0.017));
        /* coloured dash under the name */
        ctx.fillStyle = n.dash;
        ctx.globalAlpha = 0.75 * depth;
        ctx.fillRect(x + 9, y + H * 0.014, PW() * 0.016, 2.2);
        ctx.globalAlpha = 1;
      }

      /* signal-box activations — a decision path walking down the plane */
      if (active) {
        actTimer -= dt;
        if (actTimer <= 0) {
          actTimer = 950 + Math.random() * 500;
          const group = (Math.random() * 5) | 0;
          if (!sim.frozenCols[group]) {
            const colBase = group * 2 + ((Math.random() * 2) | 0);
            const prev = acts.length ? nodes[acts[acts.length - 1].node] : null;
            const row = prev && prev.col === colBase ? Math.min(ROWS - 1, prev.row + 1) : (Math.random() * 4) | 0;
            const idx = colBase * ROWS + row;
            acts.push({ node: idx, born: now, result: RESULTS[(Math.random() * RESULTS.length) | 0] });
            if (acts.length > 4) acts.shift();
          }
        }
      }
      acts = acts.filter((a) => now - a.born < 4600);
      const bw = PW() * 0.145, bh = PH() * 0.125;
      acts.forEach((a, ai) => {
        const n = nodes[a.node];
        const x = projX(n.x, n.y), y = projY(n.y);
        const age = now - a.born;
        const fade = age < 3400 ? 1 : Math.max(0, 1 - (age - 3400) / 1200);
        const bx = x - bw * 0.08, by = y - bh * 0.30;
        ctx.save();
        ctx.shadowColor = rgba(colCur, 0.95 * fade); ctx.shadowBlur = 30;
        ctx.strokeStyle = rgba(colCur, 0.95 * fade); ctx.lineWidth = 3;
        ctx.fillStyle = rgba(colCur, 0.07 * fade);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 12); else ctx.rect(bx, by, bw, bh);
        ctx.fill(); ctx.stroke();
        ctx.restore();
        /* filled result strip along the bottom of the box */
        ctx.fillStyle = rgba(colCur, 0.92 * fade);
        const sh2 = PH() * 0.026;
        ctx.fillRect(bx + 8, by + bh - sh2 - 7, bw - 16, sh2);
        ctx.font = `700 ${Math.round(H * 0.0145)}px ui-monospace, Menlo, monospace`;
        ctx.fillStyle = `rgba(5,8,16,${fade})`;
        ctx.fillText(a.result, bx + 14, by + bh - 12);
        /* lens circle on the newest activation */
        if (ai === acts.length - 1) {
          const lx = bx + bw * 0.86, ly = by + bh * 0.36, lr = bh * 0.62;
          ctx.strokeStyle = `rgba(255,255,255,${0.65 * fade})`; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(lx, ly, lr, 0, 6.283); ctx.stroke();
          ctx.strokeStyle = rgba(colCur, 0.5 * fade);
          ctx.beginPath(); ctx.arc(lx, ly, lr * 1.06, 0, 6.283); ctx.stroke();
        }
      });

      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
    };
    let frameOff = Math.random() * 40;
    frameOff = frameOff; // camera phase offset
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit); };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={cvRef} className="block" />
    </div>
  );
}
