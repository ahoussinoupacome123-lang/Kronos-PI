"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type HeroEvent = { ts: string; operator: string; amount: number; order: number };

type Props = { events: HeroEvent[]; firesAt: string; freezable: number; delayMin: number; sms: string; smsWho: string };

// Couleurs lisibles sur le disque bleu : chaque réseau a sa teinte, le compte mule vire au corail quand le seuil tombe.
const OP_COLORS: Record<string, number> = { ALPHAMONEY: 0xffffff, BETACASH: 0x9fe8c8, GAMMAPAY: 0xffd56b };
const OP_POS: Record<string, THREE.Vector3> = {
  ALPHAMONEY: new THREE.Vector3(-2.6, 1.6, 0),
  BETACASH: new THREE.Vector3(2.7, 1.2, -0.4),
  GAMMAPAY: new THREE.Vector3(0.1, -2.5, 0.3),
};
const CENTER = new THREE.Vector3(0.1, 0.15, 0.8);
const CORAL = 0xff6a45;
const CYCLE = 14;
const T_START = 0.06;
const T_END = 0.7;

function glow() {
  const c = document.createElement("canvas");
  c.width = c.height = 96;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.25, "rgba(255,255,255,0.7)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 96, 96);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const clock = (ms: number) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" }).format(new Date(ms));
const nf = new Intl.NumberFormat("fr-FR");

