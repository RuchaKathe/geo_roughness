import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

function getHeatmapColor(t) {
    const color = new THREE.Color();
    color.setHSL((1.0 - t) * 0.66, 1.0, 0.5);
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

            const c = getHeatmapColor(mag / (max_disp || 1));
            colors[i*3 + 0] = c.r;
            colors[i*3 + 1] = c.g;
            colors[i*3 + 2] = c.b;
        }
    } 
    else if (mode === "scalar") {
        const { values, indices, min, max } = data;
        colors.fill(0.5);
        
        indices.forEach((nodeIdx, arrIdx) => {
            const c = getIsoColor(values[arrIdx], min, max);
            colors[nodeIdx*3 + 0] = c.r;
            colors[nodeIdx*3 + 1] = c.g;
            colors[nodeIdx*3 + 2] = c.b;
        });
    }

    bufferGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    bufferGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    bufferGeo.setIndex(geometry.faces.flat());
    bufferGeo.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(bufferGeo, material);
    scene.add(mesh);

    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(10, 20, 30);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    bufferGeo.computeBoundingBox();
    const center = bufferGeo.boundingBox.getCenter(new THREE.Vector3());
    const size = bufferGeo.boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    camera.position.copy(center);
    camera.position.z += maxDim * 2.0;
    camera.lookAt(center);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center);

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