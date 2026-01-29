import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * ISO-style diverging colormap
 * Valleys (negative) : Blue → Cyan
 * Zero plane         : White
 * Peaks (positive)   : Yellow → Red
 */
function isoDivergingColor(value, min, max) {
  const color = new THREE.Color();

  const maxAbs = Math.max(Math.abs(min), Math.abs(max)) || 1;
  const t = value / maxAbs; // [-1, 1]

  if (t < 0) {
    const a = Math.abs(t);
    color.setRGB(0.0, 1.0 - a, 1.0);
  } else {
    color.setRGB(1.0, 1.0 - t, 0.0);
  }

  return color;
}

function getIsoColor(val, min, max) {
    const color = new THREE.Color();
    const range = Math.max(Math.abs(min), Math.abs(max)) || 1;
    const t = val / range; 
    if (t < 0) color.setRGB(0.0, 1.0 - Math.abs(t), 1.0); // Blue
    else color.setRGB(1.0, 1.0 - t, 0.0); // Yellow/Red
    return color;
}

export default function ThreeViewer({ geometry, data, mode = "scalar", title }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!geometry || !data || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    const bufferGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(geometry.vertices.flat());
    const colors = new Float32Array(positions.length);

    if (mode === "vector") {
        const { displacement, max_disp } = data;
        
        for (let i = 0; i < displacement.length; i++) {
            const dx = displacement[i][0];
            const dy = displacement[i][1];
            const dz = displacement[i][2];
            const mag = Math.sqrt(dx*dx + dy*dy + dz*dz);

            positions[i*3 + 0] += dx; 
            positions[i*3 + 1] += dy; 
            positions[i*3 + 2] += dz;

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    // ------------------
    // Camera fit
    // ------------------
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = maxDim / (2 * Math.tan(fov / 2));

    camera.position.set(center.x, center.y, center.z + distance * 1.6);
    camera.lookAt(center);

    // ------------------
    // ISO Roughness Coloring (top surface only)
    // ------------------
    const vertexCount = data.mesh.vertices.length;
    const colors = new Float32Array(vertexCount * 3);

    // Default: neutral gray
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = 0.5;
      colors[i + 1] = 0.5;
      colors[i + 2] = 0.5;
    }

    bufferGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    bufferGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    bufferGeo.setIndex(geometry.faces.flat());
    bufferGeo.computeVertexNormals();

    indices.forEach((vertexIndex, i) => {
      if (vertexIndex >= vertexCount) return;

      const v = values[i];
      const c = isoDivergingColor(v, min, max);

      const idx = vertexIndex * 3;
      colors[idx] = c.r;
      colors[idx + 1] = c.g;
      colors[idx + 2] = c.b;
    });

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // ------------------
    // Mesh
    // ------------------
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ------------------
    // Lights
    // ------------------
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    // ------------------
    // World axes (reference)
    // ------------------
    const axesHelper = new THREE.AxesHelper(maxDim * 0.4);
    scene.add(axesHelper);

    // ------------------
    // Detected height axis (orientation)
    // ------------------
    if (data.orientation?.height_axis) {
      const h = data.orientation.height_axis;

      const heightAxis = new THREE.Vector3(h[0], h[1], h[2]).normalize();

      const arrow = new THREE.ArrowHelper(
        heightAxis,
        center,
        maxDim * 0.6,
        0x800080 // purple
      );

      scene.add(arrow);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center);

    // ------------------
    // Resize handling
    // ------------------
    const onResize = () => {
      camera.aspect =
        mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        mountRef.current.clientWidth,
        mountRef.current.clientHeight
      );
    };
    window.addEventListener("resize", onResize);

    // ------------------
    // Render loop
    // ------------------
    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

  }, [geometry, data, mode]);

  return (
    <div style={{ flex: 1, minWidth: "300px", margin: "10px", border: "1px solid #444", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ background: "#333", padding: "5px 10px", fontWeight: "bold" }}>{title}</div>
        <div ref={mountRef} style={{ height: "300px", width: "100%" }} />
    </div>
  );
}