export default function HeroOrb({ events, firesAt, freezable, delayMin, sms, smsWho }: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState({ time: "14:02", n: 0, ops: 0, fired: false });

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = new Date(events[0].ts).getTime() - 7 * 60_000;
    const tLast = new Date(events[events.length - 1].ts).getTime();
    const span = tLast - t0;
    const frac = (ms: number) => T_START + ((ms - t0) / span) * (T_END - T_START);
    const fireF = frac(new Date(firesAt).getTime());

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 11.5);
    const root = new THREE.Group();
    scene.add(root);
    const tex = glow();

    for (const [op, pos] of Object.entries(OP_POS)) {
      const n = 180;
      const p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = Math.pow(Math.random(), 0.55) * 1.05;
        const a = Math.random() * Math.PI * 2;
        const b = Math.acos(2 * Math.random() - 1);
        p.set([pos.x + r * Math.sin(b) * Math.cos(a), pos.y + r * Math.cos(b), pos.z + r * Math.sin(b) * Math.sin(a)], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(p, 3));
      root.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, color: OP_COLORS[op], map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    }

    const coreMat = new THREE.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
    const core = new THREE.Sprite(coreMat);
    core.position.copy(CENTER);
    core.scale.setScalar(1.2);
    root.add(core);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dot.position.copy(CENTER);
    root.add(dot);
    const rings = [0, 1, 2].map(() => {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 96), new THREE.MeshBasicMaterial({ color: CORAL, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      m.position.copy(CENTER);
      root.add(m);
      return m;
    });

    const SEG = 56;
    const arcs = events.map((e, i) => {
      const from = OP_POS[e.operator].clone().add(new THREE.Vector3((Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1, 0));
      const mid = from.clone().lerp(CENTER, 0.5).add(new THREE.Vector3(0, 1.1 + (i % 3) * 0.35, 1));
      const curve = new THREE.QuadraticBezierCurve3(from, mid, CENTER.clone());
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(SEG));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({ color: OP_COLORS[e.operator], transparent: true, opacity: 0.95 });
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: OP_COLORS[e.operator], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      head.scale.setScalar(0.6);
      root.add(new THREE.Line(geo, mat), head);
      return { geo, mat, head, curve, start: frac(new Date(e.ts).getTime()), op: e.operator };
    });

    const resize = () => {
      const s = el.clientWidth;
      renderer.setSize(s, el.clientHeight, false);
      camera.aspect = s / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (ev: PointerEvent) => {
      ptr.tx = (ev.clientX / window.innerWidth - 0.5) * 2;
      ptr.ty = (ev.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);
    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(el);

    const timer = new THREE.Timer();
    let raf = 0;
    let last = "";
    const frame = (fixed?: number) => {
      timer.update();
      const el2 = timer.getElapsed();
      const f = fixed ?? (el2 % CYCLE) / CYCLE;
      ptr.x += (ptr.tx - ptr.x) * 0.05;
      ptr.y += (ptr.ty - ptr.y) * 0.05;
      root.rotation.y = Math.sin(el2 * 0.15) * 0.2 + ptr.x * 0.25;
      root.rotation.x = ptr.y * 0.12;
      let n = 0;
      const ops = new Set<string>();
      arcs.forEach((a) => {
        const p = THREE.MathUtils.clamp((f - a.start) / 0.07, 0, 1);
        const e = 1 - Math.pow(1 - p, 3);
        a.geo.setDrawRange(0, p > 0 ? Math.floor(e * SEG) + 1 : 0);
        a.mat.opacity = f > 0.93 ? Math.max(0, 1 - (f - 0.93) / 0.06) : 0.95;
        const hm = a.head.material as THREE.SpriteMaterial;
        if (p > 0 && p < 1) {
          a.head.position.copy(a.curve.getPoint(e));
          hm.opacity = 1;
        } else hm.opacity = 0;
        if (p >= 1) {
          n++;
          ops.add(a.op);
        }
      });
      const fired = f >= fireF && f < 0.97;
      const since = fired ? (f - fireF) * CYCLE : 0;
      rings.forEach((r, i) => {
        const m = r.material as THREE.MeshBasicMaterial;
        if (!fired) return void (m.opacity = 0);
        const k = ((since + i * 0.5) % 1.5) / 1.5;
        r.scale.setScalar(0.4 + k * 2.4);
        m.opacity = (1 - k) * 0.9;
      });
      const target = new THREE.Color(fired ? CORAL : 0xffffff);
      coreMat.color.lerp(target, 0.1);
      (dot.material as THREE.MeshBasicMaterial).color.lerp(target, 0.1);
      core.scale.setScalar(THREE.MathUtils.lerp(core.scale.x, fired ? 2.8 : 1 + n * 0.15, 0.08));
      renderer.render(scene, camera);
      const sim = t0 + ((Math.min(Math.max(f, T_START), 0.95) - T_START) / (T_END - T_START)) * span;
      const key = `${clock(sim)}|${n}|${ops.size}|${fired}`;
      if (key !== last) {
        last = key;
        setHud({ time: clock(sim), n, ops: ops.size, fired });
      }
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (visible && !document.hidden) frame();
    };
    if (reduced) frame(0.8);
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | undefined;
        mat?.dispose?.();
      });
      tex.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [events, firesAt]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
      {/* Disque hachuré + disque bleu, comme le portrait d'Evalis ; la scène 3D vit dedans. */}
      <div aria-hidden className="stripes absolute -right-2 top-6 h-[88%] w-[88%] rounded-full opacity-70" />
      <div aria-hidden className="absolute inset-[6%] rounded-full bg-blue shadow-[0_40px_90px_-30px_rgba(35,71,232,0.75)]" />
      <div aria-hidden className="absolute inset-[6%] overflow-hidden rounded-full bg-[radial-gradient(60%_60%_at_40%_35%,rgba(255,255,255,0.22),transparent_70%)]" />
      <div ref={mount} className="absolute inset-[6%] overflow-hidden rounded-full [&>canvas]:h-full [&>canvas]:w-full" aria-hidden />

      {/* Cartes flottantes, synchronisées sur le scénario */}
      <div className="absolute -left-4 top-[14%] w-[15.5rem] rounded-2xl bg-white p-3.5 shadow-[0_18px_40px_-16px_rgba(11,27,75,0.35)] md:-left-10">
        <p className="text-[11px] font-semibold text-slate">{smsWho}</p>
        <p className="mt-1 font-mono text-[11.5px] leading-snug text-ink">« {sms.slice(0, 92)}… »</p>
      </div>
      <div className="absolute -right-2 top-[2%] flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_18px_40px_-16px_rgba(11,27,75,0.35)] md:-right-6">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue font-display text-sm font-bold text-white">{hud.time}</span>
        <span className="leading-tight">
          <span className="block text-sm font-bold text-ink">
            {hud.n} plainte{hud.n > 1 ? "s" : ""} · {hud.ops} réseau{hud.ops > 1 ? "x" : ""}
          </span>
          <span className="block text-[11px] text-slate">seuil : 3 plaignants, 2 réseaux</span>
        </span>
      </div>
      <div
        className={`absolute -bottom-2 left-1/2 w-[17rem] -translate-x-1/2 rounded-2xl p-4 text-center shadow-[0_22px_50px_-18px_rgba(11,27,75,0.45)] transition-colors duration-500 ${
          hud.fired ? "bg-ink text-white" : "bg-white text-ink"
        }`}
        role="status"
      >
        <p className={`text-[11px] font-semibold ${hud.fired ? "text-amber" : "text-slate"}`}>{hud.fired ? "ALERTE · MULE PROBABLE" : "chaque réseau seul : sous le seuil"}</p>
        <p className="mt-1 font-display text-[1.7rem] font-bold leading-none tabular-nums">{nf.format(freezable)} F</p>
        <p className={`mt-1 text-[11px] ${hud.fired ? "text-mist" : "text-slate"}`}>encore gelables · alerte {delayMin} min après la 1re plainte</p>
      </div>
    </div>
  );
}
