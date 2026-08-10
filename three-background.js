/* =========================================================
   THREE.JS INTERACTIVE 3D BACKGROUND WITH GLSL FRAGMENT SHADER
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
     3. Custom GLSL Fragment Shader Background Quad
     ------------------------------------------------------- */
  const shaderUniforms = {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) }
  };

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;

    varying vec2 vUv;

    // Hash function for procedural noise
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    // 2D Noise
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // Fractal Brownian Motion (FBM)
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 5; ++i) {
        v += a * noise(p);
        p = rot * p * 2.0 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

      // Mouse position influence
      vec2 mouse = (u_mouse - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
      float distToMouse = length(uv - mouse);
      float mouseGlow = smoothstep(0.55, 0.0, distToMouse);

      float t = u_time * 0.12;

      // Domain warping for cosmic nebula
      vec2 q = vec2(fbm(uv + vec2(t * 0.15, t * 0.1)), fbm(uv + vec2(0.2, 0.3)));
      vec2 r = vec2(fbm(uv + 3.5 * q + vec2(t * 0.1, t * 0.2)), fbm(uv + 3.5 * q + vec2(0.4, 0.1)));

      float f = fbm(uv + 3.5 * r + mouse * 0.25);

      // Deep space color palette
      vec3 deepSpace = vec3(0.02, 0.03, 0.08); // Dark cosmic void
      vec3 nebulaViolet = vec3(0.32, 0.12, 0.58); // Indigo / Purple
      vec3 cyanGlow = vec3(0.08, 0.60, 0.92); // Electric Cyan
      vec3 magentaPulse = vec3(0.88, 0.20, 0.58); // Pink Magenta

      vec3 color = mix(deepSpace, nebulaViolet, clamp(f * f * 2.8, 0.0, 1.0));
      color = mix(color, cyanGlow, clamp(length(q), 0.0, 1.0));
      color = mix(color, magentaPulse, clamp(length(r.x), 0.0, 1.0));

      // Interactive mouse energy wave
      color += cyanGlow * mouseGlow * 0.3;

      // Procedural Starfield
      float starChance = hash(uv * 140.0);
      if (starChance > 0.984) {
        float starTwinkle = sin(u_time * 2.5 + starChance * 100.0) * 0.5 + 0.5;
        color += vec3(0.9, 0.95, 1.0) * starTwinkle * 0.65;
      }

      // Vignette effect
      float vignette = 1.0 - smoothstep(0.5, 1.5, length(st - 0.5) * 1.4);
      color *= vignette;

      gl_FragColor = vec4(color, 0.88);
    }
  `;

  // Fullscreen Quad Scene for Background Shader
  const shaderScene = new THREE.Scene();
  const shaderCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: shaderUniforms,
    depthWrite: false,
    depthTest: false
  });
  const shaderQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
  shaderScene.add(shaderQuad);

  /* -------------------------------------------------------
     4. 3D Objects & Interactive Meshes
     ------------------------------------------------------- */
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // Central Outer Wireframe Orb
  const outerGeo = new THREE.IcosahedronGeometry(1.8, 2);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  mainGroup.add(outerMesh);

  // Central Inner Solid Glow Core
  const innerGeo = new THREE.IcosahedronGeometry(1.0, 2);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0x6366f1,
    wireframe: true,
    transparent: true,
    opacity: 0.22
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  mainGroup.add(innerMesh);

  // Central Ring Torus
  const ringGeo = new THREE.TorusGeometry(2.4, 0.025, 16, 100);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 3;
  mainGroup.add(ringMesh);

  // Left Interactable Prism (Octahedron)
  const leftGeo = new THREE.OctahedronGeometry(0.85, 0);
  const leftMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
  const leftMesh = new THREE.Mesh(leftGeo, leftMat);
  leftMesh.position.set(-4.2, 1.2, -1.5);
  leftMesh.name = "leftPrism";
  scene.add(leftMesh);

  // Right Interactable Crystal (Dodecahedron)
  const rightGeo = new THREE.DodecahedronGeometry(0.75, 0);
  const rightMat = new THREE.MeshBasicMaterial({
    color: 0xec4899,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
  const rightMesh = new THREE.Mesh(rightGeo, rightMat);
  rightMesh.position.set(4.2, -1.0, -1.2);
  rightMesh.name = "rightPrism";
  scene.add(rightMesh);

  /* -------------------------------------------------------
     5. Floating Particle Galaxy
     ------------------------------------------------------- */
  const particleCount = 350;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const radius = 2.5 + Math.random() * 4.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
  }

  particleGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3)
  );

  const particleMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.04,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  mainGroup.add(particleSystem);

  /* -------------------------------------------------------
     6. Pointer, Raycasting & Mouse Interaction
     ------------------------------------------------------- */
  const mouse = { x: 0, y: 0 };
  const targetRotation = { x: 0, y: 0 };
  const raycaster = new THREE.Raycaster();
  const mouseVector = new THREE.Vector2();

  const interactableObjects = [outerMesh, leftMesh, rightMesh];
  let hoveredObject = null;

  const onPointerMove = (event) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    mouse.x = x;
    mouse.y = y;

    mouseVector.x = x;
    mouseVector.y = y;

    // Update GLSL shader mouse uniform
    shaderUniforms.u_mouse.value.set(
      event.clientX / window.innerWidth,
      1.0 - event.clientY / window.innerHeight
    );
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });

  /* -------------------------------------------------------
     7. Animation Loop
     ------------------------------------------------------- */
  let animationFrameId = null;

  function animate(timestamp) {
    animationFrameId = requestAnimationFrame(animate);

    const timeSeconds = timestamp * 0.001;
    shaderUniforms.u_time.value = timeSeconds;

    if (!prefersReducedMotion) {
      // Ambient rotation of 3D objects
      outerMesh.rotation.x += 0.0025;
      outerMesh.rotation.y += 0.004;

      innerMesh.rotation.x -= 0.002;
      innerMesh.rotation.y -= 0.003;

      ringMesh.rotation.z += 0.003;

      leftMesh.rotation.x += 0.008;
      leftMesh.rotation.y += 0.006;

      rightMesh.rotation.x -= 0.007;
      rightMesh.rotation.y += 0.009;

      particleSystem.rotation.y += 0.0008;
      particleSystem.rotation.x += 0.0004;

      // Floating motion
      mainGroup.position.y = Math.sin(timeSeconds * 0.8) * 0.2;
      mainGroup.position.x = Math.cos(timeSeconds * 0.6) * 0.15;

      leftMesh.position.y = 1.2 + Math.sin(timeSeconds * 1.2) * 0.25;
      rightMesh.position.y = -1.0 + Math.cos(timeSeconds * 1.1) * 0.25;
    }

    // Smooth Mouse Orientation / 3D Tilt Tracking
    targetRotation.x = mouse.y * 0.55;
    targetRotation.y = mouse.x * 0.65;

    mainGroup.rotation.x += (targetRotation.x - mainGroup.rotation.x) * 0.04;
    mainGroup.rotation.y += (targetRotation.y - mainGroup.rotation.y) * 0.04;

    // Raycast mouse interaction for 3D objects
    raycaster.setFromCamera(mouseVector, camera);
    const intersects = raycaster.intersectObjects(interactableObjects);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      if (hoveredObject !== hitObj) {
        hoveredObject = hitObj;
      }
      // Scale & intensity pulse on hover
      hitObj.scale.lerp(new THREE.Vector3(1.25, 1.25, 1.25), 0.1);
      if (hitObj.material) {
        hitObj.material.opacity = 0.9;
      }
    } else {
      interactableObjects.forEach((obj) => {
        obj.scale.lerp(new THREE.Vector3(1.0, 1.0, 1.0), 0.1);
        if (obj === outerMesh) obj.material.opacity = 0.35;
        if (obj === leftMesh || obj === rightMesh) obj.material.opacity = 0.5;
      });
      hoveredObject = null;
    }

    // Render step: Shader Background first, then 3D Scene over top
    renderer.autoClear = false;
    renderer.clear();
    renderer.render(shaderScene, shaderCamera);
    renderer.render(scene, camera);
  }

  animate(0);

  /* -------------------------------------------------------
     8. Resize Handler
     ------------------------------------------------------- */
  window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    shaderUniforms.u_resolution.value.set(width, height);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  /* -------------------------------------------------------
     9. Visibility Change (Performance Pause)
     ------------------------------------------------------- */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    } else {
      animate(performance.now());
    }
  });

})();
