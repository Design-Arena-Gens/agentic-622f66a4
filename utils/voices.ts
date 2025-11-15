import { Emotion } from "@/types/avatar";

export type VoiceOption = {
  id: string;
  label: string;
  providerVoice: string;
  suggestedFor: Emotion[];
};

export const VOICES: VoiceOption[] = [
  { id: "brian", label: "Brian · Warm Male", providerVoice: "Brian", suggestedFor: ["neutral", "happy"] },
  { id: "joanna", label: "Joanna · Crisp Female", providerVoice: "Joanna", suggestedFor: ["happy", "surprised"] },
  { id: "amy", label: "Amy · Friendly", providerVoice: "Amy", suggestedFor: ["neutral", "happy"] },
  { id: "justin", label: "Justin · Youthful", providerVoice: "Justin", suggestedFor: ["surprised", "happy"] },
  { id: "matthew", label: "Matthew · Calm Male", providerVoice: "Matthew", suggestedFor: ["neutral", "sad"] },
  { id: "salli", label: "Salli · Confident", providerVoice: "Salli", suggestedFor: ["angry", "surprised"] }
];
