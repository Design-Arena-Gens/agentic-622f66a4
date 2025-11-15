"use client";

import { Emotion, AvatarMode } from "@/types/avatar";
import { VOICES } from "@/utils/voices";
import { ChangeEvent, useMemo } from "react";
import clsx from "clsx";

type ControlPanelProps = {
  script: string;
  setScript: (text: string) => void;
  emotion: Emotion;
  setEmotion: (emotion: Emotion) => void;
  voice: string;
  setVoice: (voice: string) => void;
  avatarMode: AvatarMode;
  setAvatarMode: (mode: AvatarMode) => void;
  onImageUpload: (file: File) => void;
  onAudioUpload: (file: File) => void;
  onGenerateSpeech: () => Promise<void>;
  onRegenerate: () => Promise<void>;
  onStartPreview: () => void;
  onExport: () => Promise<void>;
  busy: boolean;
  previewDisabled: boolean;
  transcription: string | null;
  setTranscription: (text: string | null) => void;
};

const emotions: Emotion[] = ["neutral", "happy", "sad", "angry", "surprised"];

export function ControlPanel(props: ControlPanelProps) {
  const filteredVoices = useMemo(() => {
    return VOICES.map((voice) => ({
      ...voice,
      highlighted: voice.suggestedFor.includes(props.emotion)
    }));
  }, [props.emotion]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) props.onImageUpload(file);
    event.target.value = "";
  };

  const handleAudioChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) props.onAudioUpload(file);
    event.target.value = "";
  };

  return (
    <div className="panel">
      <div className="panel__section">
        <div className="panel__header">
          <h2>Create Performance</h2>
        </div>
        <div className="panel__toggle">
          <button
            className={clsx("panel__toggle-btn", props.avatarMode === "image" && "is-active")}
            onClick={() => props.setAvatarMode("image")}
          >
            Portrait
          </button>
          <button
            className={clsx("panel__toggle-btn", props.avatarMode === "3d" && "is-active")}
            onClick={() => props.setAvatarMode("3d")}
          >
            3D Avatar
          </button>
        </div>
        <label className="panel__upload">
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <span>Upload Image</span>
        </label>
        <label className="panel__upload">
          <input type="file" accept="audio/*" onChange={handleAudioChange} />
          <span>Audio to Speech</span>
        </label>
      </div>

      <div className="panel__section">
        <div className="panel__row">
          <label htmlFor="script">Script</label>
          <span className="panel__hint">Text-to-Speech with AI voice</span>
        </div>
        <textarea
          id="script"
          value={props.script}
          placeholder="Write the dialogue you want the avatar to say..."
          onChange={(event) => props.setScript(event.target.value)}
        />
        {props.transcription && (
          <div className="panel__transcription">
            <div className="panel__transcription-head">
              <span>Transcribed from audio</span>
              <button onClick={() => props.setTranscription(null)}>Clear</button>
            </div>
            <p>{props.transcription}</p>
          </div>
        )}
      </div>

      <div className="panel__section">
        <div className="panel__row">
          <label>Emotion</label>
          <span className="panel__hint">Blend expressions + body motion</span>
        </div>
        <div className="panel__emotions">
          {emotions.map((emotion) => (
            <button
              key={emotion}
              className={clsx("panel__emotion", props.emotion === emotion && "is-active")}
              onClick={() => props.setEmotion(emotion)}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      <div className="panel__section">
        <div className="panel__row">
          <label>AI Voice</label>
        </div>
        <div className="panel__voices">
          {filteredVoices.map((voice) => (
            <button
              key={voice.id}
              className={clsx(
                "panel__voice",
                props.voice === voice.id && "is-active",
                voice.highlighted && "panel__voice--highlight"
              )}
              onClick={() => props.setVoice(voice.id)}
            >
              {voice.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel__cta">
        <button className="btn btn--primary" onClick={props.onGenerateSpeech} disabled={props.busy}>
          Generate Speech
        </button>
        <div className="panel__cta-row">
          <button className="btn btn--ghost" onClick={props.onRegenerate} disabled={props.busy}>
            Regenerate
          </button>
          <button
            className="btn btn--ghost"
            onClick={props.onStartPreview}
            disabled={props.previewDisabled || props.busy}
          >
            Preview
          </button>
        </div>
        <button className="btn btn--export" onClick={props.onExport} disabled={props.busy}>
          Export MP4
        </button>
      </div>

      <style jsx>{`
        .panel {
          display: flex;
          flex-direction: column;
          gap: 28px;
          border-radius: 24px;
          padding: 28px;
          background: rgba(10, 12, 22, 0.76);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(20px);
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }
        .panel__section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .panel__header h2 {
          margin: 0;
          font-size: 1.45rem;
          letter-spacing: 0.05em;
        }
        .panel__toggle {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .panel__toggle-btn {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.2s ease;
        }
        .panel__toggle-btn.is-active {
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(130, 107, 255, 0.18);
        }
        .panel__upload {
          border: 1px dashed rgba(255, 255, 255, 0.28);
          border-radius: 14px;
          padding: 12px 16px;
          text-align: center;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .panel__upload:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .panel__upload input {
          opacity: 0;
          position: absolute;
          inset: 0;
          cursor: pointer;
        }
        textarea {
          resize: vertical;
          min-height: 140px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px;
          color: #f7f7fa;
          font-size: 0.96rem;
          line-height: 1.5;
        }
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.32);
        }
        .panel__row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .panel__row label {
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .panel__hint {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .panel__emotions {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }
        .panel__emotion {
          border-radius: 999px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid transparent;
          text-transform: capitalize;
          font-size: 0.9rem;
          transition: all 0.18s ease;
        }
        .panel__emotion.is-active {
          border-color: rgba(255, 255, 255, 0.3);
          background: linear-gradient(120deg, rgba(92, 255, 216, 0.25), rgba(136, 144, 255, 0.25));
        }
        .panel__voices {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .panel__voice {
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          text-align: left;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .panel__voice--highlight {
          border-color: rgba(255, 255, 255, 0.18);
        }
        .panel__voice.is-active {
          background: rgba(130, 107, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.45);
        }
        .panel__cta {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: auto;
        }
        .panel__cta-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .btn {
          border-radius: 16px;
          border: none;
          padding: 14px 18px;
          font-weight: 600;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn--primary {
          background: linear-gradient(135deg, #7f5bff, #5effd1);
          color: #0b0b13;
          box-shadow: 0 18px 40px rgba(94, 255, 210, 0.18);
        }
        .btn--primary:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .btn--ghost {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
        }
        .btn--export {
          background: rgba(94, 255, 210, 0.16);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(94, 255, 210, 0.4);
        }
        .panel__transcription {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px;
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .panel__transcription-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.55);
        }
        .panel__transcription-head button {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
        }
        .panel__transcription p {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.85);
        }
      `}</style>
    </div>
  );
}
