// network.js – red 3D que se alimenta de eventos de audio (sílabas)

let scene, camera, renderer;
let nodeGroup, edgeGroup;
let lastNode = null;
let nodes = [];

function initScene() {
  const container = document.getElementById("three-container");
  const { clientWidth: width, clientHeight: height } = container;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050509);

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
  camera.position.set(0, 0, 220);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(80, 120, 160);
  scene.add(dir);

  nodeGroup = new THREE.Group();
  edgeGroup = new THREE.Group();
  scene.add(edgeGroup);
  scene.add(nodeGroup);

  window.addEventListener("resize", onResize);

  animate();
}

function onResize() {
  const container = document.getElementById("three-container");
  if (!container || !renderer || !camera) return;
  const { clientWidth: width, clientHeight: height } = container;
  camera.aspect = width / height || 1;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  const t = performance.now() * 0.00025;
  if (nodeGroup && edgeGroup) {
    nodeGroup.rotation.y = t * 0.9;
    edgeGroup.rotation.y = t * 0.9;
    nodeGroup.rotation.x = Math.sin(t * 0.6) * 0.25;

    nodeGroup.children.forEach((node, i) => {
      const pulse = 1 + 0.3 * Math.sin(t * 4 + i * 0.35);
      node.scale.setScalar(pulse);
    });
  }

  renderer.render(scene, camera);
}

// Crear nodo desde sílaba detectada
function addSyllableNode(syllable) {
  if (!nodeGroup) return;

  const radius = 80;
  const angle = nodes.length * 0.35;
  const bandOffset =
    syllable.band === "low" ? -40 : syllable.band === "high" ? 40 : 0;

  const x = Math.cos(angle) * radius * (0.4 + Math.random() * 0.6);
  const y = bandOffset + (Math.random() - 0.5) * 15;
  const z = Math.sin(angle) * radius * (0.5 + Math.random() * 0.6);

  const size = 1.5 + (syllable.energy / 255) * 4;

  const color =
    syllable.band === "low"
      ? new THREE.Color("#ff8a3c")
      : syllable.band === "mid"
      ? new THREE.Color("#ff00ff")
      : new THREE.Color("#00ff7f");

  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color.clone().multiplyScalar(0.8),
    metalness: 0.3,
    roughness: 0.25
  });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(x, y, z);
  nodeGroup.add(sphere);

  // Crear arista desde el nodo anterior
  if (lastNode) {
    const edgeGeom = new THREE.BufferGeometry().setFromPoints([
      lastNode.position,
      sphere.position
    ]);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x8888ff,
      transparent: true,
      opacity: 0.25
    });
    const line = new THREE.Line(edgeGeom, edgeMat);
    edgeGroup.add(line);
  }

  lastNode = sphere;
  nodes.push(sphere);

  // Limitar número de nodos para no matar el móvil
  if (nodes.length > 300) {
    const removeCount = nodes.length - 300;
    for (let i = 0; i < removeCount; i++) {
      const n = nodes.shift();
      nodeGroup.remove(n);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initScene();

  // Escucha eventos de sílabas generados por audio.js
  window.addEventListener("birdsong-syllable", (ev) => {
    addSyllableNode(ev.detail);
  });
});
