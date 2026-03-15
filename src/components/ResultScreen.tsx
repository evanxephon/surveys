import { toBlob } from 'html-to-image';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { PortraitTile } from './PortraitTile';
import { SHARE_CONFIG } from '../config/share';
import type { Dimension, FullWeights, ResultProfile } from '../types';

interface ResultScreenProps {
  result: ResultProfile;
  scores: FullWeights;
  topDimensions: Dimension[];
  onRestart: () => void;
}

const dimensionText: Record<Dimension, string> = {
  reason: '理性',
  faith: '信仰',
  nihilism: '虚无感',
  compassion: '同情心',
  desire: '欲望',
  pride: '自尊',
  selfDestruction: '自毁倾向',
  fantasy: '幻想',
  resentment: '怨恨',
  devotion: '奉献',
};

function SharePoster({
  result,
  topDimensions,
  scores,
}: {
  result: ResultProfile;
  topDimensions: Dimension[];
  scores: FullWeights;
}) {
  const posterTags = topDimensions.slice(0, 5);

  return (
    <div
      className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-[30px] border border-white/15 p-4 shadow-glow"
      style={{
        background: `radial-gradient(circle at 18% 18%, ${result.palette.glow}, transparent 30%), radial-gradient(circle at 85% 12%, rgba(255,255,255,0.08), transparent 22%), linear-gradient(135deg, ${result.palette.surface}, ${result.palette.secondary})`,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_30%,rgba(0,0,0,0.18))]" />
      <div className="relative flex flex-col">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs leading-5 text-fog/68">{SHARE_CONFIG.shareSubtitle}</p>
            </div>
            <div className="rounded-full border border-white/15 bg-black/15 px-3 py-1 text-[10px] tracking-[0.16em] text-parchment/72">
              {result.source}
            </div>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/18">
            <PortraitTile
              roleId={result.id}
              alt={result.name}
              className="mx-auto aspect-square w-full max-w-[14rem]"
              imageClassName="h-full w-full object-contain"
              overlayClassName="bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.26))]"
            />
          </div>

          <div>
            <p className="font-display text-[2.35rem] leading-[0.92] text-fog">{result.name}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-parchment/58">
              {result.russianName}
            </p>
            <p className="mt-2 text-[13px] leading-6 text-fog/76">{result.verdict}</p>
          </div>
        </div>

        <div className="pt-4">
          <div className="grid grid-cols-2 gap-2">
            {posterTags.map((dimension, index) => (
              <div
                key={dimension}
                className={`rounded-[18px] border px-3 py-2 ${
                  index === 0
                    ? 'border-parchment/35 bg-parchment/15 text-fog'
                    : 'border-white/12 bg-black/20 text-parchment/82'
                }`}
              >
                <div className="flex items-end justify-between gap-3">
                  <span className="text-[12px] tracking-[0.08em]">{dimensionText[dimension]}</span>
                  <span className="text-[11px] tracking-[0.12em] text-parchment/72">
                    {scores[dimension].toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResultScreen({
  result,
  scores,
  topDimensions,
  onRestart,
}: ResultScreenProps) {
  const maxDimension = Math.max(...Object.values(scores), 1);
  const posterRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);

  const handleExport = async () => {
    if (!posterRef.current || isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      const blob = await toBlob(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: result.palette.surface,
      });

      if (!blob) {
        throw new Error('share image generation failed');
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `陀思妥耶夫斯基角色-${result.name}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      window.alert('分享图生成失败，请稍后再试。');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <motion.section
        key="result"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 pb-12 pt-8 sm:px-8"
      >
        <div className="mx-auto flex min-h-[100svh] max-w-xl flex-col gap-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-parchment/68">The Verdict</p>
            <h2 className="font-display text-5xl leading-none text-fog sm:text-6xl">{result.name}</h2>
            <p className="text-sm uppercase tracking-[0.24em] text-parchment/56">{result.russianName}</p>
            <p className="text-base leading-7 text-fog/72">{result.source} · {result.title}</p>
          </div>

          <div
            className="overflow-hidden rounded-[34px] border border-white/10 shadow-glow"
            style={{
              boxShadow: `0 30px 90px ${result.palette.glow}`,
              background: `radial-gradient(circle at top right, ${result.palette.glow}, transparent 30%), linear-gradient(140deg, ${result.palette.surface}, ${result.palette.secondary})`,
            }}
          >
            <div className="relative px-6 py-6">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_28%,rgba(0,0,0,0.18))]" />
              <div className="absolute inset-x-0 top-[22%] h-px bg-white/10" />
              <div className="absolute left-[18%] top-[18%] h-28 w-56 rounded-full bg-white/8 blur-3xl" />
              <div className="absolute right-[8%] top-[28%] h-40 w-24 border-l border-white/10 opacity-45" />
              <div className="relative space-y-6">
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-black/18">
                  <PortraitTile
                    roleId={result.id}
                    alt={result.name}
                    className="mx-auto aspect-square w-full max-w-[18rem]"
                    imageClassName="h-full w-full object-contain"
                    overlayClassName="bg-[linear-gradient(180deg,rgba(25,20,24,0.1),rgba(15,9,14,0.35))]"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  {topDimensions.slice(0, 5).map((dimension, index) => (
                    <div
                      key={dimension}
                      className={`rounded-full border px-4 py-2.5 backdrop-blur-sm ${
                        index === 0
                          ? 'border-parchment/38 bg-parchment/16 text-fog'
                          : 'border-white/12 bg-black/18 text-fog/88'
                      }`}
                    >
                      <div className="flex items-end gap-3">
                        <span
                          className={`font-display leading-none ${
                            index === 0 ? 'text-[2.25rem]' : 'text-[1.7rem]'
                          }`}
                        >
                          {dimensionText[dimension]}
                        </span>
                        <span className="pb-1 text-xs tracking-[0.2em] text-parchment/70">
                          {scores[dimension].toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[30px] border border-white/10 bg-black/16 p-5 backdrop-blur-sm">
                  <p className="font-display text-3xl leading-tight text-fog">{result.verdict}</p>
                  <p className="mt-4 text-sm leading-7 text-fog/74">{result.analysis}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-parchment/16 bg-[#171311]/85 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.24em] text-parchment/70">灵魂剖面</p>
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: result.palette.accent }} />
            </div>
            <div className="mt-5 space-y-4">
              {(Object.keys(dimensionText) as Dimension[]).map((dimension) => {
                const width = (scores[dimension] / maxDimension) * 100;
                const isZero = scores[dimension] === 0;

                return (
                  <div key={dimension} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-fog/72">
                      <span>{dimensionText[dimension]}</span>
                      <span>{scores[dimension].toFixed(1)}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-white/6">
                      {isZero ? (
                        <div
                          className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2"
                          style={{
                            clipPath: 'polygon(0 50%, 100% 0, 100% 100%)',
                            background: `linear-gradient(180deg, ${result.palette.paper}, ${result.palette.accent})`,
                          }}
                        />
                      ) : (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(width, 1.5)}%` }}
                          transition={{ duration: 0.7, delay: 0.08 }}
                          className="h-2 rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${result.palette.accent}, ${result.palette.paper})`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <button
              type="button"
              onClick={onRestart}
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-4 text-sm tracking-[0.14em] text-fog/84 transition hover:bg-white/10"
            >
              再测一次
            </button>
            <button
              type="button"
              onClick={() => setShowSharePreview(true)}
              className="flex-1 rounded-full border border-parchment/25 bg-parchment/90 px-5 py-4 text-sm tracking-[0.14em] text-soot transition hover:bg-parchment"
            >
              查看分享预览
            </button>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {showSharePreview ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/72 backdrop-blur-sm"
          >
            <div className="flex h-full items-center justify-center px-4 py-4 sm:py-8">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex max-h-[calc(100svh-2rem)] w-full max-w-[26rem] flex-col rounded-[34px] border border-white/10 bg-[#130f0d]/96 p-4 shadow-glow"
              >
                <div className="flex items-center justify-between pb-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-parchment/68">分享预览</p>
                  <button
                    type="button"
                    onClick={() => setShowSharePreview(false)}
                    className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs tracking-[0.16em] text-fog/78 transition hover:bg-white/10"
                  >
                    关闭
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div ref={posterRef} className="mx-auto w-full max-w-[380px] overflow-visible">
                    <SharePoster result={result} topDimensions={topDimensions} scores={scores} />
                  </div>
                </div>

                <div className="mt-4 flex shrink-0 gap-3">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="flex-1 rounded-full border border-parchment/25 bg-parchment/90 px-5 py-4 text-sm tracking-[0.14em] text-soot transition hover:bg-parchment disabled:cursor-wait disabled:opacity-75"
                    disabled={isExporting}
                  >
                    {isExporting ? '保存中...' : '保存图片'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSharePreview(false)}
                    className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-4 text-sm tracking-[0.14em] text-fog/84 transition hover:bg-white/10"
                  >
                    返回结果
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
