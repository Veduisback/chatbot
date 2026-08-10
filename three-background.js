/* =========================================================
   THREE.JS INTERACTIVE BACKGROUND
   ========================================================= */

(() => {
  "use strict";


  /* -------------------------------------------------------
     Respect reduced motion
     ------------------------------------------------------- */

  const prefersReducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* -------------------------------------------------------
     Canvas
     ------------------------------------------------------- */

  const canvas =
    document.getElementById("three-bg");

  if (!canvas) {
    return;
  }


  /* -------------------------------------------------------
     Scene
     ------------------------------------------------------- */

  const scene =
    new THREE.Scene();


  /* -------------------------------------------------------
     Camera
     ------------------------------------------------------- */

  const camera =
    new THREE.PerspectiveCamera(
      45,
      window.innerWidth /
        window.innerHeight,
      0.1,
      100
    );

  camera.position.z = 6;


  /* -------------------------------------------------------
     Renderer
     ------------------------------------------------------- */

  const renderer =
    new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      1.5
    )
  );


  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );


  /* -------------------------------------------------------
     Main 3D object
     ------------------------------------------------------- */

  const geometry =
    new THREE.IcosahedronGeometry(
      1.65,
      2
    );


  /*
   * Transparent wireframe material.
   */

  const material =
    new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });


  const orb =
    new THREE.Mesh(
      geometry,
      material
    );


  scene.add(orb);


  /* -------------------------------------------------------
     Inner glowing core
     ------------------------------------------------------- */

  const coreGeometry =
    new THREE.IcosahedronGeometry(
      0.9,
      2
    );


  const coreMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });


  const core =
    new THREE.Mesh(
      coreGeometry,
      coreMaterial
    );


  scene.add(core);


  /* -------------------------------------------------------
     Small particles
     ------------------------------------------------------- */

  const particleCount = 180;

  const particleGeometry =
    new THREE.BufferGeometry();


  const positions =
    new Float32Array(
      particleCount * 3
    );


  for (
    let i = 0;
    i < particleCount;
    i++
  ) {

    const radius =
      2.3 +
      Math.random() * 1.8;

    const theta =
      Math.random() *
      Math.PI *
      2;

    const phi =
      Math.acos(
        2 * Math.random() - 1
      );


    positions[i * 3] =
      radius *
      Math.sin(phi) *
      Math.cos(theta);

    positions[i * 3 + 1] =
      radius *
      Math.sin(phi) *
      Math.sin(theta);

    positions[i * 3 + 2] =
      radius *
      Math.cos(phi);
  }


  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      positions,
      3
    )
  );


  const particleMaterial =
    new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 0.025,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });


  const particles =
    new THREE.Points(
      particleGeometry,
      particleMaterial
    );


  scene.add(particles);


  /* -------------------------------------------------------
     Mouse
     ------------------------------------------------------- */

  const mouse = {
    x: 0,
    y: 0
  };


  const targetRotation = {
    x: 0,
    y: 0
  };


  window.addEventListener(
    "mousemove",
    (event) => {

      mouse.x =
        (event.clientX /
          window.innerWidth) *
          2 -
        1;

      mouse.y =
        (event.clientY /
          window.innerHeight) *
          2 -
        1;

    },
    {
      passive: true
    }
  );


  /* -------------------------------------------------------
     Touch support
     ------------------------------------------------------- */

  window.addEventListener(
    "touchmove",
    (event) => {

      if (
        !event.touches ||
        !event.touches[0]
      ) {
        return;
      }

      mouse.x =
        (event.touches[0].clientX /
          window.innerWidth) *
          2 -
        1;

      mouse.y =
        (event.touches[0].clientY /
          window.innerHeight) *
          2 -
        1;

    },
    {
      passive: true
    }
  );


  /* -------------------------------------------------------
     Animation
     ------------------------------------------------------- */

  let animationFrame;


  function animate() {

    animationFrame =
      requestAnimationFrame(
        animate
      );


    /*
     * Automatic rotation.
     */

    if (!prefersReducedMotion) {

      orb.rotation.x +=
        0.0025;

      orb.rotation.y +=
        0.004;

      core.rotation.x -=
        0.0015;

      core.rotation.y -=
        0.0025;

      particles.rotation.y +=
        0.0005;
    }


    /*
     * Mouse interaction.
     *
     * Smoothly follow the cursor
     * instead of snapping.
     */

    targetRotation.x =
      mouse.y * 0.35;

    targetRotation.y =
      mouse.x * 0.45;


    orb.rotation.x +=
      (
        targetRotation.x -
        orb.rotation.x
      ) * 0.015;

    orb.rotation.y +=
      (
        targetRotation.y -
        orb.rotation.y
      ) * 0.015;


    /*
     * Subtle floating motion.
     */

    if (!prefersReducedMotion) {

      const time =
        performance.now() * 0.0005;

      orb.position.y =
        Math.sin(time) * 0.12;

      core.position.y =
        Math.sin(time + 0.5) * 0.08;
    }


    renderer.render(
      scene,
      camera
    );
  }


  animate();


  /* -------------------------------------------------------
     Resize
     ------------------------------------------------------- */

  window.addEventListener(
    "resize",
    () => {

      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();


      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );


      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio,
          1.5
        )
      );

    }
  );


  /* -------------------------------------------------------
     Cleanup if page is hidden
     ------------------------------------------------------- */

  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.hidden
      ) {

        cancelAnimationFrame(
          animationFrame
        );

      } else {

        animate();

      }

    }
  );

})();
