import { AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessGate } from './components/AccessGate';
import { Atmosphere } from './components/Atmosphere';
import { IntroScreen } from './components/IntroScreen';
import { QuestionCard } from './components/QuestionCard';
import { ResultScreen } from './components/ResultScreen';
import questionsData from './data/questions.json';
import { checkSession, recordAttempt, redeemAccessCode } from './lib/api';
import { calculateResult } from './lib/scoring';
import type { Option, Question } from './types';

const questions = questionsData as Question[];

type Phase = 'intro' | 'question' | 'result';
type AuthPhase = 'checking' | 'locked' | 'ready';

function App() {
  const isDev = import.meta.env.DEV;
  const isLocalHost = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
  const canBypassAuth = isDev || isLocalHost;
  const [authPhase, setAuthPhase] = useState<AuthPhase>('checking');
  const [authError, setAuthError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Option[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasRecordedAttempt, setHasRecordedAttempt] = useState(false);
  const didBootstrapRef = useRef(false);
  const didRecordAttemptRef = useRef(false);

  const resultBundle = useMemo(() => {
    const url = new URL(window.location.href);
    const previewRole = url.searchParams.get('result');

    if (previewRole) {
      const preview = calculateResult([]);
      const forced = preview.ranked.find((entry) => entry.result.id === previewRole);

      if (forced) {
        const sortedDimensions = [...Object.entries(forced.result.profile)]
          .sort((a, b) => b[1] - a[1])
          .map(([dimension]) => dimension as keyof typeof forced.result.profile);

        return {
          ...preview,
          result: forced.result,
          ranked: preview.ranked,
          userScores: forced.result.profile,
          normalizedScores: forced.result.profile,
          topDimensions: sortedDimensions.slice(0, 5),
        };
      }
    }

    if (answers.length !== questions.length) {
      return null;
    }

    return calculateResult(answers);
  }, [answers]);

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }

    didBootstrapRef.current = true;

    const bootstrapAuth = async () => {
      const url = new URL(window.location.href);
      const devBypass =
        canBypassAuth &&
        (url.searchParams.get('dev') === '1' || Boolean(url.searchParams.get('result')));

      if (devBypass) {
        setAuthError(null);
        setAuthPhase('ready');
        return;
      }

      const session = await checkSession();
      if (session.ok) {
        setAuthPhase('ready');
        return;
      }

      const code = url.searchParams.get('k');

      if (!code) {
        if (session.unreachable) {
          setAuthError('授权服务未启动或不可达。本机调试可在地址后加 `?dev=1`。');
        }
        setAuthPhase('locked');
        return;
      }

      const result = await redeemAccessCode(code);
      if (result.ok) {
        url.searchParams.delete('k');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
        setAuthError(null);
        setAuthPhase('ready');
        return;
      }

      setAuthError(result.message ?? '授权校验失败。');
      setAuthPhase('locked');
    };

    void bootstrapAuth();
  }, []);

  useEffect(() => {
    if (didRecordAttemptRef.current) {
      return;
    }

    const saveAttempt = async () => {
      if (phase !== 'result' || !resultBundle || hasRecordedAttempt) {
        return;
      }

       didRecordAttemptRef.current = true;

      const payload = {
        resultId: resultBundle.result.id,
        answers: answers.map((option, index) => ({
          questionId: questions[index].id,
          optionId: option.id,
        })),
        scores: resultBundle.normalizedScores,
      };

      const ok = await recordAttempt(payload);
      if (ok) {
        setHasRecordedAttempt(true);
        return;
      }

      didRecordAttemptRef.current = false;
    };

    void saveAttempt();
  }, [answers, hasRecordedAttempt, phase, resultBundle]);

  useEffect(() => {
    if (resultBundle && new URL(window.location.href).searchParams.get('result')) {
      setPhase('result');
    }
  }, [resultBundle]);

  const handleStart = () => {
    setPhase('question');
  };

  const handleSelect = (option: Option) => {
    if (selectedId) {
      return;
    }

    const isLastQuestion = currentIndex === questions.length - 1;
    setSelectedId(option.id);

    window.setTimeout(() => {
      setAnswers((prev) => [...prev, option]);

      if (isLastQuestion) {
        setPhase('result');
      } else {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }

      setSelectedId(null);
    }, 360);
  };

  const handleRestart = () => {
    setPhase('intro');
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedId(null);
    setHasRecordedAttempt(false);
    didRecordAttemptRef.current = false;
  };

  const handleBack = () => {
    if (currentIndex === 0 || selectedId) {
      return;
    }

    setAnswers((prev) => prev.slice(0, -1));
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleRedeem = async (code: string) => {
    setAuthPhase('checking');
    const result = await redeemAccessCode(code);

    if (result.ok) {
      const url = new URL(window.location.href);
      url.searchParams.delete('k');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      setAuthError(null);
      setAuthPhase('ready');
      return;
    }

    setAuthError(result.message ?? '授权校验失败。');
    setAuthPhase('locked');
  };

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-grain text-fog">
      <Atmosphere />
      <div className="relative mx-auto min-h-[100svh] max-w-2xl">
        {authPhase === 'locked' ? (
          <AccessGate
            isChecking={false}
            error={authError}
            onSubmit={handleRedeem}
          />
        ) : null}

        <AnimatePresence mode="wait">
          {authPhase === 'ready' && phase === 'intro' ? (
            <IntroScreen
              key="intro-screen"
              onStart={handleStart}
            />
          ) : null}

          {authPhase === 'ready' && phase === 'question' ? (
            <QuestionCard
              key={questions[currentIndex].id}
              question={questions[currentIndex]}
              index={currentIndex}
              total={questions.length}
              selectedId={selectedId}
              canGoBack={currentIndex > 0}
              onBack={handleBack}
              onSelect={handleSelect}
            />
          ) : null}

          {authPhase === 'ready' && phase === 'result' && resultBundle ? (
            <ResultScreen
              key={resultBundle.result.id}
              result={resultBundle.result}
              scores={resultBundle.normalizedScores}
              topDimensions={resultBundle.topDimensions}
              onRestart={handleRestart}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default App;
