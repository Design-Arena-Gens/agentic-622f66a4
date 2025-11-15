"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Emotion, AvatarMode } from "@/types/avatar";

const emotionColorMap: Record<Emotion, string> = {
  neutral: "#8890ff",
  happy: "#5cffd8",
  sad: "#88b8ff",
  angry: "#ff7676",
  surprised: "#ffc977"
};

export type AvatarPreviewProps = {
  mode: AvatarMode;
  image: string | null;
  lip: number;
  jaw: number;
  brow: number;
  hand: number;
  emotion: Emotion;
  gaze: { x: number; y: number };
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
};

export function AvatarPreview(props: AvatarPreviewProps) {
  return (
    <div className="preview-shell">
      {props.mode === "image" ? <ImageCanvas {...props} /> : <ThreeCanvas {...props} />}
      <style jsx>{`
        .preview-shell {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 24px;
          overflow: hidden;
          background: rgba(12, 12, 18, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(18px);
        }
      `}</style>
    </div>
  );
}

function ImageCanvas({
  image,
  lip,
  jaw,
  brow,
  hand,
  emotion,
  gaze,
  onCanvasReady
}: AvatarPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const backgroundGradient = useMemo(() => {
    return `radial-gradient(circle at 20% 20%, ${emotionColorMap[emotion]}33, #06060a)`;
  }, [emotion]);

  useEffect(() => {
    onCanvasReady?.(canvasRef.current);
  }, [onCanvasReady]);

  useEffect(() => {
    if (!image) {
      imageRef.current = null;
      return;
    }
    const img = new Image();
    img.src = image;
    img.onload = () => {
      imageRef.current = img;
    };
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(width * 0.2, height * 0.2, 50, width / 2, height / 2, width);
      const color = emotionColorMap[emotion];
      gradient.addColorStop(0, `${color}33`);
      gradient.addColorStop(1, "#06060a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const portraitWidth = width * 0.55;
      const portraitHeight = portraitWidth * (4 / 3);
      const portraitX = width / 2 - portraitWidth / 2;
      const portraitY = height / 2 - portraitHeight / 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(portraitX, portraitY, portraitWidth, portraitHeight, 32);
      ctx.clip();
      if (imageRef.current) {
        ctx.drawImage(imageRef.current, portraitX, portraitY, portraitWidth, portraitHeight);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(portraitX, portraitY, portraitWidth, portraitHeight);
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = `${Math.max(18, portraitWidth * 0.06)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Upload an image", width / 2, portraitY + portraitHeight / 2);
      }
      ctx.restore();

      const eyeRadius = portraitWidth * 0.05;
      const eyeY = portraitY + portraitHeight * 0.42;
      const eyeOffsetX = portraitWidth * 0.15;
      const gazeX = gaze.x * eyeRadius * 2;
      const gazeY = gaze.y * eyeRadius;
      ctx.fillStyle = "rgba(255,255,255,0.92)";

      ctx.beginPath();
      ctx.arc(width / 2 - eyeOffsetX + gazeX, eyeY + gazeY, eyeRadius, 0, Math.PI * 2);
      ctx.arc(width / 2 + eyeOffsetX + gazeX, eyeY + gazeY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      const browWidth = portraitWidth * 0.28;
      const browHeight = portraitHeight * 0.015;
      const browY = eyeY - portraitHeight * 0.06 + brow * (emotion === "sad" ? 12 : -12);
      const gradientBrow = ctx.createLinearGradient(
        width / 2 - browWidth / 2,
        browY,
        width / 2 + browWidth / 2,
        browY
      );
      gradientBrow.addColorStop(0, "transparent");
      gradientBrow.addColorStop(0.5, "rgba(0,0,0,0.8)");
      gradientBrow.addColorStop(1, "transparent");
      ctx.fillStyle = gradientBrow;
      ctx.fillRect(width / 2 - browWidth / 2, browY, browWidth, browHeight);

      const mouthWidth = portraitWidth * 0.32;
      const mouthHeight = portraitHeight * 0.06 * (0.4 + lip * 0.9);
      const mouthX = width / 2 - mouthWidth / 2;
      const mouthY = portraitY + portraitHeight * 0.62 + jaw * 10;
      const mouthGradient = ctx.createRadialGradient(
        width / 2,
        mouthY + mouthHeight,
        mouthHeight / 4,
        width / 2,
        mouthY + mouthHeight / 2,
        mouthWidth
      );
      mouthGradient.addColorStop(0, "#e05e8d");
      mouthGradient.addColorStop(1, "#9e2a52");
      ctx.fillStyle = mouthGradient;
      ctx.beginPath();
      ctx.ellipse(width / 2, mouthY, mouthWidth / 2, mouthHeight / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      const handWidth = portraitWidth * 0.18;
      const handHeight = portraitHeight * 0.25;
      const handY = portraitY + portraitHeight * 0.85;
      const handRotation = hand * 0.6;

      const drawHand = (direction: number) => {
        ctx.save();
        const x = width / 2 + direction * portraitWidth * 0.35;
        ctx.translate(x, handY);
        ctx.rotate(direction * handRotation);
        ctx.fillStyle = "rgba(255,210,193,0.95)";
        ctx.beginPath();
        ctx.ellipse(0, 0, handWidth / 2, handHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawHand(-1);
      drawHand(1);

      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [emotion, gaze, hand, jaw, lip, brow]);

  return <canvas ref={canvasRef} className="preview-canvas" style={{ background: backgroundGradient }} />;
}

function ThreeCanvas({
  image,
  lip,
  jaw,
  brow,
  hand,
  emotion,
  gaze,
  onCanvasReady
}: AvatarPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const headRef = useRef<THREE.Mesh | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);
  const leftHandRef = useRef<THREE.Mesh | null>(null);
  const rightHandRef = useRef<THREE.Mesh | null>(null);
  const eyesRef = useRef<THREE.Mesh[]>([]);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const latestProps = useRef({ lip, jaw, brow, hand, emotion, gaze });

  useEffect(() => {
    latestProps.current = { lip, jaw, brow, hand, emotion, gaze };
  }, [lip, jaw, brow, hand, emotion, gaze]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    onCanvasReady?.(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x04040a, 4, 9);

    const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 1, 2.5);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x090909, 0.6);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(1.6, 2.2, 2.1);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x5effd2, 0.4);
    fillLight.position.set(-1.5, 1.2, 1.8);
    scene.add(fillLight);

    const group = new THREE.Group();
    scene.add(group);

    const headMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emotionColorMap[emotion]),
      metalness: 0.05,
      roughness: 0.55
    });
    materialRef.current = headMaterial;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 48, 48), headMaterial);
    head.position.set(0, 0.9, 0);
    head.castShadow = true;
    group.add(head);
    headRef.current = head;

    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x681d3b, roughness: 0.6 });
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.1, 20, 40), mouthMaterial);
    mouth.position.set(0, 0.35, 0.55);
    group.add(mouth);
    mouthRef.current = mouth;

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.25
    });
    const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 24), eyeMaterial);
    eyeLeft.position.set(-0.28, 1.15, 0.56);
    const eyeRight = eyeLeft.clone();
    eyeRight.position.x *= -1;
    group.add(eyeLeft, eyeRight);
    eyesRef.current = [eyeLeft, eyeRight];

    const createHand = (sign: number) => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(emotionColorMap[emotion]).offsetHSL(sign * 0.02, 0.1, 0)
      });
      const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 12, 24), material);
      mesh.position.set(0.85 * sign, 0.3, 0);
      group.add(mesh);
      return mesh;
    };

    leftHandRef.current = createHand(-1);
    rightHandRef.current = createHand(1);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.5, 64),
      new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.25 })
    );
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    const resize = () => {
      if (!canvas) return;
      const { clientWidth, clientHeight } = canvas;
      if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
        renderer.setSize(clientWidth, clientHeight, false);
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const state = latestProps.current;
      const time = performance.now() / 1000;

      if (headRef.current) {
        headRef.current.rotation.y = state.gaze.x * 0.4;
        headRef.current.rotation.x = -0.12 + state.gaze.y * 0.3;
        headRef.current.position.y = 0.9 + Math.sin(time * 2) * 0.04 + state.jaw * 0.05;
      }

      if (mouthRef.current) {
        mouthRef.current.scale.set(1 + state.lip * 0.12, 1 + state.lip * 0.65, 1);
        mouthRef.current.position.y = 0.35 + state.jaw * 0.06;
      }

      eyesRef.current.forEach((eye, index) => {
        eye.position.x = 0.28 * (index === 0 ? -1 : 1) + state.gaze.x * 0.06;
        eye.position.y = 1.15 + state.brow * 0.08 + state.gaze.y * 0.05;
      });

      if (leftHandRef.current && rightHandRef.current) {
        const wave = Math.sin(time * 3.2 + state.hand * 1.1);
        const wave2 = Math.cos(time * 2.8 + state.hand * 1.2);
        leftHandRef.current.rotation.z = 1.4 + wave * 0.28;
        leftHandRef.current.position.y = 0.32 + wave * 0.11 + state.hand * 0.2;
        rightHandRef.current.rotation.z = -1.4 + wave2 * 0.3;
        rightHandRef.current.position.y = 0.34 + wave2 * 0.12 + state.hand * 0.2;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            (mesh.material as THREE.Material).dispose();
          }
        }
      });
      textureRef.current?.dispose();
      onCanvasReady?.(null);
    };
  }, [emotion, onCanvasReady]);

  useEffect(() => {
    if (!materialRef.current) return;
    const material = materialRef.current;
    material.color = new THREE.Color(emotionColorMap[emotion]);
    [leftHandRef.current, rightHandRef.current].forEach((hand, index) => {
      if (!hand) return;
      const mat = hand.material as THREE.MeshStandardMaterial;
      mat.color = new THREE.Color(emotionColorMap[emotion]).offsetHSL(index === 0 ? -0.02 : 0.02, 0.05, 0);
    });
  }, [emotion]);

  useEffect(() => {
    if (!image || !materialRef.current) {
      if (materialRef.current) {
        materialRef.current.map = null;
        materialRef.current.needsUpdate = true;
      }
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.load(image, (texture) => {
      textureRef.current?.dispose();
      if ("colorSpace" in texture) {
        (texture as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
      }
      materialRef.current!.map = texture;
      materialRef.current!.needsUpdate = true;
      textureRef.current = texture;
    });
  }, [image]);

  return <canvas ref={canvasRef} className="preview-canvas three" />;
}
