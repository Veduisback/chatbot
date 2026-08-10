/* =========================================================
   THREE.JS INTERACTIVE 3D BACKGROUND
   ========================================================= */

(() => {
  "use strict";

  // Safely check if Three.js is loaded
  if (typeof THREE === "undefined") {
    console.warn("Three.js library is not loaded. 3D background disabled.");
    return;
  }

  const canvas = document.getElementById("three-bg");
  if (!canvas) {
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* -------------------------------------------------------
     1. Scene & Camera Setup
     ------------------------------------------------------- */
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 7;

  /* -------------------------------------------------------
     2. WebGL Renderer
     ------------------------------------------------------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  /* -------------------------------------------------------
     3. 3D Geometries & Materials
     ------------------------------------------------------- */
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // Outer Wireframe Orb
  const outerGeo = new THREE.IcosahedronGeometry(2.1, 2);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  mainGroup.add(outerMesh);

  // Inner Solid Glow Core
  const innerGeo = new THREE.IcosahedronGeometry(1.2, 2);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x6366f1,
    wireframe: true,
    transparent: true,
    opacity: 0.12
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  mainGroup.add(innerMesh);

  // Central Accent Point Light Glow Mesh
  const coreGeo = new THREE.SphereGeometry(0.55, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.4
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  mainGroup.add(coreMesh);

  /* -------------------------------------------------------
     4. Floating Particle Galaxy
     ------------------------------------------------------- */
  const particleCount = 280;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleScales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const radius = 2.8 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    particleScales[i] = Math.random();
  }

  particleGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const particleMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  mainGroup.add(particleSystem);

  /* -------------------------------------------------------
     5. Pointer / Mouse Interaction
     ------------------------------------------------------- */
  const mouse = { x: 0, y: 0 };
  const targetRotation = { x: 0, y: 0 };

  const onPointerMove = (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    mouse.x = x;
    mouse.y = y;
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });

  /* -------------------------------------------------------
     6. Animation Loop
     ------------------------------------------------------- */
  let animationFrameId = null;

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (!prefersReducedMotion) {
      // Ambient rotation
      outerMesh.rotation.x += 0.002;
      outerMesh.rotation.y += 0.0035;

      innerMesh.rotation.x -= 0.0015;
      innerMesh.rotation.y -= 0.0025;

      particleSystem.rotation.y += 0.0006;
      particleSystem.rotation.x += 0.0003;

      // Subtle float motion
      const time = performance.now() * 0.0008;
      mainGroup.position.y = Math.sin(time) * 0.18;
      mainGroup.position.x = Math.cos(time * 0.7) * 0.12;

      // Pulse core opacity
      coreMat.opacity = 0.35 + Math.sin(time * 2) * 0.15;
    }

    // Smooth mouse tilt tracking
    targetRotation.x = mouse.y * 0.45;
    targetRotation.y = mouse.x * 0.55;

    mainGroup.rotation.x += (targetRotation.x - mainGroup.rotation.x) * 0.03;
    mainGroup.rotation.y += (targetRotation.y - mainGroup.rotation.y) * 0.03;

    renderer.render(scene, camera);
  }

  animate();

  /* -------------------------------------------------------
     7. Resize Handler
     ------------------------------------------------------- */
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  /* -------------------------------------------------------
     8. Visibility Change (Performance Pause)
     ------------------------------------------------------- */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    } else {
      animate();
    }
  });

})();

