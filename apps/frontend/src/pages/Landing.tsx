import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Mic, ArrowRight } from 'lucide-react';

export function LandingPage({ user }: { user: { id: string; name: string; email: string } | null }) {
  const startHref = user ? '/app' : '/signup';

  return (
    <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
      <Nav startHref={startHref} />
      <Hero startHref={startHref} />
      <Examples />
      <HowItWorks />
      <VoiceSection />
      <FinalCTA startHref={startHref} />
      <footer className="border-t border-white/6 py-10 text-center text-[13px] text-ink-dim">
        Temporary — remember things you don't want to remember forever.
      </footer>
    </div>
  );
}

function Nav({ startHref }: { startHref: string }) {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent">
          <span className="h-3 w-3 rounded-full border-[2.5px] border-accent-ink" />
        </span>
        <span className="text-[15px] font-medium tracking-tight text-ink">Temporary.</span>
      </div>
      <nav className="flex items-center gap-2">
        <Link
          to="/login"
          className="rounded-lg px-3.5 py-2 text-[13px] text-ink-dim transition hover:text-ink"
        >
          Log in
        </Link>
        <Link
          to={startHref}
          className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-accent-ink transition hover:brightness-110"
        >
          Start remembering
        </Link>
      </nav>
    </header>
  );
}

function Hero({ startHref }: { startHref: string }) {
  return (
    <section className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <h1 className="text-[42px] font-medium leading-[1.04] tracking-[-0.03em] text-ink sm:text-6xl">
          Remember things you don't want to remember forever.
        </h1>
        <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-dim sm:text-lg">
          Temporary memories for the things that matter right now — and disappear when you don't
          need them anymore.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to={startHref}
            className="rounded-xl bg-accent px-5 py-3 text-[14px] font-medium text-accent-ink transition hover:brightness-110"
          >
            Start remembering
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-white/12 px-5 py-3 text-[14px] text-ink transition hover:border-white/25 hover:bg-white/4"
          >
            Log in
          </Link>
        </div>
      </div>
      <div className="flex justify-center lg:justify-end">
        <ForgettingCard />
      </div>
    </section>
  );
}

const COUNTDOWN_STAGES = ['2h 18m', '1h 04m', '28 min', 'FORGOTTEN'] as const;

/** The hero demo: one memory object that counts down and gently fades away. */
function ForgettingCard() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= COUNTDOWN_STAGES.length - 1) return;
    const t = setTimeout(() => setStage((s) => s + 1), 2600);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage < COUNTDOWN_STAGES.length - 1) return;
    const id = setInterval(() => setStage(0), 4200);
    return () => clearInterval(id);
  }, [stage]);

  const forgotten = stage === COUNTDOWN_STAGES.length - 1;

  return (
    <motion.div
      animate={
        forgotten
          ? { opacity: 0.12, scale: 0.97, filter: 'blur(3px)' }
          : { opacity: 1, scale: 1, filter: 'blur(0px)' }
      }
      transition={{ duration: 1.4, ease: 'easeInOut' }}
      className="w-72 rounded-2xl border border-white/10 bg-white/[0.04] p-6"
    >
      <h3 className="text-[15px] font-medium text-ink">Wi-Fi password</h3>
      <p className="mt-0.5 text-[13px] text-ink-dim">GuestNetwork — 4829</p>
      <div className="mt-6">
        <div className="text-[10px] font-medium tracking-[0.18em] text-ink-dim">
          {forgotten ? 'STATUS' : 'FORGETS IN'}
        </div>
        <div className="relative mt-1.5 h-8">
          {COUNTDOWN_STAGES.map((label, i) => (
            <motion.span
              key={label}
              initial={false}
              animate={{
                opacity: stage === i ? 1 : 0,
                y: stage === i ? 0 : i < stage ? -10 : 10,
              }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={`absolute inset-x-0 font-mono text-2xl tabular-nums ${
                forgotten ? 'text-ink-dim' : i >= 2 ? 'text-accent' : 'text-ink'
              }`}
            >
              {label}
            </motion.span>
          ))}
        </div>
      </div>
      <div className="mt-5 h-0.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${Math.max(4, 100 - (stage / (COUNTDOWN_STAGES.length - 1)) * 96)}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </motion.div>
  );
}

