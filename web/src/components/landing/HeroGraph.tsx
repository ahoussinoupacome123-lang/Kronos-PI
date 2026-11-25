"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type HeroEvent = { ts: string; operator: string; amount: number; order: number };

type Props = {
  events: HeroEvent[];
  firesAt: string;
  totalFcfa: number;
  delayMin: number;
};

const OP_COLORS: Record<string, number> = {
  ALPHAMONEY: 0x7d8cff,
  BETACASH: 0x7cc4a4,
  GAMMAPAY: 0xe8b04b,
};
const OP_POS: Record<string, THREE.Vector3> = {
  ALPHAMONEY: new THREE.Vector3(-4.2, 1.5, -0.6),
  BETACASH: new THREE.Vector3(4.4, 1.1, -1.2),
  GAMMAPAY: new THREE.Vector3(0.2, -2.9, 0.6),
};
const CENTER = new THREE.Vector3(0.3, 0.2, 0.9);
const LATERITE = 0xe0643a;

const CYCLE = 16; // secondes par boucle de scénario
const T_START = 0.08; // fraction de la boucle où arrive la 1re plainte
const T_END = 0.72;

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, "rgba(255,255,255,0.75)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.18)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function fmtClock(ms: number) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" }).format(new Date(ms));
}

export default function HeroGraph({ events, firesAt, totalFcfa, delayMin }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState({ clock: "14:02", count: 0, ops: 0, fired: false, amount: 0 });
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);

    const t0 = new Date(events[0].ts).getTime() - 7 * 60_000; // 14:02, l'heure du faux SMS
    const tFire = new Date(firesAt).getTime();
    const tLast = new Date(events[events.length - 1].ts).getTime();
    const span = tLast - t0;
    const toFrac = (ms: number) => T_START + ((ms - t0) / span) * (T_END - T_START);
    const fireFrac = toFrac(tFire);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e1a, 0.028);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.4, 14);

    const root = new THREE.Group();
    scene.add(root);
    const tex = glowTexture();

    // Poussière de fond : les 20 000 plaintes qui, seules, ne disent rien.
    const dustCount = 1400;
    const dustPos = new Float32Array(dustCount * 3);
    const dustCol = new Float32Array(dustCount * 3);
    const tmpC = new THREE.Color();
    for (let i = 0; i < dustCount; i++) {
      const r = 6 + Math.random() * 9;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      dustPos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.55, r * Math.sin(ph) * Math.sin(th) - 3], i * 3);
      tmpC.set(0xece5d6).multiplyScalar(0.25 + Math.random() * 0.35);
      dustCol.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    dustGeo.setAttribute("color", new THREE.BufferAttribute(dustCol, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ size: 0.085, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, map: tex, blending: THREE.AdditiveBlending }),
    );
    root.add(dust);

    // Trois réseaux : chaque opérateur est un nuage de clients.
    const clusters: THREE.Points[] = [];
    for (const [op, pos] of Object.entries(OP_POS)) {
      const n = 260;
      const p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = Math.pow(Math.random(), 0.6) * 1.35;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        p.set([pos.x + r * Math.sin(ph) * Math.cos(th), pos.y + r * Math.cos(ph), pos.z + r * Math.sin(ph) * Math.sin(th)], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(p, 3));
      const pts = new THREE.Points(
        g,
        new THREE.PointsMaterial({ size: 0.24, color: OP_COLORS[op], transparent: true, opacity: 1, depthWrite: false, map: tex, blending: THREE.AdditiveBlending }),
      );
      clusters.push(pts);
      root.add(pts);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: OP_COLORS[op], transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
      halo.position.copy(pos);
      halo.scale.setScalar(6.5);
      root.add(halo);
    }

    // Le compte bénéficiaire (alias haché) : invisible jusqu'à ce que les plaintes convergent.
    const coreMat = new THREE.SpriteMaterial({ map: tex, color: 0xece5d6, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
    const core = new THREE.Sprite(coreMat);
    core.position.copy(CENTER);
    core.scale.setScalar(1.2);
    root.add(core);
    const coreDot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), new THREE.MeshBasicMaterial({ color: 0xece5d6 }));
    coreDot.position.copy(CENTER);
    root.add(coreDot);

    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.98, 1, 96),
        new THREE.MeshBasicMaterial({ color: LATERITE, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      ring.position.copy(CENTER);
      rings.push(ring);
      root.add(ring);
    }

    // Les plaintes de la campagne : un arc par victime, de son réseau vers le compte mule.
    type Arc = { line: THREE.Line; head: THREE.Sprite; curve: THREE.QuadraticBezierCurve3; start: number; mat: THREE.LineBasicMaterial; color: number; op: string };
    const SEG = 64;
    const arcs: Arc[] = events.map((e, i) => {
      const from = OP_POS[e.operator].clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1));
      const mid = from.clone().lerp(CENTER, 0.5).add(new THREE.Vector3(0, 1.6 + (i % 3) * 0.5, 1.2));
      const curve = new THREE.QuadraticBezierCurve3(from, mid, CENTER.clone());
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(SEG));
      geo.setDrawRange(0, 0);
      const mat = new THREE.LineBasicMaterial({ color: OP_COLORS[e.operator], transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
      const line = new THREE.Line(geo, mat);
      const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: OP_COLORS[e.operator], transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      head.scale.setScalar(0.7);
      root.add(line, head);
      return { line, head, curve, start: toFrac(new Date(e.ts).getTime()), mat, color: OP_COLORS[e.operator], op: e.operator };
    });

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w < 700 ? 19 : 15;
      // Sur grand écran, le graphe vit à droite du titre ; sur mobile, il passe derrière, plus discret.
      root.position.x = w >= 1024 ? 3.4 : 0;
      root.scale.setScalar(w >= 1024 ? 0.86 : 1);
      root.position.y = w >= 1024 ? 0 : -2.2;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (ev: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      pointer.tx = ((ev.clientX - r.left) / r.width - 0.5) * 2;
      pointer.ty = ((ev.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(mount);

    const clock = new THREE.Clock();
    let raf = 0;
    let lastHud = "";
    const ARC_DUR = 0.07;

    const frame = (fixedT?: number) => {
      const elapsed = clock.getElapsedTime();
      const f = fixedT ?? (elapsed % CYCLE) / CYCLE;

      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      root.rotation.y = Math.sin(elapsed * 0.08) * 0.18 + pointer.x * 0.22;
      root.rotation.x = pointer.y * 0.1 - 0.04;
      dust.rotation.y = elapsed * 0.012;
      clusters.forEach((c, i) => (c.rotation.y = elapsed * (0.05 + i * 0.02)));

      let arrived = 0;
      const opsArrived = new Set<string>();
      let amount = 0;
      arcs.forEach((a, i) => {
        const p = THREE.MathUtils.clamp((f - a.start) / ARC_DUR, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const n = Math.floor(eased * SEG) + 1;
        a.line.geometry.setDrawRange(0, p > 0 ? n : 0);
        const fade = f > 0.93 ? Math.max(0, 1 - (f - 0.93) / 0.06) : 1;
        a.mat.opacity = 0.9 * fade;
        if (p > 0 && p < 1) {
          a.head.position.copy(a.curve.getPoint(eased));
          (a.head.material as THREE.SpriteMaterial).opacity = 1;
        } else {
          (a.head.material as THREE.SpriteMaterial).opacity = 0;
        }
        if (p >= 1) {
          arrived++;
          opsArrived.add(a.op);
          amount += events[i].amount;
        }
      });

      const fired = f >= fireFrac && f < 0.97;
      const since = fired ? (f - fireFrac) * CYCLE : 0;
      rings.forEach((r, i) => {
        const m = r.material as THREE.MeshBasicMaterial;
        if (!fired) {
          m.opacity = 0;
          return;
        }
        const k = ((since + i * 0.55) % 1.65) / 1.65;
        r.scale.setScalar(0.4 + k * 2.6);
        m.opacity = (1 - k) * 0.8;
        r.lookAt(camera.position);
      });
      const targetColor = new THREE.Color(fired ? LATERITE : 0xece5d6);
      coreMat.color.lerp(targetColor, 0.08);
      (coreDot.material as THREE.MeshBasicMaterial).color.lerp(targetColor, 0.08);
      const coreScale = fired ? 2.6 + Math.sin(elapsed * 4) * 0.25 : 1 + arrived * 0.18;
      core.scale.setScalar(THREE.MathUtils.lerp(core.scale.x, coreScale, 0.08));
      coreMat.opacity = THREE.MathUtils.lerp(coreMat.opacity, fired ? 0.95 : 0.3 + arrived * 0.08, 0.08);

      renderer.render(scene, camera);

      const simMs = t0 + ((Math.min(Math.max(f, T_START), 0.95) - T_START) / (T_END - T_START)) * span;
      const next = `${fmtClock(simMs)}|${arrived}|${opsArrived.size}|${fired}|${amount}`;
      if (next !== lastHud) {
        lastHud = next;
        setHud({ clock: fmtClock(simMs), count: arrived, ops: opsArrived.size, fired, amount });
      }
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (visible && !document.hidden) frame();
    };
    if (prefersReduced) {
      frame(0.8);
    } else {
      loop();
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      tex.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [events, firesAt]);

  return (
    <div className="absolute inset-0">
      <div ref={mountRef} className="absolute inset-0 [&>canvas]:h-full [&>canvas]:w-full" aria-hidden="true" />

      {/* Tableau de bord du scénario, synchronisé sur l'animation */}
      <div
        className="on-ink pointer-events-none absolute bottom-5 right-5 hidden w-[19rem] rounded-2xl border border-white/10 bg-ink/70 p-4 text-cream backdrop-blur-md md:block"
        role="status"
        aria-live="off"
      >
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-mist">Mardi 17 novembre · scénario CMP-01</span>
          <span className="font-mono text-lg tabular-nums">{hud.clock}</span>
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white/5 px-2 py-2">
            <dt className="text-[11px] text-mist">plaintes</dt>
            <dd className="font-mono text-xl tabular-nums">{hud.count}</dd>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-2">
            <dt className="text-[11px] text-mist">réseaux</dt>
            <dd className="font-mono text-xl tabular-nums">{hud.ops}</dd>
          </div>
          <div className="rounded-lg bg-white/5 px-2 py-2">
            <dt className="text-[11px] text-mist">seuil</dt>
            <dd className="font-mono text-xl tabular-nums">3 · 2</dd>
          </div>
        </dl>
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm transition-colors duration-500 ${
            hud.fired || reduced ? "bg-laterite/20 text-[#ffb59a]" : "bg-white/5 text-mist"
          }`}
        >
          {hud.fired || reduced
            ? `Mule probable · alerte ${delayMin} min après la 1re plainte · ${new Intl.NumberFormat("fr-FR").format(totalFcfa)} FCFA encore gelables`
            : "Chaque réseau ne voit que ses propres plaintes. En dessous du seuil."}
        </p>
      </div>
    </div>
  );
}
