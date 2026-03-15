import type { Option, Question } from '../types';

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  selectedId: string | null;
  canGoBack: boolean;
  onBack: () => void;
  onSelect: (option: Option) => void;
}

export function QuestionCard({
  question,
  index,
  total,
  selectedId,
  canGoBack,
  onBack,
  onSelect,
}: QuestionCardProps) {
  return (
    <section className="flex min-h-[100svh] flex-col justify-between px-6 pb-10 pt-8 sm:px-8">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.24em] text-parchment/70">
            <span>问题 · Суд {index + 1}</span>
            <div className="flex items-center gap-3">
              {canGoBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[10px] tracking-[0.18em] text-fog/76 transition hover:bg-white/10"
                >
                  上一题
                </button>
              ) : null}
              <span>
                {index + 1}/{total}
              </span>
            </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-parchment/40 via-white/15 to-transparent" />
          <div className="h-1 overflow-hidden rounded-full bg-white/8">
            <div
              style={{ width: `${((index + 1) / total) * 100}%` }}
              className="h-1 rounded-full bg-[linear-gradient(90deg,rgba(200,179,138,0.95),rgba(255,244,229,0.88))]"
            />
          </div>
        </div>

        <div className="space-y-5">
          <h2 className="font-display text-[2rem] leading-tight text-fog sm:text-5xl">
            {question.prompt}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={`w-full rounded-[28px] border px-5 py-4 text-left transition ${
                isSelected
                  ? 'border-parchment/60 bg-parchment/12 shadow-glow'
                  : 'border-white/10 bg-white/5 hover:border-parchment/30 hover:bg-white/8'
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs ${
                    isSelected
                      ? 'border-parchment/70 bg-parchment/80 text-soot'
                      : 'border-parchment/20 text-parchment/75'
                  }`}
                >
                  {option.label}
                </div>
                <p className="text-sm leading-7 text-fog/82">{option.text}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
