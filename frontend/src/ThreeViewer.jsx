import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * ISO-style diverging colormap (Roughness)
 * Valleys (negative): Blue → Cyan
 * Peaks (positive):  Yellow → Red
 */
function isoDivergingColor(value, min, max) {
  const color = new THREE.Color();
  const maxAbs = Math.max(Math.abs(min), Math.abs(max)) || 1;
  const t = value / maxAbs;

  if (t < 0) {
    const a = Math.abs(t);
    color.setRGB(0.0, 1.0 - a, 1.0);
  } else {
    color.setRGB(1.0, 1.0 - t, 0.0);
  }
  return color;
}

/**
 * Spectral/Jet-like colormap (FEM Displacement)
 * 0 (Low) -> Blue -> Green -> Red -> (High)
 */
function spectralColor(value, min, max) {
  const color = new THREE.Color();
  // Avoid divide by zero
  const range = (max - min) || 1;
  
  // Normalize 0 to 1
  let t = (value - min) / range;
  if (isNaN(t)) t = 0;
  t = Math.max(0, Math.min(1, t));

  // Simple HSL sweep: Blue (240deg) to Red (0deg)
  const hue = (1.0 - t) * 240.0 / 360.0;
  color.setHSL(hue, 1.0, 0.5);
  
  return color;
}

export default function ThreeViewer({ geometry, data, title, mode = "scalar" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!geometry || !data || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // ------------------
    // Scene / Camera / Renderer
    // ------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    // ------------------
    // BufferGeometry
    // ------------------
    const bufferGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(geometry.vertices.flat());
    const vertexCount = geometry.vertices.length;

    bufferGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    // Handle faces (flat array of indices)
    const flatFaces = geometry.faces.flat();
    if (flatFaces.length > 0) {
      bufferGeo.setIndex(flatFaces);
      bufferGeo.computeVertexNormals();
    }
    bufferGeo.computeBoundingBox();

    // ------------------
    // Colors (default gray)
    // ------------------
    const colors = new Float32Array(vertexCount * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = 0.5;
      colors[i + 1] = 0.5;
      colors[i + 2] = 0.5;
    }

    // ------------------
    // Visualization Logic
    // ------------------
    
    // MODE 1: Roughness (Scalar)
    // Checks for 'values' directly because App.jsx passes data={roughnessData.roughness}
    if (mode === "scalar" && data.values) {
      const { indices, values, min, max } = data; // destructure directly from data
      
      if (indices && values) {
        indices.forEach((vid, i) => {
          if (vid >= vertexCount) return;
          const c = isoDivergingColor(values[i], min, max);
          const idx = vid * 3;
          colors[idx] = c.r;
          colors[idx + 1] = c.g;
          colors[idx + 2] = c.b;
        });
      }
    }

    // MODE 2: FEM (Vector)
    // Checks for 'displacement' because App.jsx passes data={femData.pressure} (or thermal)
    else if (mode === "vector" && data.displacement) {
      const vectors = data.displacement; // [[x,y,z], ...]
      const maxDisp = data.max_disp || 0;
      
      vectors.forEach((vec, i) => {
        if (i >= vertexCount) return;
        
        // Calculate magnitude
        const mag = Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]);
        
        const c = spectralColor(mag, 0, maxDisp);
        
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      });
    }

    bufferGeo.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    // ------------------
    // Mesh Material
    // ------------------
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(bufferGeo, material);
    scene.add(mesh);

    // ------------------
    // Lights
    // ------------------
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 1, 1);
    scene.add(dirLight);

    // ------------------
    // Camera fit
    // ------------------
    const box = bufferGeo.boundingBox;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    if (box) {
      box.getSize(size);
      box.getCenter(center);
    }

    const maxDim = Math.max(size.x, size.y, size.z) || 1.0;
    const fov = camera.fov * (Math.PI / 180);
    const dist = maxDim / (2 * Math.tan(fov / 2));

    camera.position.set(center.x, center.y, center.z + dist * 1.6);
    camera.lookAt(center);

    // ------------------
    // Axes Helpers
    // ------------------
    scene.add(new THREE.AxesHelper(maxDim * 0.4));

    // Optional Orientation Arrow (for Roughness data)
    // Note: This data might reside on the parent object in some contexts,
    // but we check if it was passed inside `data` or handle it if passed separately.
    // Based on App.jsx, 'orientation' is NOT inside 'data' for roughness, 
    // but the viewer code in the repo checked data.orientation.
    // If you need the arrow, pass orientation as a separate prop or check strict paths.
    if (data.orientation?.height_axis) {
      const h = data.orientation.height_axis;
      const dir = new THREE.Vector3(h[0], h[1], h[2]).normalize();
      scene.add(
        new THREE.ArrowHelper(dir, center, maxDim * 0.6, 0x800080)
      );
    }

    // ------------------
    // Controls
    // ------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center);
    controls.update();

    // ------------------
    // Resize Handler
    // ------------------
    const onResize = () => {
      if (mountRef.current) {
        camera.aspect =
          mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(
          mountRef.current.clientWidth,
          mountRef.current.clientHeight
        );
      }
    };
    window.addEventListener("resize", onResize);

    // ------------------
    // Animation Loop
    // ------------------
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      bufferGeo.dispose();
      material.dispose();
    };
  }, [geometry, data, mode]);

  return (
    <div
      style={{
        flex: 1,
        minWidth: "300px",
        margin: "10px",
        border: "1px solid #444",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div style={{ background: "#333", padding: "5px 10px", fontWeight: "bold" }}>
        {title}
      </div>
      <div ref={mountRef} style={{ height: "300px", width: "100%" }} />
    </div>
  );
}