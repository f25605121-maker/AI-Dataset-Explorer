"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeNeuralMesh() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 380;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 28;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x1a2639, 1.5);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 4, 60);
    cyanLight.position.set(15, 12, 18);
    scene.add(cyanLight);

    const violetLight = new THREE.PointLight(0xa855f7, 3.5, 60);
    violetLight.position.set(-15, -10, 15);
    scene.add(violetLight);

    const blueCoreLight = new THREE.PointLight(0x38bdf8, 5, 40);
    blueCoreLight.position.set(0, 0, 0);
    scene.add(blueCoreLight);

    // 4. Cluster Group
    const neuralCluster = new THREE.Group();
    scene.add(neuralCluster);

    // Quantum Core
    const innerCoreGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const innerCoreMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      shininess: 90,
      transparent: true,
      opacity: 0.85,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    neuralCluster.add(innerCore);

    const outerIcoGeo = new THREE.IcosahedronGeometry(5.2, 1);
    const outerIcoMat = new THREE.MeshLambertMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const outerIco = new THREE.Mesh(outerIcoGeo, outerIcoMat);
    neuralCluster.add(outerIco);

    // Orbital Rings
    const createOrbitRing = (radius: number, tube: number, colorHex: number, rx: number, ry: number) => {
      const ringGeo = new THREE.TorusGeometry(radius, tube, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = rx;
      ring.rotation.y = ry;
      return ring;
    };

    const ring1 = createOrbitRing(8.5, 0.08, 0x06b6d4, Math.PI / 3, Math.PI / 6);
    const ring2 = createOrbitRing(11.2, 0.08, 0xa855f7, -Math.PI / 4, Math.PI / 3);
    const ring3 = createOrbitRing(13.8, 0.08, 0x3b82f6, Math.PI / 2.2, -Math.PI / 5);
    neuralCluster.add(ring1);
    neuralCluster.add(ring2);
    neuralCluster.add(ring3);

    // Distributed Dataset Nodes
    const nodeCount = 42;
    const nodePositions: THREE.Vector3[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const nodeMatCyan = new THREE.MeshPhongMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 0.9,
    });
    const nodeMatPurple = new THREE.MeshPhongMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.8,
    });

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const radius = 9.0 + Math.random() * 5.0;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      const nodeMesh = new THREE.Mesh(nodeGeo, i % 2 === 0 ? nodeMatCyan : nodeMatPurple);
      nodeMesh.position.set(x, y, z);
      neuralCluster.add(nodeMesh);

      nodePositions.push(new THREE.Vector3(x, y, z));
    }

    // Synapse Lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
    });
    const lineCoords: number[] = [];

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < 6.2) {
          lineCoords.push(
            nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
            nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
          );
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lineCoords, 3));
    const synapseLines = new THREE.LineSegments(lineGeo, lineMaterial);
    neuralCluster.add(synapseLines);

    // Particle Cloud
    const particleCount = 280;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let k = 0; k < particleCount * 3; k += 3) {
      pPos[k] = (Math.random() - 0.5) * 60;
      pPos[k + 1] = (Math.random() - 0.5) * 45;
      pPos[k + 2] = (Math.random() - 0.5) * 40;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.35,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
    });
    const particleCloud = new THREE.Points(pGeo, pMat);
    scene.add(particleCloud);

    // Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 400;
      height = container.clientHeight || 380;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      const targetRotationY = mouseX * 0.45;
      const targetRotationX = mouseY * 0.35;

      neuralCluster.rotation.y += (targetRotationY - neuralCluster.rotation.y) * 0.05 + 0.003;
      neuralCluster.rotation.x += (targetRotationX - neuralCluster.rotation.x) * 0.05 + 0.001;

      const scalePulse = 1 + Math.sin(elapsedTime * 2.2) * 0.06;
      innerCore.scale.set(scalePulse, scalePulse, scalePulse);

      outerIco.rotation.x = elapsedTime * 0.25;
      outerIco.rotation.y = elapsedTime * 0.35;

      ring1.rotation.z += 0.006;
      ring2.rotation.z -= 0.008;
      ring3.rotation.y += 0.005;

      particleCloud.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      outerIcoGeo.dispose();
      outerIcoMat.dispose();
      nodeGeo.dispose();
      nodeMatCyan.dispose();
      nodeMatPurple.dispose();
      lineGeo.dispose();
      lineMaterial.dispose();
      pGeo.dispose();
      pMat.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative" ref={containerRef} style={{ minHeight: "380px" }} />
  );
}
