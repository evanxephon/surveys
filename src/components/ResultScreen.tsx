import { toBlob } from 'html-to-image';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
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

function buildPosterTags(topDimensions: Dimension[], scores: FullWeights) {
  return topDimensions.slice(0, 5).map((dimension, index) => ({
    dimension,
    value: scores[dimension],
    className:
      index === 0
        ? 'px-3.5 py-2.5 text-[1.1rem]'
        : index === 1
          ? 'px-3.5 py-2 text-[0.98rem]'
          : index === 2
            ? 'px-3 py-2 text-[0.92rem]'
            : 'px-3 py-2 text-[0.86rem]',
  }));
}

function SharePoster({
  result,
}: {
  result: ResultProfile;
}) {
  return (
    <div
      className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[34px] border border-white/12 px-4 pb-5 pt-4 shadow-glow"
      style={{
        background: `radial-gradient(circle at 15% 18%, ${result.palette.glow}, transparent 30%), radial-gradient(circle at 84% 14%, rgba(255,255,255,0.08), transparent 22%), linear-gradient(140deg, ${result.palette.surface}, ${result.palette.secondary})`,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_28%,rgba(0,0,0,0.18))]" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="max-w-[14rem] text-[12px] leading-6 text-fog/84">{SHARE_CONFIG.shareSubtitle}</p>
          <div className="rounded-full border border-white/12 bg-black/12 px-3 py-1 text-[10px] tracking-[0.16em] text-parchment/72">
            {result.source}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/16 px-4 pb-12 pt-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="relative mx-auto max-w-[15rem]">
            <PortraitTile
              roleId={result.id}
              alt={result.name}
              className="mx-auto aspect-square w-full rounded-[24px] border border-white/10 bg-[#d5cab7]"
              imageClassName="h-full w-full object-cover"
              overlayClassName="bg-[linear-gradient(180deg,rgba(16,10,10,0.04),rgba(16,10,10,0.16))]"
            />
          </div>
        </div>

        <div className="space-y-2 px-1">
          <p className="font-display text-[2.8rem] leading-[0.92] text-fog">{result.name}</p>
          <p className="text-xs uppercase tracking-[0.28em] text-parchment/56">{result.russianName}</p>
          <p className="max-w-[18rem] text-[14px] leading-7 text-fog/78">{result.verdict}</p>
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

  const rankedTags = useMemo(() => buildPosterTags(topDimensions, scores), [topDimensions, scores]);

  const handleExport = async () => {
    if (!posterRef.current || isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      const blob = await toBlob(posterRef.current, {
        cacheBust: true,
        pixelRatio: 3,
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

  const handleShare = async () => {
    const shareUrl = SHARE_CONFIG.xiaohongshuPlaceholderUrl || SHARE_CONFIG.fallbackShareUrl;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${SHARE_CONFIG.shareSubtitle} · ${result.name}`,
          text: `${result.name}｜${result.verdict}`,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert('分享链接已复制。你可以把它贴到小红书帖子或私信里。');
    } catch {
      window.prompt('复制这个链接用于分享：', shareUrl);
    }
  };

  return (
    <>
      <motion.section
        key="result"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="px-4 pb-10 pt-6 sm:px-8"
      >
        <div className="mx-auto flex min-h-[100svh] max-w-xl flex-col gap-5">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.3em] text-parchment/62">The Verdict</p>
            <h2 className="font-display text-[3.15rem] leading-[0.9] text-fog sm:text-6xl">{result.name}</h2>
            <p className="text-[13px] uppercase tracking-[0.28em] text-parchment/54">{result.russianName}</p>
            <p className="text-[15px] leading-7 text-fog/72">{result.source} · {result.title}</p>
          </div>

          <div
            className="overflow-hidden rounded-[34px] border border-white/10 shadow-glow"
            style={{
              boxShadow: `0 30px 90px ${result.palette.glow}`,
              background: `radial-gradient(circle at top right, ${result.palette.glow}, transparent 30%), linear-gradient(140deg, ${result.palette.surface}, ${result.palette.secondary})`,
            }}
          >
            <div className="relative px-4 pb-4 pt-4 sm:px-6">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_28%,rgba(0,0,0,0.18))]" />
              <div className="relative space-y-4">
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/16 px-4 pb-12 pt-4">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.08),transparent_28%)]" />
                  <div className="relative mx-auto max-w-[15.5rem]">
                    <PortraitTile
                      roleId={result.id}
                      alt={result.name}
                      className="mx-auto aspect-square w-full rounded-[26px] border border-white/10 bg-[#d8cbb7]"
                      imageClassName="h-full w-full object-cover"
                      overlayClassName="bg-[linear-gradient(180deg,rgba(16,10,10,0.04),rgba(16,10,10,0.16))]"
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/16 p-4 backdrop-blur-sm">
                  <div className="flex flex-wrap gap-2 pb-3">
                    {rankedTags.slice(0, 5).map((tag, index) => (
                      <div
                        key={tag.dimension}
                        className={`rounded-full border px-3 py-1.5 ${
                          index === 0
                            ? 'border-parchment/45 bg-parchment/16 text-fog'
                            : 'border-white/14 bg-white/5 text-fog/84'
                        }`}
                      >
                        <div className="flex items-end gap-2 leading-none">
                          <span className="text-[13px]">{dimensionText[tag.dimension]}</span>
                          <span className="text-[11px] tracking-[0.12em] text-parchment/68">{tag.value.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="font-display text-[1.85rem] leading-[1.02] text-fog">{result.verdict}</p>
                  <p className="mt-3 text-[13px] leading-6 text-fog/74">{result.analysis}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-parchment/16 bg-[#171311]/85 p-5 backdrop-blur">
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
                          transition={{ duration: 0.45, delay: 0.03 }}
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

          <div className="grid grid-cols-1 gap-3 pb-[max(env(safe-area-inset-bottom),1rem)] sm:grid-cols-2">
            <button
              type="button"
              onClick={onRestart}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-4 text-sm tracking-[0.14em] text-fog/84 transition hover:bg-white/10"
            >
              再测一次
            </button>
            <button
              type="button"
              onClick={() => setShowSharePreview(true)}
              className="rounded-full border border-parchment/25 bg-parchment/90 px-5 py-4 text-sm tracking-[0.14em] text-soot transition hover:bg-parchment"
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
            className="fixed inset-0 z-50 bg-[#080605]"
          >
            <div className="flex h-full items-center justify-center px-3 py-3 sm:px-4 sm:py-6">
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.985 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="flex max-h-[calc(100svh-1rem)] w-full max-w-[28rem] flex-col rounded-[32px] border border-white/10 bg-[#130f0d] p-3 shadow-[0_35px_120px_rgba(0,0,0,0.55)]"
              >
                <div className="flex items-center justify-between pb-3">
                  <p className="text-sm uppercase tracking-[0.24em] text-parchment/68">分享预览</p>
                  <button
                    type="button"
                    onClick={() => setShowSharePreview(false)}
                    className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs tracking-[0.16em] text-fog/78 transition hover:bg-white/10"
                  >
                    关闭
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2">
                  <div ref={posterRef} className="mx-auto w-full max-w-[420px]">
                    <SharePoster result={result} />
                  </div>
                </div>

                <div className="mt-3 grid shrink-0 grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="rounded-full border border-parchment/25 bg-parchment/90 px-5 py-4 text-sm tracking-[0.14em] text-soot transition hover:bg-parchment disabled:cursor-wait disabled:opacity-75"
                    disabled={isExporting}
                  >
                    {isExporting ? '生成中…' : '保存图片'}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="rounded-full border border-white/12 bg-black/18 px-5 py-4 text-sm tracking-[0.14em] text-fog transition hover:bg-black/24"
                  >
                    分享链接
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