const EXAMPLES = [
  { title: 'Parking spot', body: 'B3 — 27 · until 10 PM' },
  { title: 'Wi-Fi password', body: 'GuestNetwork / 48291 · until tomorrow' },
  { title: 'Package return', body: 'Drop it at the courier · 5 days' },
  { title: 'Room number', body: '412 · until checkout' },
  { title: 'A promise', body: '“Rahul owes me ₹800” · until Friday' },
];

function Examples() {
  return (
    <section className="py-16 sm:py-24">
      <h2 className="text-[13px] font-medium tracking-[0.18em] text-ink-dim">
        THINGS YOU ONLY NEED FOR A WHILE
      </h2>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {EXAMPLES.map((ex, i) => (
          <motion.div
            key={ex.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: (i % 3) * 0.07 }}
            className={`break-inside-avoid rounded-2xl border border-white/8 bg-white/[0.03] p-5 ${
              i % 3 === 1 ? 'sm:mt-8' : ''
            }`}
          >
            <h3 className="text-[15px] font-medium text-ink">{ex.title}</h3>
            <p className="mt-1 text-[13px] text-ink-dim">{ex.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: '01', label: 'Capture', body: 'Type it or say it. A few seconds, done.' },
  { n: '02', label: 'Keep it', body: 'For as long as you need — an hour, a week.' },
  { n: '03', label: 'Forget it', body: 'It disappears on its own. No cleanup.' },
];

function HowItWorks() {
  return (
    <section className="py-16 sm:py-24">
      <div className="space-y-10">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className="flex items-baseline gap-6 border-b border-white/6 pb-8"
          >
            <span className="font-mono text-[13px] text-ink-dim">{step.n}</span>
            <div className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">{step.label}</h3>
              <p className="text-[14px] text-ink-dim">{step.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function VoiceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-16 sm:py-24">
      <div className="flex items-center gap-2.5 text-[13px] text-ink-dim">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/6">
          <Mic size={14} />
        </span>
        Say it out loud. We'll keep it for a while.
        <span className="rounded-full border border-accent/30 px-2 py-0.5 text-[11px] font-medium text-accent">
          free
        </span>
      </div>

      <div className="mt-8 grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
        <motion.blockquote
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-[17px] font-light leading-relaxed text-ink"
        >
          “Remember I parked in B3 level 27 until 10 PM.”
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex justify-center text-ink-dim sm:rotate-0"
        >
          <ArrowRight className="rotate-90 sm:rotate-0" size={18} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-2xl border border-white/10 bg-white/[0.05] p-6"
        >
          <h3 className="text-[15px] font-medium text-ink">Parking</h3>
          <p className="mt-0.5 text-[13px] text-ink-dim">B3 level 27</p>
          <div className="mt-5">
            <div className="text-[10px] font-medium tracking-[0.18em] text-ink-dim">FORGETS AT</div>
            <div className="mt-1 font-mono text-2xl tabular-nums text-accent">10:00 PM</div>
          </div>
        </motion.div>
      </div>

      {/* Reveal the words that trigger the parse */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6 }}
        className="mt-5 text-center text-[13px] text-ink-dim"
      >
        “until 10 PM” is all it takes — the expiry is understood for you.
      </motion.p>
    </section>
  );
}

function FinalCTA({ startHref }: { startHref: string }) {
  return (
    <section className="py-20 text-center sm:py-28">
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-xl text-4xl font-medium tracking-[-0.03em] text-ink sm:text-5xl"
      >
        Your brain has better things to remember.
      </motion.h2>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <Link
          to={startHref}
          className="inline-block rounded-xl bg-accent px-6 py-3.5 text-[15px] font-medium text-accent-ink transition hover:brightness-110"
        >
          Start remembering
        </Link>
      </motion.div>
    </section>
  );
}
