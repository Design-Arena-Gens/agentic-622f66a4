"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type LipSyncSource = {
  audioEl: HTMLAudioElement | null;
};

export function useLipSyncEngine() {
  const [mouth, setMouth] = useState(0);
  const [jaw, setJaw] = useState(0);
  const [brow, setBrow] = useState(0);
  const [hand, setHand] = useState(0);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number>();
  const sourceRef = useRef<LipSyncSource>({ audioEl: null });
  const handTimerRef = useRef<number>(0);

  const tick = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);

    const values = dataArrayRef.current;
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i] * values[i];
    }
    const rms = Math.sqrt(sum / values.length) / 255;
    const clipped = Math.min(1, rms * 3);

    setMouth(clipped);
    setJaw(Math.min(1, clipped * 1.4));
    setBrow(Math.min(1, clipped * 0.9));

    handTimerRef.current += 1;
    if (handTimerRef.current % 12 === 0) {
      setHand(0.3 + Math.random() * Math.min(0.8, clipped + 0.2));
    } else {
      setHand((prev) => prev * 0.92 + handTimerRef.current * 1e-4);
    }

    const lookX = (values[2] - values[40]) / 200;
    const lookY = (values[10] - values[70]) / 300;
    setGaze({
      x: Math.max(-0.4, Math.min(0.4, lookX)),
      y: Math.max(-0.3, Math.min(0.3, lookY))
    });

    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    frameRef.current && cancelAnimationFrame(frameRef.current);
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close();
    analyserRef.current = null;
    dataArrayRef.current = null;
    audioCtxRef.current = null;
    sourceRef.current.audioEl = null;
  }, []);

  const start = useCallback(async (audioEl: HTMLAudioElement) => {
    stop();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    const source = ctx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    sourceRef.current.audioEl = audioEl;
    setIsPlaying(true);
    frameRef.current = requestAnimationFrame(tick);
  }, [stop, tick]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    mouth,
    jaw,
    brow,
    hand,
    gaze,
    isPlaying,
    start,
    stop
  };
}
