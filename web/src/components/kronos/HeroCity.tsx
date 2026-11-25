"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Hero de KronosPI, d'après la référence « Norway Mountains » :
 * une ville de nuit vue du ciel (WebGL), nette à droite ; à gauche la même image passée au givre,
 * dans laquelle le mot KRONOSPI est découpé pour laisser voir la ville nette.
 * Des transferts traversent la ville ; trois convergent vers un même compte, qui s'allume en corail.
 */
const SODIUM = [0xffb04a, 0xffc879, 0xffe3bd, 0xfff4e6, 0xbfd6ff];

function sprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.2, "rgba(255,255,255,0.8)");
  r.addColorStop(0.5, "rgba(255,255,255,0.15)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Générateur pseudo-aléatoire stable : la ville est la même à chaque visite.
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export default function HeroCity({ word = "KRONOSPI" }: { word?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const glCanvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = host.current!;
    const cv = glCanvas.current!;
    const ov = overlay.current!;
    const ctx = ov.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = rng(7);

    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x070a14, 1);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070a14, 0.011);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    camera.position.set(0, 17, 24);
    camera.lookAt(0, 0, -6);
    const tex = sprite();

    // La ville : des avenues (lignes de lumières serrées), des quartiers (nappes), un front de mer sombre.
    const pts: number[] = [];
    const cols: number[] = [];
    const sizes: number[] = [];
    const c = new THREE.Color();
    const add = (x: number, z: number, size: number, hex: number, dim = 1) => {
      if (z < -70 || z > 22) return;
      pts.push(x, 0, z);
      c.set(hex).multiplyScalar(dim);
      cols.push(c.r, c.g, c.b);
      sizes.push(size);
    };
    // Avenues
    for (let a = 0; a < 44; a++) {
      const x0 = (rand() - 0.5) * 120;
      const z0 = 20 - rand() * 90;
      const ang = rand() * Math.PI;
      const len = 20 + rand() * 60;
      const n = Math.floor(len * 6);
      for (let i = 0; i < n; i++) {
        const t = i / n;
        add(x0 + Math.cos(ang) * len * t + (rand() - 0.5) * 0.25, z0 + Math.sin(ang) * len * t * 0.8, 0.35 + rand() * 0.35, SODIUM[rand() < 0.7 ? 0 : 1], 0.85);
      }
    }
    // Quartiers
    for (let q = 0; q < 60; q++) {
      const cx = (rand() - 0.5) * 110;
      const cz = 18 - rand() * 85;
      const spread = 2 + rand() * 7;
      const n = 220 + Math.floor(rand() * 420);
      for (let i = 0; i < n; i++) {
        const r = Math.pow(rand(), 0.7) * spread;
        const th = rand() * Math.PI * 2;
        add(cx + Math.cos(th) * r, cz + Math.sin(th) * r * 0.7, 0.18 + rand() * 0.42, SODIUM[Math.floor(rand() * SODIUM.length)], 0.35 + rand() * 0.65);
      }
    }
    // Poussière de lumières éparses
    for (let i = 0; i < 9000; i++) add((rand() - 0.5) * 140, 22 - rand() * 92, 0.12 + rand() * 0.2, SODIUM[Math.floor(rand() * 4)], 0.25 + rand() * 0.4);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    geo.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, scale: { value: 780 } },
      vertexShader: `attribute float size; varying vec3 vColor; uniform float scale;
        void main(){ vColor = color; vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec3 vColor;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vColor, 1.0) * t; }`,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const city = new THREE.Points(geo, mat);
    scene.add(city);
    // Halo de pollution lumineuse au-dessus de la ville
    for (const [x, z, s, o] of [[0, -30, 90, 0.22], [-30, -10, 60, 0.14], [28, -40, 70, 0.16]] as const) {
      const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xff9a3c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending }));
      h.position.set(x, 2, z);
      h.scale.set(s, s * 0.45, 1);
      scene.add(h);
    }

    // Transferts : arcs lumineux. Trois convergent vers le compte mule.
    const MULE = new THREE.Vector3(6, 0, -8);
    const sources = [new THREE.Vector3(-22, 0, 4), new THREE.Vector3(-8, 0, -30), new THREE.Vector3(24, 0, -22)];
    const others = [
      [new THREE.Vector3(-30, 0, -10), new THREE.Vector3(-4, 0, 10)],
      [new THREE.Vector3(18, 0, 8), new THREE.Vector3(34, 0, -40)],
    ];
    const SEG = 80;
    type Arc = { geo: THREE.BufferGeometry; mat: THREE.LineBasicMaterial; start: number; converge: boolean };
    const arcs: Arc[] = [];
    const mkArc = (a: THREE.Vector3, b: THREE.Vector3, start: number, converge: boolean) => {
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 6 + a.distanceTo(b) * 0.18, 0));
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(SEG));
      g.setDrawRange(0, 0);
      const m = new THREE.LineBasicMaterial({ color: converge ? 0xffd9a8 : 0x9fb8ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending });
      scene.add(new THREE.Line(g, m));
      arcs.push({ geo: g, mat: m, start, converge });
    };
    sources.forEach((s, i) => mkArc(s, MULE, 0.12 + i * 0.13, true));
    others.forEach(([a, b], i) => mkArc(a, b, 0.05 + i * 0.3, false));

    const coreMat = new THREE.SpriteMaterial({ map: tex, color: 0xff6a3d, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const core = new THREE.Sprite(coreMat);
    core.position.copy(MULE).add(new THREE.Vector3(0, 0.3, 0));
    scene.add(core);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1, 96),
      new THREE.MeshBasicMaterial({ color: 0xff6a3d, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(MULE).add(new THREE.Vector3(0, 0.05, 0));
    scene.add(ring);

    let W = 1;
    let H = 1;
    let fontPx = 100;
    const resize = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.fov = W < 760 ? 52 : 38;
      camera.updateProjectionMatrix();
      ov.width = W;
      ov.height = H;
      fontPx = Math.min(W / (word.length * 0.74), H * 0.3);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // La police réelle (next/font renomme la famille) : lue sur l'élément.
    const family = getComputedStyle(el).fontFamily || "system-ui, sans-serif";
    let fontReady = false;
    document.fonts.load(`800 100px ${family}`).finally(() => (fontReady = true));

    const drawOverlay = () => {
      const half = Math.round(W * 0.5);
      ctx.clearRect(0, 0, W, H);
      // Moitié gauche : la même ville, givrée
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, half, H);
      ctx.clip();
      ctx.filter = "blur(28px) saturate(1.35) brightness(2.3)";
      ctx.drawImage(cv, -40, -40, W + 80, H + 80);
      ctx.filter = "none";
      ctx.fillStyle = "rgba(40,30,30,0.18)";
      ctx.fillRect(0, 0, half, H);
      ctx.fillStyle = "rgba(255,236,214,0.16)";
      ctx.fillRect(0, 0, half, H);
      ctx.restore();
      if (!fontReady) return;
      ctx.font = `800 ${fontPx}px ${family}`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "center";
      const y = H * 0.56;
      // Le mot découpé dans le givre : on voit la ville nette au travers
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, half, H);
      ctx.clip();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillText(word, W / 2, y);
      ctx.restore();
      // Le même mot, plein et blanc, sur la moitié nette
      ctx.save();
      ctx.beginPath();
      ctx.rect(half, 0, W - half, H);
      ctx.clip();
      ctx.fillStyle = "#f5f5f7";
      ctx.fillText(word, W / 2, y);
      ctx.restore();
      // La couture entre les deux moitiés
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(half, 0, 1, H);
    };

    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(el);
    const timer = new THREE.Timer();
    let raf = 0;
    const CYCLE = 12;

    const frame = (fixed?: number) => {
      timer.update();
      const t = timer.getElapsed();
      const f = fixed ?? (t % CYCLE) / CYCLE;
      camera.position.x = Math.sin(t * 0.05) * 3;
      camera.lookAt(0, 0, -6);
      let arrived = 0;
      arcs.forEach((a) => {
        const p = THREE.MathUtils.clamp((f - a.start) / 0.12, 0, 1);
        const e = 1 - Math.pow(1 - p, 3);
        a.geo.setDrawRange(0, p > 0 ? Math.floor(e * SEG) + 1 : 0);
        a.mat.opacity = f > 0.92 ? Math.max(0, 1 - (f - 0.92) / 0.07) : p > 0 ? 0.9 : 0;
        if (a.converge && p >= 1) arrived++;
      });
      const fired = arrived >= 3 && f < 0.97;
      coreMat.opacity = THREE.MathUtils.lerp(coreMat.opacity, fired ? 1 : arrived * 0.15, 0.08);
      core.scale.setScalar(fired ? 6 + Math.sin(t * 5) * 0.6 : 3);
      const rm = ring.material as THREE.MeshBasicMaterial;
      if (fired) {
        const k = (t % 1.6) / 1.6;
        ring.scale.setScalar(1 + k * 9);
        rm.opacity = (1 - k) * 0.8;
      } else rm.opacity = 0;
      renderer.render(scene, camera);
      drawOverlay();
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (visible && !document.hidden) frame();
    };
    if (reduced) {
      document.fonts.ready.then(() => {
        fontReady = true;
        frame(0.6);
      });
    } else loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      geo.dispose();
      mat.dispose();
      tex.dispose();
      arcs.forEach((a) => {
        a.geo.dispose();
        a.mat.dispose();
      });
      renderer.dispose();
    };
  }, [word]);

  return (
    <div ref={host} className="absolute inset-0" aria-hidden>
      <canvas ref={glCanvas} className="absolute inset-0 h-full w-full" />
      <canvas ref={overlay} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
