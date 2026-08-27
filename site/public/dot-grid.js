// Prenos komponente DotGrid (React Bits, varijanta JS-CSS) na prilagodjeni
// element, jer na ovom sajtu nema Reacta. Racun mreze, bojenje po blizini i
// fizika odbijanja prate izvorni kod; guranje i elasticni povratak i dalje vodi
// GSAP InertiaPlugin. Izvor: https://reactbits.dev/r/DotGrid-JS-CSS.json
//
// Razlike u odnosu na izvornik, sve namerne:
//   - pokazivac krece van platna, da ugao ne zasvetli pre prvog pomeraja misa
//   - crtanje stoji dok je pozadina van ekrana, jer je sekcija visoka
//   - postuje se prefers-reduced-motion: mreza se iscrta jednom, bez kretanja
//   - odnos piksela je ogranicen na 2, isto kao u refinery-scene.js
// gsap 3.13.0, kopija u public/vendor umesto tudjeg CDN-a.
// Za nadogradnju vidi site/public/vendor/README.md.
import { gsap } from '/vendor/gsap.esm.js';
import { InertiaPlugin } from '/vendor/gsap-inertia.esm.js';

gsap.registerPlugin(InertiaPlugin);

const throttle = (func, limit) => {
  let lastCall = 0;
  return function (...args) {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

function hexToRgb(hex) {
  const m = String(hex).match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

class DotGrid extends HTMLElement {
  connectedCallback() {
    if (this._on) return;
    this._on = true;

    const num = (name, fallback) => {
      const v = parseFloat(this.getAttribute(name));
      return Number.isFinite(v) ? v : fallback;
    };
    this.dotSize = num('dot-size', 16);
    this.gap = num('gap', 32);
    this.proximity = num('proximity', 150);
    this.speedTrigger = num('speed-trigger', 100);
    this.shockRadius = num('shock-radius', 250);
    this.shockStrength = num('shock-strength', 5);
    this.maxSpeed = num('max-speed', 5000);
    this.resistance = num('resistance', 750);
    this.returnDuration = num('return-duration', 1.5);
    this.baseColor = this.getAttribute('base-color') || '#5227FF';
    this.activeColor = this.getAttribute('active-color') || '#5227FF';
    this.baseRgb = hexToRgb(this.baseColor);
    this.activeRgb = hexToRgb(this.activeColor);

    this.style.cssText += ';display:block;position:absolute;inset:0;pointer-events:none';
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    this.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    this.dots = [];
    this._animating = 0;
    this._visible = false;
    // Van platna, pa nijedna tacka nije aktivna pre prvog pomeraja misa.
    this.pointer = { x: -1e5, y: -1e5, vx: 0, vy: 0, speed: 0, lastTime: 0, lastX: 0, lastY: 0 };

    this.buildGrid();
    this._ro = new ResizeObserver(() => this.buildGrid());
    this._ro.observe(this);

    this._reduce = matchMedia('(prefers-reduced-motion: reduce)');
    if (this._reduce.matches) {
      this.draw();
      return;
    }

    this._io = new IntersectionObserver(
      (entries) => {
        this._visible = entries.some((e) => e.isIntersecting);
        if (this._visible) this.scheduleDraw();
        else this.stop();
      },
      { rootMargin: '120px' }
    );
    this._io.observe(this);

    this._onMove = throttle(this.handleMove.bind(this), 50);
    this._onClick = this.handleClick.bind(this);
    window.addEventListener('mousemove', this._onMove, { passive: true });
    window.addEventListener('click', this._onClick);
  }

  disconnectedCallback() {
    this.stop();
    this._ro && this._ro.disconnect();
    this._io && this._io.disconnect();
    this._onMove && window.removeEventListener('mousemove', this._onMove);
    this._onClick && window.removeEventListener('click', this._onClick);
    for (const dot of this.dots || []) gsap.killTweensOf(dot);
    this._on = false;
  }

  // Kadar se crta samo kad ima sta da se promeni: kad se mis pomeri ili dok
  // neka tacka jos leti. Mirna pozadina inace trosi kadar za istu sliku.
  scheduleDraw() {
    if (this._raf || !this._visible) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = 0;
      this.draw();
      if (this._animating > 0) this.scheduleDraw();
    });
  }

  stop() {
    if (!this._raf) return;
    cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  buildGrid() {
    const { width, height } = this.getBoundingClientRect();
    if (!width || !height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { dotSize, gap } = this;
    const cell = dotSize + gap;
    const cols = Math.floor((width + gap) / cell);
    const rows = Math.floor((height + gap) / cell);
    const startX = (width - (cell * cols - gap)) / 2 + dotSize / 2;
    const startY = (height - (cell * rows - gap)) / 2 + dotSize / 2;

    const dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({ cx: startX + x * cell, cy: startY + y * cell, xOffset: 0, yOffset: 0, _inertiaApplied: false });
      }
    }
    this.dots = dots;
    this.draw();
    // Rezervni CSS raster stoji dok GSAP ne stigne sa mreze, ili zauvek ako ne
    // stigne. Cim platno ima sta da pokaze, raster se sklanja da se ne dupla.
    this.style.backgroundImage = 'none';
  }

  draw() {
    const { ctx, canvas, dots, proximity, baseRgb, activeRgb, baseColor, dotSize } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const px = this.pointer.x;
    const py = this.pointer.y;
    const proxSq = proximity * proximity;
    const r = dotSize / 2;
    const TAU = Math.PI * 2;

    // Sve tacke van domasaja pokazivaca ulaze u jednu putanju i jedno bojenje.
    // Slika je ista kao kod crtanja tacku po tacku, a kadar je visestruko jeftiniji.
    const near = [];
    ctx.beginPath();
    for (const dot of dots) {
      const ox = dot.cx + dot.xOffset;
      const oy = dot.cy + dot.yOffset;
      const dx = dot.cx - px;
      const dy = dot.cy - py;
      const dsq = dx * dx + dy * dy;
      if (dsq <= proxSq) {
        near.push(ox, oy, 1 - Math.sqrt(dsq) / proximity);
        continue;
      }
      ctx.moveTo(ox + r, oy);
      ctx.arc(ox, oy, r, 0, TAU);
    }
    ctx.fillStyle = baseColor;
    ctx.fill();

    for (let i = 0; i < near.length; i += 3) {
      const ox = near[i];
      const oy = near[i + 1];
      const t = near[i + 2];
      ctx.beginPath();
      ctx.moveTo(ox + r, oy);
      ctx.arc(ox, oy, r, 0, TAU);
      ctx.fillStyle =
        'rgb(' +
        Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t) + ',' +
        Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t) + ',' +
        Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t) + ')';
      ctx.fill();
    }
  }

  // Zajednicki deo za guranje misem i za udar na klik: baci tacku sa datim
  // zamahom, pa je elasticno vrati na mesto.
  push(dot, pushX, pushY) {
    dot._inertiaApplied = true;
    gsap.killTweensOf(dot);
    // Brojac se vodi po tacki, ne po guranju. Tacku smemo da gurnemo ponovo dok
    // se jos elasticno vraca, a tada killTweensOf pojede onComplete starog
    // pokreta; da se broji po guranju, brojac se nikad ne bi vratio na nulu i
    // petlja bi ostala budna zauvek.
    if (!dot._live) {
      dot._live = true;
      this._animating++;
    }
    gsap.to(dot, {
      inertia: { xOffset: pushX, yOffset: pushY, resistance: this.resistance },
      onComplete: () => {
        gsap.to(dot, {
          xOffset: 0,
          yOffset: 0,
          duration: this.returnDuration,
          ease: 'elastic.out(1,0.75)',
          onComplete: () => {
            dot._live = false;
            this._animating = Math.max(0, this._animating - 1);
          },
        });
        dot._inertiaApplied = false;
      },
    });
    this.scheduleDraw();
  }

  handleMove(e) {
    const now = performance.now();
    const pr = this.pointer;
    const dt = pr.lastTime ? now - pr.lastTime : 16;
    const dx = e.clientX - pr.lastX;
    const dy = e.clientY - pr.lastY;
    let vx = (dx / dt) * 1000;
    let vy = (dy / dt) * 1000;
    let speed = Math.hypot(vx, vy);
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      vx *= scale;
      vy *= scale;
      speed = this.maxSpeed;
    }
    pr.lastTime = now;
    pr.lastX = e.clientX;
    pr.lastY = e.clientY;
    pr.vx = vx;
    pr.vy = vy;
    pr.speed = speed;

    const rect = this.canvas.getBoundingClientRect();
    pr.x = e.clientX - rect.left;
    pr.y = e.clientY - rect.top;

    for (const dot of this.dots) {
      const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
      if (speed > this.speedTrigger && dist < this.proximity && !dot._inertiaApplied) {
        this.push(dot, dot.cx - pr.x + vx * 0.005, dot.cy - pr.y + vy * 0.005);
      }
    }
    this.scheduleDraw();
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    for (const dot of this.dots) {
      const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
      if (dist < this.shockRadius && !dot._inertiaApplied) {
        const falloff = Math.max(0, 1 - dist / this.shockRadius);
        this.push(dot, (dot.cx - cx) * this.shockStrength * falloff, (dot.cy - cy) * this.shockStrength * falloff);
      }
    }
  }
}

customElements.define('dot-grid', DotGrid);
