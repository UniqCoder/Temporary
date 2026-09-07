import { useEffect, useRef, useState } from 'react';

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeech(onTranscript: (text: string) => void) {
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef(onTranscript);
  transcriptRef.current = onTranscript;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const start = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('Voice is not supported in this browser — type it instead.');
      return;
    }
    setError(null);

    const rec = new Ctor();
    rec.lang = navigator.language || 'en-US';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) finalText += result[0].transcript;
      }
      if (finalText.trim()) transcriptRef.current(finalText.trim());
    };
    rec.onerror = (event) => {
      const code = event.error ?? 'unknown';
      setError(
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone access was blocked.'
          : code === 'no-speech'
            ? 'Nothing was heard. Try again.'
            : 'Voice input failed. Type it instead.',
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      setError('Could not start listening. Try again.');
    }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return { supported, listening, error, start, stop, clearError: () => setError(null) };
}
