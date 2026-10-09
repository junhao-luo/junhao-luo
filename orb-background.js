/**
 * ELJHON STEVE (羅俊豪) - AI ORB BACKGROUND ENGINE (HIGH PERFORMANCE)
 * The decorative effect loads after page content and stops when it is hidden.
 * Fewer particles, capped resolution, and a 30 fps limit bound its rendering cost.
 */
async function initAiOrb() {
  const canvas = document.getElementById('aiOrbCanvas');
  if (!canvas) return;
  const THREE = await import('three');

  const isMobile = window.innerWidth < 768;
  const COUNT = isMobile ? 700 : 1800;
  const SPEED_MULT = 0.95;

  // SCENE SETUP
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.007);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1500);
  camera.position.set(0, 0, 105);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false,
    powerPreference: 'low-power',
    alpha: false,
    stencil: false,
    depth: true
  });
  renderer.setClearColor(0x000000, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 0.75 : 1));

  // SWARM OBJECTS & GEOMETRY
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  // Low-poly crisp tetrahedron particles
  const geometry = new THREE.TetrahedronGeometry(isMobile ? 0.30 : 0.38);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const instancedMesh = new THREE.InstancedMesh(geometry, material, COUNT);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(instancedMesh);

  // PRECOMPUTED STATIC BUFFERS (Eliminates millions of per-frame Math calls)
  const golden = 2.399963229728653;
  const baseCoords = new Float32Array(COUNT * 3); // bx, by, bz
  const baseTh = new Float32Array(COUNT);
  const posBuffer = new Float32Array(COUNT * 3); // px, py, pz (current lerped)

  for (let i = 0; i < COUNT; i++) {
    const frac = (i + 0.5) / COUNT;
    const y0 = 1.0 - 2.0 * frac;
    const r0 = Math.sqrt(Math.max(0.0, 1.0 - y0 * y0));
    const th = golden * i;

    const idx3 = i * 3;
    baseCoords[idx3 + 0] = r0 * Math.cos(th);
    baseCoords[idx3 + 1] = y0;
    baseCoords[idx3 + 2] = r0 * Math.sin(th);
    baseTh[i] = th;

    posBuffer[idx3 + 0] = (Math.random() - 0.5) * 110;
    posBuffer[idx3 + 1] = (Math.random() - 0.5) * 110;
    posBuffer[idx3 + 2] = (Math.random() - 0.5) * 110;

    // PRE-BAKE BLUE SPECTRUM COLORS ONCE (Cyan #00e5ff -> Azure #38bdf8 -> Cobalt #0066ff)
    const swirl = 0.5 + 0.5 * Math.sin(y0 * 2.5 + th * 0.4);
    const blueHue = 0.50 + 0.14 * swirl;
    const sat = 0.90 + 0.10 * swirl;
    const light = Math.min(0.85, Math.max(0.28, 0.52 + 0.18 * Math.abs(y0)));
    color.setHSL(blueHue, sat, light);
    instancedMesh.setColorAt(i, color);

    dummy.position.set(posBuffer[idx3], posBuffer[idx3 + 1], posBuffer[idx3 + 2]);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }
  instancedMesh.instanceColor.needsUpdate = true;
  instancedMesh.instanceMatrix.needsUpdate = true;

  // SWARM DYNAMICS
  const radius = isMobile ? 65 : 82;
  const flow = 0.44;
  const turb = 0.28;
  const shell = 0.24;

  // MOUSE & SCROLL PARALLAX (Throttled & Smooth)
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollY = 0;
  let targetScrollY = 0;

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY || document.documentElement.scrollTop;
  }, { passive: true });

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const transparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)');
  const contrastQuery = window.matchMedia('(prefers-contrast: more)');

  // ANIMATION LOOP WITH TAB VISIBILITY SLEEP
  const clock = new THREE.Clock();
  let animFrameId = null;
  let isRunning = false;
  let lastFrame = 0;

  function animate(now) {
    if (!isRunning) return;
    animFrameId = requestAnimationFrame(animate);
    if (now - lastFrame < 1000 / 30) return;
    lastFrame = now;

    const time = clock.getElapsedTime() * SPEED_MULT;
    const t = time * flow;

    // Smooth mouse & scroll lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;
    scrollY += (targetScrollY - scrollY) * 0.05;

    // Responsive subtle camera drift
    camera.position.x = mouse.x * 18;
    camera.position.y = mouse.y * 14 - (scrollY * 0.012);
    camera.lookAt(0, 0, 0);

    // Subtle global rotation
    instancedMesh.rotation.y = time * 0.06 + (scrollY * 0.0006);
    instancedMesh.rotation.x = mouse.y * 0.12;

    // Fast orbital rotation trigonometry computed once per frame
    const rotA = t * 0.22;
    const cA = Math.cos(rotA);
    const sA = Math.sin(rotA);
    const breath = 1.0 + 0.05 * Math.sin(t * 1.1);
    const dist = turb * 0.20;

    // SWARM PARTICLES UPDATE (Vectorized Typed Array Loop)
    for (let i = 0; i < COUNT; i++) {
      const idx3 = i * 3;
      const bx = baseCoords[idx3 + 0];
      const by = baseCoords[idx3 + 1];
      const bz = baseCoords[idx3 + 2];
      const th = baseTh[i];

      // Streamlined harmonic turbulence
      const w1 = Math.sin(3.0 * bx + t * 1.5) * Math.cos(2.0 * by - t);
      const w2 = Math.cos(3.0 * bz - t * 1.2) * Math.sin(2.0 * by + t);

      const rMod = breath * (1.0 - shell * 0.25 * Math.sin(th * 0.5 + t));
      const xr = bx * cA - bz * sA;
      const zr = bx * sA + bz * cA;

      const tx = (xr + w1 * dist) * radius * rMod;
      const ty = (by + w2 * dist * 1.1) * radius * rMod;
      const tz = (zr + w1 * dist) * radius * rMod;

      // Fast position lerp
      posBuffer[idx3 + 0] += (tx - posBuffer[idx3 + 0]) * 0.09;
      posBuffer[idx3 + 1] += (ty - posBuffer[idx3 + 1]) * 0.09;
      posBuffer[idx3 + 2] += (tz - posBuffer[idx3 + 2]) * 0.09;

      dummy.position.set(posBuffer[idx3 + 0], posBuffer[idx3 + 1], posBuffer[idx3 + 2]);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  // TAB VISIBILITY SLEEP (Zero battery drain when tab is backgrounded)
  function updatePlayback() {
    const shouldRun = !document.hidden && !motionQuery.matches && !transparencyQuery.matches && !contrastQuery.matches;
    if (shouldRun === isRunning) return;
    isRunning = shouldRun;
    if (isRunning) {
      lastFrame = 0;
      clock.start();
      animFrameId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }
  document.addEventListener('visibilitychange', updatePlayback);
  for (const query of [motionQuery, transparencyQuery, contrastQuery]) query.addEventListener('change', updatePlayback);
  renderer.render(scene, camera);
  updatePlayback();

  // PASSIVE RESIZE HANDLER WITH DEBOUNCE
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (!isRunning && !document.hidden) renderer.render(scene, camera);
    }, 150);
  }, { passive: true });
}

function scheduleAiOrb() {
  const start = () => initAiOrb().catch(error => console.warn('Decorative background unavailable:', error));
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, {timeout: 1500});
  else setTimeout(start, 0);
}
if (document.readyState === 'complete') scheduleAiOrb();
else window.addEventListener('load', scheduleAiOrb, {once: true});
