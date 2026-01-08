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
  const t = value / maxAbs; // normalized [-1, 1]

  if (t < 0) {
    // Negative (valleys)
    const a = Math.abs(t);
    color.setRGB(0.0, 1.0 - a, 1.0);
  } else {
    // Positive (peaks)
    color.setRGB(1.0, 1.0 - t, 0.0);
  }

  return color;
}

export default function ThreeViewer({ data }) {
  const mountRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!data || !mountRef.current) return;

    // ------------------
    // Scene
    // ------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);

    // ------------------
    // Camera
    // ------------------
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.001,
      1e6
    );

    // ------------------
    // Renderer
    // ------------------
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    // ------------------
    // Geometry
    // ------------------
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array(data.mesh.vertices.flat()),
        3
      )
    );

    geometry.setIndex(
      new THREE.BufferAttribute(
        new Uint32Array(data.mesh.faces.flat()),
        1
      )
    );

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    // ------------------
    // ISO Roughness Coloring (TOP SURFACE ONLY)
    // ------------------
    const vertexCount = data.mesh.vertices.length;
    const colors = new Float32Array(vertexCount * 3);

    // Default gray for non-top vertices
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = 0.5;
      colors[i + 1] = 0.5;
      colors[i + 2] = 0.5;
    }

    const { indices, values, min, max } = data.roughness;

    indices.forEach((vertexIndex, i) => {
      if (vertexIndex >= vertexCount) return;

      const v = values[i];
      const color = isoDivergingColor(v, min, max);

      const idx = vertexIndex * 3;
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    });

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // ------------------
    // Material + Mesh
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
    // Camera Fit to Geometry
    // ------------------
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = maxDim / (2 * Math.tan(fov / 2));

    camera.position.set(
      center.x,
      center.y,
      center.z + cameraDistance * 1.5
    );
    camera.lookAt(center);

    // ------------------
    // Controls
    // ------------------
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center);
    controls.enableDamping = true;
    controls.update();

    // ------------------
    // Resize
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
    // Render Loop
    // ------------------
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ------------------
    // Cleanup
    // ------------------
    return () => {
      window.removeEventListener("resize", onResize);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [data]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "500px",
        marginTop: "1rem",
        border: "1px solid #444",
      }}
    />
  );
}





