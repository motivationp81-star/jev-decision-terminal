import { useEffect, useRef } from 'react';
import { CASES, LABELS, RESULTS, LOG_LINES, sim, currentColor, istClock } from '../engine';

/* Stage v2 — rebuilt from the reference video, frame by frame:
   - every node is a large soft dark PANEL (faint border, name top-left,
     microtext on the right, coloured dash under the name)
   - a decision PATH of ~5 panels lights up together in the case colour
     (bright outline + bloom); the path's HEAD panel carries the filled
     result strip and a soft flare, and the orbiting dot circles the head
   - braided white-hot light rivers run between the panel columns
   - the camera glides slowly across a plane wider than the screen */

interface Panel { x: number; y: number; col: number; row: number; li: number; accent: string }
interface Ghost { x: number; y: number; w: string; a: number; ph: number }

const COLS = 9;
const ROWS = 9;
const ACCENTS = ['#ffd23e', '#25e6ff', '#ff5c8a', '#9dff00', '#e8f4ff'];
const GHOST_WORDS = ['queue check', 'title len', 'api ping', 'log write', 'spam scan', 'hold gate', 'map read', 'token ok', 'cost chk', 'part no', 'link out', 'note save', 'time ist', 'dm state', 'post id'];

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

    const panels: Panel[] = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        panels.push({
          x: 0.028 + c * 0.105, y: 0.04 + r * 0.104, col: c, row: r,
          li: (c * ROWS + r * 7 + ((c * 3 + r) % 5)) % LABELS.length,
          accent: ACCENTS[(c * 2 + r * 3) % ACCENTS.length],
        });
      }
    }
    const ghosts: Ghost[] = [];
    for (let i = 0; i < 130; i++) ghosts.push({ x: Math.random(), y: Math.random(), w: GHOST_WORDS[i % GHOST_WORDS.length], a: 0.10 + Math.random() * 0.22, ph: Math.random() * 6.28 });
    const rivers: number[] = [];
    for (let i = 0; i < 8; i++) rivers.push(0.082 + i * 0.1055);
    const strandCols: [number, number, number][] = [[255, 255, 255], [160, 230, 255], [255, 170, 220], [255, 226, 150], [210, 240, 255]];

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

    const PW = () => W * 2.3;
    const PH = () => H * 1.45;
    const projX = (x: number, y: number) => (0.5 + (x - 0.5) * (0.90 + 0.10 * y)) * PW();
    const projY = (y: number) => (0.03 + 0.97 * Math.pow(y, 1.05)) * PH();
    const panW = () => PW() * 0.094;
    const panH = () => PH() * 0.086;

    /* decision path state */
    let pathSet = new Set<number>();
    let pathArr: number[] = [];
    let headIdx = 0;
    let pathBorn = 0;
    let pathTimer = 0;
    let headTimer = 0;
    let resultText = RESULTS[0];
    const lit = new Map<number, number>(); // panel idx -> light 0..1

    const newPath = (now: number) => {
      const c0 = (Math.random() * (COLS - 2)) | 0;
      let r = 1 + ((Math.random() * 3) | 0);
      pathArr = [];
      for (let k = 0; k < 5; k++) {
        const c = Math.min(COLS - 1, c0 + (k % 2 === 0 ? 0 : 1) + (k > 2 ? 1 : 0));
        pathArr.push(c * ROWS + Math.min(ROWS - 1, r));
        r = Math.min(ROWS - 1, r + 1 + ((Math.random() * 2) | 0));
      }
      pathSet = new Set(pathArr);
      headIdx = 0;
      pathBorn = now;
      resultText = RESULTS[(Math.random() * RESULTS.length) | 0];
    };

    /* orbiter */
    let orbPanel = -1;
    let orbAng = 0;
    let orbX = 0, orbY = 0;
    let flyT = 1;
    let flyFrom = { x: 0, y: 0 };
    let flyCtrl = { x: 0, y: 0 };
    let flyPanel = -1;
    const trail: { x: number; y: number }[] = [];

    let colCur = hexRgb(CASES[0].color);
    let caseElapsed = 0;
    let logTimer = 0;
    let last = performance.now();
    let raf = 0;
    const camPhase = Math.random() * 40;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const rawDt = Math.min(60, now - last); last = now;
      const active = sim.running && !sim.paused;
      const dt = active ? rawDt * sim.speed : 0;
      const t = now * 0.001;

      if (active) {
        if (sim.caseEndsAt === 0) { caseElapsed = 0; sim.caseEndsAt = 1; }
        caseElapsed += dt;
        if (caseElapsed >= 7000) {
          if (sim.theme === 'auto') sim.caseIdx = (sim.caseIdx + 1) % CASES.length;
          caseElapsed = 0;
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
        /* path lifecycle: light a path ~4.5s, head steps down it */
        pathTimer -= dt;
        headTimer -= dt;
        if (pathArr.length === 0 || pathTimer <= 0) { newPath(now); pathTimer = 4600; headTimer = 0; }
        if (headTimer <= 0 && headIdx < pathArr.length - 1) {
          headIdx++;
          headTimer = 880;
          resultText = RESULTS[(Math.random() * RESULTS.length) | 0];
        }
      }
      const colTgt = hexRgb(currentColor());
      const lk = active ? Math.min(1, dt * 0.004) : 0.04;
      for (let i = 0; i < 3; i++) colCur[i] += (colTgt[i] - colCur[i]) * lk;
      /* ease panel lights toward membership */
      for (let i = 0; i < panels.length; i++) {
        const target = pathSet.has(i) ? 1 : 0;
        const cur = lit.get(i) || 0;
        const nv = cur + (target - cur) * (active ? 0.045 * sim.speed + 0.01 : 0.02);
        if (Math.abs(nv) > 0.01 || target === 1) lit.set(i, nv);
      }

      const cyc = (t * (active ? sim.speed : 0) + camPhase) % 56;
      const tri = cyc < 28 ? cyc / 28 : 2 - cyc / 28;
      const camX = tri * (PW() - W) * 0.94;
      const camY = (PH() - H) * (0.34 + 0.16 * Math.sin(t * 0.1));

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#010204';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(-camX, -camY);

      /* case wash */
      const wash = ctx.createRadialGradient(PW() * (0.2 + tri * 0.6), PH() * 0.42, 60, PW() * (0.2 + tri * 0.6), PH() * 0.42, PW() * 0.55);
      wash.addColorStop(0, rgba(colCur, 0.09)); wash.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = wash; ctx.fillRect(camX - 50, camY - 50, W + 100, H + 100);

      /* ghost micro-labels */
      ctx.font = `${Math.round(H * 0.015)}px ui-monospace, Menlo, monospace`;
      for (const g of ghosts) {
        const gx = projX(g.x, g.y), gy = projY(g.y);
        if (gx < camX - 60 || gx > camX + W + 60 || gy < camY - 20 || gy > camY + H + 20) continue;
        const a = g.a * (0.7 + 0.3 * Math.sin(t * 0.9 + g.ph));
        ctx.fillStyle = `rgba(255,255,255,${a + 0.15})`;
        ctx.beginPath(); ctx.arc(gx, gy, 1.5, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(170,200,240,${a})`;
        ctx.fillText(g.w, gx + 6, gy + 3);
      }

      /* braided rivers — many intertwining strands, white-hot knots */
      ctx.globalCompositeOperation = 'lighter';
      for (let ri = 0; ri < rivers.length; ri++) {
        const rx = rivers[ri];
        const cx0 = projX(rx, 0.5);
        if (cx0 < camX - 90 || cx0 > camX + W + 90) continue;
        for (let s = 0; s < 20; s++) {
          const ph = s * 2.4 + ri * 1.7;
          const col = strandCols[s % strandCols.length];
          const isCore = s % 5 === 0;
          ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${isCore ? 0.5 : 0.16})`;
          ctx.lineWidth = isCore ? 1.8 : 1;
          ctx.beginPath();
          for (let v = 0; v <= 1.001; v += 0.025) {
            const y = projY(v);
            const x = projX(rx, v) + Math.sin(y * 0.006 + ph + t * (0.5 + (s % 3) * 0.22)) * (7 + (s % 4) * 3.4);
            if (v === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        /* bright knots where strands converge + travelling pulses */
        for (let k = 0; k < 7; k++) {
          const vv = ((k / 7 + t * 0.016 * (1 + (k % 3) * 0.3) + ri * 0.11) % 1);
          const yy = projY(vv);
          const xx = projX(rx, vv) + Math.sin(yy * 0.006 + t) * 7;
          const rr = 5 + 3.5 * Math.sin(t * 2.2 + k * 1.7 + ri);
          const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, Math.max(4, rr));
          g.addColorStop(0, 'rgba(255,255,255,0.95)');
          g.addColorStop(0.4, rgba(colCur, 0.45));
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, Math.max(4, rr), 0, 6.283); ctx.fill();
        }
        /* soft case-colour fringe behind the river */
        ctx.strokeStyle = rgba(colCur, 0.05); ctx.lineWidth = 30;
        ctx.beginPath();
        for (let v = 0; v <= 1.001; v += 0.05) {
          const y = projY(v);
          const x = projX(rx, v) + Math.sin(y * 0.006 + ri) * 8;
          if (v === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      /* web strands between panels */
      ctx.strokeStyle = 'rgba(140,180,230,0.10)';
      ctx.lineWidth = 1;
      for (let c = 0; c < COLS - 1; c++) {
        for (let r = 0; r < ROWS; r++) {
          if ((c + r) % 2 !== 0) continue;
          const A = panels[c * ROWS + r], B = panels[(c + 1) * ROWS + Math.min(ROWS - 1, r + 1)];
          const ax = projX(A.x, A.y) + panW(), ay = projY(A.y) + panH() * 0.5;
          const bx = projX(B.x, B.y), by = projY(B.y) + panH() * 0.4;
          if (ax < camX - 40 || bx > camX + W + 40) continue;
          ctx.beginPath(); ctx.moveTo(ax, ay);
          ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 14, bx, by); ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      /* panels */
      const pw = panW(), ph2 = panH();
      const headPanelIdx = pathArr.length ? pathArr[Math.min(headIdx, pathArr.length - 1)] : -1;
      panels.forEach((p, i) => {
        const x = projX(p.x, p.y), y = projY(p.y);
        if (x < camX - pw || x > camX + W + 20 || y < camY - ph2 || y > camY + H + 20) return;
        const L = lit.get(i) || 0;
        const lab = LABELS[p.li];
        /* body */
        ctx.save();
        if (L > 0.03) { ctx.shadowColor = rgba(colCur, 0.85 * L); ctx.shadowBlur = 26 * L; }
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, pw, ph2, 9); else ctx.rect(x, y, pw, ph2);
        ctx.fillStyle = L > 0.03 ? rgba(colCur, 0.05 + 0.07 * L) : 'rgba(9,13,20,0.88)';
        ctx.fill();
        ctx.strokeStyle = L > 0.03 ? rgba(colCur, 0.25 + 0.75 * L) : 'rgba(120,150,190,0.15)';
        ctx.lineWidth = L > 0.03 ? 1 + 1.8 * L : 1;
        ctx.stroke();
        ctx.restore();
        /* bullet + name */
        const fs = H * (0.0165 + p.y * 0.004);
        ctx.fillStyle = p.accent;
        ctx.fillRect(x + pw * 0.045, y + ph2 * 0.16, 6, 6);
        ctx.font = `600 ${Math.round(fs)}px ui-monospace, Menlo, monospace`;
        ctx.fillStyle = `rgba(235,243,255,${0.78 + 0.22 * L})`;
        ctx.fillText(lab.name, x + pw * 0.045 + 11, y + ph2 * 0.16 + fs * 0.85);
        /* dash under name */
        ctx.fillStyle = p.accent; ctx.globalAlpha = 0.8;
        ctx.fillRect(x + pw * 0.045, y + ph2 * 0.52, pw * 0.16, 2.4);
        ctx.globalAlpha = 1;
        /* microtext right */
        ctx.font = `${Math.round(fs * 0.72)}px ui-monospace, Menlo, monospace`;
        ctx.fillStyle = `rgba(155,182,216,${0.72 + 0.2 * L})`;
        lab.micro.forEach((m, mi) => ctx.fillText(m, x + pw * 0.60, y + ph2 * (0.24 + mi * 0.24)));
        /* head extras: flare + filled result strip */
        if (i === headPanelIdx && L > 0.4) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const fx = x + pw * 0.78, fy = y + ph2 * 0.42;
          const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, ph2 * 0.95);
          fg.addColorStop(0, `rgba(255,255,255,${0.55 * L})`);
          fg.addColorStop(0.35, rgba(colCur, 0.4 * L));
          fg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(fx, fy, ph2 * 0.95, 0, 6.283); ctx.fill();
          ctx.restore();
          const sh = ph2 * 0.26;
          ctx.fillStyle = rgba(colCur, 0.92 * L);
          ctx.fillRect(x + 7, y + ph2 - sh - 6, pw - 14, sh);
          ctx.font = `700 ${Math.round(fs * 0.78)}px ui-monospace, Menlo, monospace`;
          ctx.fillStyle = `rgba(4,7,14,${L})`;
          ctx.fillText(resultText, x + 13, y + ph2 - 11);
        }
      });

      /* orbiting dot + trailing line around the head panel */
      if (headPanelIdx >= 0 && active) {
        const hp = panels[headPanelIdx];
        const hx = projX(hp.x, hp.y), hy = projY(hp.y);
        if (orbPanel !== headPanelIdx && flyT >= 1) {
          flyPanel = headPanelIdx;
          flyFrom = { x: orbX || hx + pw / 2, y: orbY || hy + ph2 / 2 };
          flyCtrl = { x: (flyFrom.x + hx + pw / 2) / 2, y: Math.min(flyFrom.y, hy + ph2 / 2) - PH() * 0.04 };
          flyT = 0;
        }
        const tb = flyT < 1 && flyPanel >= 0 ? panels[flyPanel] : hp;
        const tx = projX(tb.x, tb.y), ty = projY(tb.y);
        const cxp = tx + pw / 2, cyp = ty + ph2 / 2;
        const rx2 = pw / 2 + 15, ry2 = ph2 / 2 + 12;
        if (flyT < 1) {
          flyT = Math.min(1, flyT + dt / 560);
          const e = flyT * flyT * (3 - 2 * flyT);
          orbX = (1 - e) * (1 - e) * flyFrom.x + 2 * (1 - e) * e * flyCtrl.x + e * e * (cxp + rx2);
          orbY = (1 - e) * (1 - e) * flyFrom.y + 2 * (1 - e) * e * flyCtrl.y + e * e * cyp;
          if (flyT >= 1) { orbPanel = flyPanel; orbAng = 0; }
        } else {
          orbPanel = headPanelIdx;
          orbAng += dt * 0.0042;
          orbX = cxp + Math.cos(orbAng) * rx2;
          orbY = cyp + Math.sin(orbAng) * ry2;
        }
        trail.push({ x: orbX, y: orbY });
        if (trail.length > 54) trail.shift();
      }
      if (trail.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = rgba(colCur, 0.9); ctx.shadowBlur = 12;
        for (let i = 1; i < trail.length; i++) {
          const f = i / trail.length;
          ctx.strokeStyle = rgba(colCur, f * 0.85);
          ctx.lineWidth = 1 + f * 2.2;
          ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
        }
        ctx.restore();
        const hg = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 15);
        hg.addColorStop(0, 'rgba(255,255,255,0.98)');
        hg.addColorStop(0.35, rgba(colCur, 0.85));
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(orbX, orbY, 15, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(orbX, orbY, 3.2, 0, 6.283); ctx.fill();
      }
      void pathBorn;

      ctx.restore();
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', fit); };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={cvRef} className="block" />
    </div>
  );
}
