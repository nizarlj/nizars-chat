"use client"

import { useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Button } from "@/components/ui/button";
import { MicIcon, MicOffIcon } from "lucide-react";
import { toast } from "sonner";

interface DictationButtonProps {
  onTranscriptChange: (transcript: string) => void;
  onListeningChange?: (listening: boolean) => void;
  disabled?: boolean;
}

export default function DictationButton({ onTranscriptChange, onListeningChange, disabled }: DictationButtonProps) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    onTranscriptChange(transcript);
  }, [transcript, onTranscriptChange]);

  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  const handleToggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <Button
        type="button"
        style="outline"
        color="destructive"
        size="icon"
        onClick={() => toast.error("Your browser does not support speech recognition.")}
        tooltip="Speech recognition not supported"
        disabled={disabled}
      >
        <MicOffIcon className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      style="soft"
      color={listening ? "destructive" : "default"}
      size="icon"
      onClick={handleToggleListening}
      disabled={disabled}
      tooltip={listening ? "Stop dictation" : "Start dictation"}
      className={listening ? "text-red-500 hover:text-red-600 hover:bg-red-100" : ""}
    >
      {listening ? <MicOffIcon className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
    </Button>
  );
} 