"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import type { AvatarPreviewProps } from "@/components/AvatarPreview";
import { ControlPanel } from "@/components/ControlPanel";
import { Emotion, AvatarMode } from "@/types/avatar";
import { useLipSyncEngine } from "@/hooks/useLipSyncEngine";
import { synthesizeSpeech } from "@/lib/tts";
import { transcribeAudio } from "@/lib/asr";
import { exportToMp4 } from "@/lib/exporter";
import { motion, AnimatePresence } from "framer-motion";

const AvatarPreview = dynamic(
  () => import("@/components/AvatarPreview").then((mod) => mod.AvatarPreview),
  {
    ssr: false,
    loading: () => (
      <div className="page__preview-loading">
        <span>Initializing avatar renderer...</span>
      </div>
    )
  }
) as ComponentType<AvatarPreviewProps>;

export default function Page() {
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>("3d");
  const [script, setScript] = useState<string>("");
  const [emotion, setEmotion] = useState<Emotion>("neutral");
  const [voice, setVoice] = useState<string>("brian");
  const [status, setStatus] = useState<string>("Idle");
  const [busy, setBusy] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const previewActiveRef = useRef(false);

  const { mouth, jaw, brow, hand, gaze, start, stop, isPlaying } = useLipSyncEngine();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      stop();
      previewActiveRef.current = false;
    };
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("ended", onEnded);
    };
  }, [stop]);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const preparePreview = useCallback(async () => {
    if (!audioUrl || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = audioUrl;
    audio.currentTime = 0;
    await audio.play();
    start(audio);
    previewActiveRef.current = true;
  }, [audioUrl, start]);

  const handleGenerateSpeech = useCallback(async () => {
    if (!script.trim()) return;
    try {
      setBusy(true);
      setStatus("Generating AI speech...");
      const { audioUrl: url, blob } = await synthesizeSpeech(script, voice, emotion);
      setAudioUrl(url);
      setAudioBlob(blob);
      setStatus("Speech ready. Preview to animate.");
    } catch (error: any) {
      setStatus(error?.message ?? "Failed to generate speech.");
    } finally {
      setBusy(false);
    }
  }, [script, voice, emotion]);

  const handleAudioUpload = useCallback(
    async (file: File) => {
      try {
        setBusy(true);
        setStatus("Transcribing audio with Whisper...");
        const text = await transcribeAudio(file);
        setTranscription(text);
        setScript(text);
        setStatus("Generating AI dub...");
        const { audioUrl: url, blob } = await synthesizeSpeech(text, voice, emotion);
        setAudioUrl(url);
        setAudioBlob(blob);
        setStatus("Dub created. Ready to preview.");
      } catch (error: any) {
        console.error(error);
        setStatus(error?.message ?? "Unable to process audio.");
      } finally {
        setBusy(false);
      }
    },
    [voice, emotion]
  );

  const handleRegenerate = useCallback(async () => {
    if (!script.trim()) return;
    await handleGenerateSpeech();
  }, [handleGenerateSpeech, script]);

  const handleExport = useCallback(async () => {
    if (!audioUrl || !audioBlob || !canvasRef.current || !audioRef.current) {
      setStatus("Generate speech and preview before exporting.");
      return;
    }
    try {
      setBusy(true);
      setStatus("Recording performance...");

      const canvas = canvasRef.current;
      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;

      const canvasStream = canvas.captureStream(60);
      const audioStream = (audio as any).captureStream
        ? (audio as any).captureStream()
        : (audio as any).mozCaptureStream
        ? (audio as any).mozCaptureStream()
        : null;
      if (!audioStream) {
        throw new Error("Audio capture not supported in this browser.");
      }

      const combined = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(combined, {
        mimeType: "video/webm;codecs=vp9,opus"
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };

      const finishRecording = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start();
      await preparePreview();
      await new Promise<void>((resolve) => {
        audio.onended = () => {
          recorder.stop();
          resolve();
        };
      });
      await finishRecording;
      stop();

      setStatus("Encoding MP4...");
      const mp4Blob = await exportToMp4(chunks, audioBlob, "avatar.mp4");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(mp4Blob);
      link.download = `avatar-performance-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatus("MP4 exported successfully.");
    } catch (error: any) {
      console.error(error);
      setStatus(error?.message ?? "Failed to export video.");
    } finally {
      setBusy(false);
      recorderRef.current = null;
    }
  }, [audioUrl, audioBlob, preparePreview, stop]);

  const handlePreview = useCallback(async () => {
    if (!audioUrl) {
      setStatus("Generate speech first.");
      return;
    }
    try {
      setStatus("Playing preview...");
      await preparePreview();
    } catch (error: any) {
      setStatus(error?.message ?? "Cannot play preview.");
    }
  }, [audioUrl, preparePreview]);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
  }, []);

  return (
    <main className="page">
      <div className="page__backdrop">
        <div className="gradient gradient--one" />
        <div className="gradient gradient--two" />
      </div>
      <div className="page__inner">
        <header className="page__header">
          <div>
            <h1>AI Lip-Sync Avatar Studio</h1>
            <p>Generate expressive talking avatars with AI-driven voices and animation.</p>
          </div>
          <div className="page__status">
            <AnimatePresence mode="wait">
              <motion.span
                key={status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.95, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {status}
              </motion.span>
            </AnimatePresence>
          </div>
        </header>
        <section className="page__content">
          <aside className="page__sidebar">
            <ControlPanel
              script={script}
              setScript={setScript}
              emotion={emotion}
              setEmotion={setEmotion}
              voice={voice}
              setVoice={setVoice}
              avatarMode={avatarMode}
              setAvatarMode={setAvatarMode}
              onImageUpload={handleImageUpload}
              onAudioUpload={handleAudioUpload}
              onGenerateSpeech={handleGenerateSpeech}
              onRegenerate={handleRegenerate}
              onStartPreview={handlePreview}
              onExport={handleExport}
              busy={busy}
              previewDisabled={!audioUrl}
              transcription={transcription}
              setTranscription={setTranscription}
            />
          </aside>
          <div className="page__preview">
            <AvatarPreview
              mode={avatarMode}
              image={avatarImage}
              lip={mouth}
              jaw={jaw}
              brow={brow}
              hand={hand}
              emotion={emotion}
              gaze={gaze}
              onCanvasReady={handleCanvasReady}
            />
            <div className="page__audio">
              <audio ref={audioRef} src={audioUrl ?? undefined} controls />
            </div>
          </div>
        </section>
      </div>
      <style jsx>{`
        .page {
          position: relative;
          min-height: 100vh;
          padding: 48px 64px;
          display: flex;
          justify-content: center;
        }
        .page__backdrop {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
        }
        .gradient {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(180px);
          opacity: 0.5;
          mix-blend-mode: screen;
        }
        .gradient--one {
          top: -120px;
          left: -100px;
          background: #5effd1;
        }
        .gradient--two {
          bottom: -220px;
          right: -160px;
          background: #8067ff;
        }
        .page__inner {
          position: relative;
          z-index: 1;
          width: min(1280px, 100%);
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .page__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }
        h1 {
          margin: 0;
          font-size: clamp(2rem, 3.3vw, 2.9rem);
          letter-spacing: 0.06em;
        }
        p {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.6);
          max-width: 560px;
        }
        .page__status {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 16px;
          padding: 12px 18px;
          min-width: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
        }
        .page__content {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 32px;
        }
        .page__preview {
          position: relative;
          display: grid;
          grid-template-rows: minmax(480px, 1fr) auto;
          gap: 18px;
        }
        .page__preview-loading {
          border-radius: 24px;
          border: 1px dashed rgba(255, 255, 255, 0.18);
          background: rgba(12, 12, 18, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          animation: pulse 1.8s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.9;
          }
        }
        .page__audio {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          padding: 12px 16px;
        }
        audio {
          width: 100%;
        }
        @media (max-width: 1200px) {
          .page {
            padding: 32px;
          }
          .page__content {
            grid-template-columns: 1fr;
          }
          .page__sidebar {
            order: 2;
          }
          .page__preview {
            order: 1;
          }
        }
        @media (max-width: 600px) {
          .page {
            padding: 24px 16px 80px;
          }
          .page__header {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
