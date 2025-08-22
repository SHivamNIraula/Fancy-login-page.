let scene, camera, renderer, controls, planet, mixer, stars;
let clock = new THREE.Clock();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(2, 1, 2);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  document
    .getElementById("canvas-container")
    .appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1.5;
  controls.maxDistance = 10;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  const rimLight = new THREE.DirectionalLight(0x4a9eff, 0.8);
  rimLight.position.set(-5, 2, -5);
  scene.add(rimLight);

  // Add the new stars background
  addNewStars();

  // Load the GLTF model
  loadPlanetModel();

  // Start animation loop
  animate();
}

function addNewStars() {
  // Create a sphere with random points inside (like the React version)
  const sphere = new Float32Array(5001 * 3);

  // Generate random points inside a sphere with radius 1.2
  for (let i = 0; i < sphere.length; i += 3) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = Math.cbrt(Math.random()) * 3; // Cube root for even distribution

    sphere[i] = radius * Math.sin(phi) * Math.cos(theta);
    sphere[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    sphere[i + 2] = radius * Math.cos(phi);
  }

  // Create geometry and material for stars
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(sphere, 3)
  );

  const starsMaterial = new THREE.PointsMaterial({
    color: 0xf272c8,
    size: 0.005,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
  });

  // Create points and add to scene
  stars = new THREE.Points(starsGeometry, starsMaterial);
  stars.rotation.x = Math.PI / 4;
  scene.add(stars);
}

function loadPlanetModel() {
  const loader = new THREE.GLTFLoader();

  // Note: Replace 'scene.gltf' with the actual path to your GLTF file
  loader.load(
    "scene.gltf", // Make sure this path is correct for your setup
    function (gltf) {
      planet = gltf.scene;

      // Scale and position the planet
      planet.scale.setScalar(1);
      planet.position.set(0, 0, 0);

      // Enable shadows
      planet.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(planet);

      // Setup animation mixer if animations exist
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(planet);
        gltf.animations.forEach((clip) => {
          mixer.clipAction(clip).play();
        });
      }

      // Hide loading screen
      document.getElementById("loading").style.display = "none";
    },
    function (progress) {
      // Loading progress
      const percent = (progress.loaded / progress.total) * 100;
      console.log(`Loading progress: ${percent}%`);
    },
    function (error) {
      console.error("Error loading GLTF model:", error);
      document.getElementById("loading").innerHTML = `
                <div class="spinner"></div>
                <p>Error loading model. Please check file paths.</p>
                <p style="font-size: 0.8rem; color: #ff6b6b; margin-top: 10px;">
                    Make sure scene.gltf, scene.bin, and texture files are in the correct location.
                </p>
            `;
    }
  );
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Update animation mixer
  if (mixer) {
    mixer.update(delta);
  }

  // Update star rotation (like the React version)
  if (stars) {
    stars.rotation.x -= delta / 10;
    stars.rotation.y -= delta / 15;
  }

  // Update controls
  controls.update();

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Event listeners
window.addEventListener("resize", onWindowResize, false);

// Initialize the scene
init();