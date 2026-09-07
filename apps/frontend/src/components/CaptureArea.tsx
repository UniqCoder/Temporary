import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Mic, StopCircle } from 'lucide-react';
import {
  EXPIRY_CHOICES,
  formatExpiryClock,
  toLocalInputValue,
  parseExpiry,
  deriveTitleContent,
  extractExpiryPhrase,
} from '@tm/shared';
import { useSpeech } from '../hooks/useSpeech';
import { NamePrompt } from './NamePrompt';

interface CaptureAreaProps {
  onCreate: (input: { title: string; content: string; source: 'text' | 'voice'; expiresAt: string }) => Promise<void>;
  onVoiceTranscript: (transcript: string) => void;
}

interface PendingMemory {
  content: string;
  suggestedName: string;
  expiresAt: string;
}

export function CaptureArea({ onCreate, onVoiceTranscript }: CaptureAreaProps) {
  const [text, setText] = useState('');
  const [expiryKey, setExpiryKey] = useState('tonight');
  const [customDate, setCustomDate] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nlNotice, setNlNotice] = useState<Date | null>(null);
  const [pending, setPending] = useState<PendingMemory | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const parsedExpiry = useMemo(() => parseExpiry(text), [text]);

  const resolvedExpiry = useMemo((): Date => {
    if (isCustom) {
      const d = customDate ? new Date(customDate) : null;
      return d && d.getTime() > Date.now() ? d : new Date(Date.now() + 60 * 60_000);
    }
    if (parsedExpiry) return parsedExpiry;
    const choice = EXPIRY_CHOICES.find((c) => c.key === expiryKey);
    return choice ? choice.compute(new Date()) : new Date(Date.now() + 2 * 3_600_000);
  }, [isCustom, customDate, parsedExpiry, expiryKey]);

  const speech = useSpeech((transcript) => {
    onVoiceTranscript(transcript);
  });

  // Enter/Add doesn't save immediately — it stages the memory and asks for a name.
  const stageForNaming = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Write something first.');
      return;
    }
    setError(null);
    const { cleaned } = extractExpiryPhrase(trimmed);
    const base = cleaned || trimmed;
    const { title, content } = deriveTitleContent(base);
    setPending({
      // `content` is only the text beyond the first sentence — stays empty for
      // a short one-liner, so it never repeats the name back underneath it.
      content,
      suggestedName: title,
      expiresAt: resolvedExpiry.toISOString(),
    });
  };

  const confirmName = async (name: string) => {
    if (!pending) return;
    setBusy(true);
    setSaveError(null);
    try {
      await onCreate({
        title: name,
        content: pending.content,
        source: 'text',
        expiresAt: pending.expiresAt,
      });
      setText('');
      setNlNotice(null);
      setPending(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Capture a memory">
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 focus-within:border-white/20 transition-colors sm:p-5">
        <label htmlFor="capture-input" className="sr-only">
          What do you want to remember?
        </label>
        <textarea
          id="capture-input"
          ref={inputRef}
          rows={2}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setNlNotice(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              stageForNaming();
            }
          }}
          placeholder="GuestNetwork password until tomorrow…"
          className="w-full resize-none bg-transparent text-lg font-light text-ink placeholder:text-ink-dim/60 focus:outline-none"
        />

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {EXPIRY_CHOICES.map((choice) => {
            if (choice.key === 'custom') {
              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    setExpiryKey('custom');
                    if (!customDate) {
                      const d = new Date(Date.now() + 60 * 60_000);
                      setCustomDate(toLocalInputValue(d));
                    }
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    isCustom
                      ? 'bg-accent text-accent-ink'
                      : 'text-ink-dim hover:bg-white/6 hover:text-ink'
                  }`}
                >
                  Custom
                </button>
              );
            }
            const isActive = isCustom
              ? false
              : parsedExpiry
                ? false
              : choice.key === expiryKey;
            return (
              <button
                key={choice.key}
                type="button"
                onClick={() => {
                  setIsCustom(false);
                  setExpiryKey(choice.key);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  isActive ? 'bg-accent text-accent-ink' : 'text-ink-dim hover:bg-white/6 hover:text-ink'
                }`}
              >
                {choice.label}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <AnimatePresence>
              {isCustom && (
                <motion.input
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  type="datetime-local"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-ink"
                />
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => (speech.listening ? speech.stop() : speech.start())}
              disabled={!speech.supported}
              title={speech.supported ? 'Speak' : 'Voice not supported in this browser'}
              className={`grid h-9 w-9 place-items-center rounded-full transition ${
                speech.listening
                  ? 'bg-danger text-white'
                  : speech.supported
                    ? 'text-ink-dim hover:bg-white/8 hover:text-ink'
                    : 'cursor-not-allowed text-ink-dim/40'
              }`}
            >
              {speech.listening ? <StopCircle size={17} /> : <Mic size={17} />}
            </button>

            <button
              type="button"
              onClick={stageForNaming}
              disabled={busy || !text.trim()}
              className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-ink transition hover:brightness-110 disabled:opacity-30"
              aria-label="Add memory"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {speech.listening && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/4 px-3.5 py-2.5">
                <span className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18 }}
                      className="h-1.5 w-1.5 rounded-full bg-danger"
                    />
                  ))}
                </span>
                <span className="text-[13px] text-ink">Listening… tap the mic to stop</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(error || nlNotice) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 flex items-center justify-between gap-3 text-[13px]">
                {error && <span className="text-danger">{error}</span>}
                {nlNotice && !error && (
                  <span className="text-ink-dim">
                    Parsed expiry — forgets at{' '}
                    <span className="text-accent">{formatExpiryClock(nlNotice.toISOString())}</span>
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {pending && (
          <NamePrompt
            suggested={pending.suggestedName}
            busy={busy}
            error={saveError}
            onCancel={() => {
              setPending(null);
              setSaveError(null);
            }}
            onConfirm={(name) => void confirmName(name)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
