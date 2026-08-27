// three 0.184.0, sazet samostalan gradnja, kopija u public/vendor.
// Ne ucitava se sa tudjeg CDN-a: strani izvor bi mogao da servira bilo koji
// kod, a i ovako je upola lakse. Za nadogradnju vidi site/public/vendor/README.md.
import * as THREE from '/vendor/three.esm.js';

class RefineryScene extends HTMLElement {
  connectedCallback() {
    if (this._on) return; this._on = true;
    this.style.cssText += ';display:block;position:absolute;inset:0;width:100%;height:100%';
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { return; }
    this._renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.cssText = 'width:100%;height:100%;display:block';
    this.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040404);
    scene.fog = new THREE.FogExp2(0x040404, 0.013);
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 400);

    const steel = new THREE.MeshStandardMaterial({ color: 0x8f9296, metalness: .85, roughness: .38 });
    const steelDark = new THREE.MeshStandardMaterial({ color: 0x43464a, metalness: .8, roughness: .55 });
    const steelDim = new THREE.MeshStandardMaterial({ color: 0x63666a, metalness: .82, roughness: .5 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfecb0f, metalness: .25, roughness: .55, emissive: 0x201902 });
    const beaconMat = () => new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2200, emissiveIntensity: 2 });

    const world = new THREE.Group(); scene.add(world);
    const beacons = [];

    const ground = new THREE.Mesh(new THREE.CircleGeometry(160, 64), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: .1, roughness: .95 }));
    ground.rotation.x = -Math.PI / 2; world.add(ground);
    const grid = new THREE.GridHelper(220, 66, 0x25230f, 0x121208); grid.position.y = .02; world.add(grid);

    const cyl = (r1, r2, h, mat, seg = 24) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);

    const column = (x, z, r, h) => {
      const g = new THREE.Group();
      const body = cyl(r, r, h, steel); body.position.y = h / 2; g.add(body);
      const cap = cyl(r * .45, r * .75, r * 1.6, steelDim); cap.position.y = h + r * .8; g.add(cap);
      for (let y = h * .22; y < h; y += h * .22) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r + .12, .07, 8, 28), steelDark);
        ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring);
        const plat = cyl(r + .6, r + .6, .1, steelDark); plat.position.y = y + .06; g.add(plat);
      }
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(.16, h, .05), steelDark);
      ladder.position.set(r + .15, h / 2, 0); g.add(ladder);
      const b = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 10), beaconMat());
      b.position.y = h + r * 1.6 + .3; g.add(b); beacons.push({ m: b, p: Math.random() * 6 });
      g.position.set(x, 0, z); world.add(g); return g;
    };
    column(-4, -4, 1.5, 22); column(-8.5, -2, 1.1, 16); column(-12, -5, 0.9, 12); column(-6.5, -8, 1.25, 18.5);

    const tank = (x, z, r, h) => {
      const g = new THREE.Group();
      const body = cyl(r, r, h, steelDim, 36); body.position.y = h / 2; g.add(body);
      const roof = cyl(.4, r, r * .35, steelDark, 36); roof.position.y = h + r * .17; g.add(roof);
      const band = cyl(r + .03, r + .03, .5, yellowMat, 36); band.position.y = h * .72; g.add(band);
      g.position.set(x, 0, z); world.add(g);
    };
    tank(13, -8, 4.4, 5.4); tank(22.5, -4, 3.6, 4.6); tank(17, 2.5, 2.8, 3.8);

    const sphereTank = (x, z, r) => {
      const g = new THREE.Group();
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), steel); s.position.y = r + 1.1; g.add(s);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        const leg = cyl(.09, .09, r + 1.1, steelDark, 8);
        leg.position.set(Math.cos(a) * r * .72, (r + 1.1) / 2, Math.sin(a) * r * .72); g.add(leg);
      }
      const band = new THREE.Mesh(new THREE.TorusGeometry(r, .05, 8, 40), steelDark);
      band.rotation.x = Math.PI / 2; band.position.y = r + 1.1; g.add(band);
      g.position.set(x, 0, z); world.add(g);
    };
    sphereTank(7.5, 6.5, 2.3); sphereTank(12.5, 8.5, 2.3);

    const rack = new THREE.Group();
    const L = 46;
    for (let lvl = 0; lvl < 2; lvl++) {
      const y = 2.1 + lvl * 1.15;
      for (let i = 0; i < 4; i++) {
        const p = cyl(.14, .14, L, (i === 1 && lvl === 0) ? yellowMat : steelDim, 12);
        p.rotation.z = Math.PI / 2; p.position.set(0, y, i * .5 - 0.75); rack.add(p);
      }
    }
    for (let x = -L / 2; x <= L / 2; x += 7.6) {
      const postA = cyl(.09, .09, 3.3, steelDark, 8); postA.position.set(x, 1.65, -1.05); rack.add(postA);
      const postB = postA.clone(); postB.position.z = 1.05; rack.add(postB);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(.14, .14, 2.3), steelDark); beam.position.set(x, 3.32, 0); rack.add(beam);
    }
    rack.position.set(2, 0, 12); world.add(rack);

    const bld = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.BoxGeometry(7, 2.8, 4), new THREE.MeshStandardMaterial({ color: 0x2b2b2b, metalness: .2, roughness: .85 }));
    shell.position.y = 1.4; bld.add(shell);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(6.2, .7), new THREE.MeshBasicMaterial({ color: 0xffe9a6 }));
    win.position.set(0, 1.7, 2.01); bld.add(win);
    bld.position.set(-16, 0, 9); bld.rotation.y = .35; world.add(bld);

    const flare = new THREE.Group();
    const stack = cyl(.32, .42, 26, steelDim, 14); stack.position.y = 13; flare.add(stack);
    for (let i = 0; i < 3; i++) {
      const guy = cyl(.02, .02, 27, steelDark, 6);
      guy.position.y = 13; guy.rotation.z = .18; guy.rotation.y = i * 2.1; flare.add(guy);
    }
    const tex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 2, 64, 64, 62);
      gr.addColorStop(0, 'rgba(255,220,140,1)'); gr.addColorStop(.3, 'rgba(255,150,50,.9)'); gr.addColorStop(1, 'rgba(255,60,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    flame.scale.set(4, 5.5, 1); flame.position.y = 27.6; flare.add(flame);
    const flame2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, color: 0xffd080 }));
    flame2.scale.set(2, 3, 1); flame2.position.y = 27.2; flare.add(flame2);
    const flameLight = new THREE.PointLight(0xff9a3a, 180, 60, 1.8); flameLight.position.y = 27.5; flare.add(flameLight);
    flare.position.set(30, 0, -14); world.add(flare);

    const mast = new THREE.Group();
    const pole = cyl(.18, .26, 17, steelDark, 10); pole.position.y = 8.5; mast.add(pole);
    const pivot = new THREE.Group(); pivot.position.y = 17; mast.add(pivot);
    const tilt = new THREE.Group(); tilt.rotation.x = 0.62; pivot.add(tilt);
    const coneLen = 30;
    const coneGeo = new THREE.CylinderGeometry(.12, 7, coneLen, 28, 1, true); coneGeo.translate(0, -coneLen / 2, 0);
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xfecb0f, transparent: true, opacity: .05, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    tilt.add(cone);
    const spot = new THREE.SpotLight(0xfecb0f, 900, 70, .34, .5, 1.6);
    tilt.add(spot); spot.target.position.set(0, -coneLen, 0); tilt.add(spot.target);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.5, 14, 12), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xfecb0f, emissiveIntensity: 1.4 }));
    pivot.add(head);
    mast.position.set(-18, 0, -2); world.add(mast);

    scene.add(new THREE.HemisphereLight(0x35405c, 0x050505, .55));
    const moon = new THREE.DirectionalLight(0x7f93c4, .5); moon.position.set(-40, 55, -30); scene.add(moon);
    const sodium = (x, z) => {
      const l = new THREE.PointLight(0xffbf66, 60, 34, 2); l.position.set(x, 6, z); scene.add(l);
      const lampPole = cyl(.06, .09, 6, steelDark, 8); lampPole.position.set(x, 3, z); world.add(lampPole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); bulb.position.set(x, 6, z); world.add(bulb);
    };
    sodium(-2, 4); sodium(14, -2); sodium(-11, -10); sodium(24, 8);

    const fit = () => {
      const w = this.clientWidth || 1, h = this.clientHeight || 1;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    this._ro = new ResizeObserver(fit); this._ro.observe(this); fit();

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const drift = this.getAttribute('drift') !== '0';
    let visible = true;
    this._io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: .02 });
    this._io.observe(this);

    const clock = new THREE.Clock();
    let tAcc = 0;
    const frame = () => {
      this._raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), .05);
      if (!visible) return;
      tAcc += dt;
      const t = tAcc;
      const a = (drift ? t * .032 : 0) + 2.35;
      camera.position.set(Math.sin(a) * 46, 13.5 + Math.sin(t * .18) * 1.2, Math.cos(a) * 46);
      camera.lookAt(2, 7.5, -1);
      pivot.rotation.y = t * .5;
      flame.scale.set(3.4 + Math.sin(t * 11) * .7 + Math.random() * .5, 5 + Math.sin(t * 13) * .9 + Math.random() * .7, 1);
      flameLight.intensity = 150 + Math.sin(t * 17) * 40 + Math.random() * 50;
      for (const b of beacons) { b.m.material.emissiveIntensity = (Math.sin(t * 2.6 + b.p) > 0) ? 2.4 : .08; }
      renderer.render(scene, camera);
    };
    if (reduced) {
      camera.position.set(Math.sin(2.35) * 46, 13.5, Math.cos(2.35) * 46);
      camera.lookAt(2, 7.5, -1);
      renderer.render(scene, camera);
      requestAnimationFrame(() => { fit(); renderer.render(scene, camera); });
    } else frame();
  }
  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    this._ro && this._ro.disconnect(); this._io && this._io.disconnect();
    this._renderer && this._renderer.dispose(); this._on = false;
  }
}
customElements.define('refinery-scene', RefineryScene);
