import questionsData from '../data/questions.json';
import resultsData from '../data/results.json';
import type {
  Dimension,
  FullWeights,
  MbtiMatch,
  Option,
  RankedResult,
  ResultProfile,
  RoleId,
} from '../types';

export const dimensions: Dimension[] = [
  'reason',
  'faith',
  'nihilism',
  'compassion',
  'desire',
  'pride',
  'selfDestruction',
  'fantasy',
  'resentment',
  'devotion',
];

export const questions = questionsData as { options: Option[] }[];
export const results = resultsData as ResultProfile[];

export const emptyScores = (): FullWeights => ({
  reason: 0,
  faith: 0,
  nihilism: 0,
  compassion: 0,
  desire: 0,
  pride: 0,
  selfDestruction: 0,
  fantasy: 0,
  resentment: 0,
  devotion: 0,
});

const emptyAffinity = (): Record<RoleId, number> => ({
  raskolnikov: 0,
  sonya: 0,
  myshkin: 0,
  nastasya: 0,
  ivan: 0,
  alyosha: 0,
  dmitri: 0,
  grushenka: 0,
  smerdyakov: 0,
  stavrogin: 0,
  kirillov: 0,
  underground: 0,
  alexei: 0,
  nelly: 0,
  devushkin: 0,
  netochka: 0,
  dreamer: 0,
  nastenka: 0,
});

const RESULT_AFFINITY_WEIGHT = 7;
const RESULT_DRAMA_BLEND = 0.35;

// Random-answer baselines sampled from the current question bank.
// We compare each role against its own natural score distribution instead of
// adding hand-tuned bonuses, so rare roles can surface without breaking tone.
const RESULT_SCORE_BASELINE: Record<RoleId, { mean: number; std: number }> = {
  raskolnikov: { mean: 108.2048, std: 20.4099 },
  sonya: { mean: 86.5244, std: 29.323 },
  myshkin: { mean: 76.1203, std: 23.6677 },
  nastasya: { mean: 100.4277, std: 25.3706 },
  ivan: { mean: 92.9743, std: 23.7332 },
  alyosha: { mean: 76.2678, std: 26.6394 },
  dmitri: { mean: 69.3901, std: 17.561 },
  grushenka: { mean: 76.9401, std: 18.6861 },
  smerdyakov: { mean: 60.6773, std: 17.1058 },
  stavrogin: { mean: 82.7697, std: 21.1386 },
  kirillov: { mean: 79.9387, std: 16.0468 },
  underground: { mean: 95.3724, std: 22.0873 },
  alexei: { mean: 55.0061, std: 15.668 },
  nelly: { mean: 62.7646, std: 17.6264 },
  devushkin: { mean: 67.9228, std: 16.4239 },
  netochka: { mean: 75.177, std: 15.8401 },
  dreamer: { mean: 69.1941, std: 19.2687 },
  nastenka: { mean: 59.7193, std: 14.0172 },
};

const mbtiProfiles: Record<string, FullWeights> = {
  INTJ: {
    reason: 5,
    faith: 1,
    nihilism: 3,
    compassion: 1,
    desire: 1,
    pride: 4,
    selfDestruction: 2,
    fantasy: 2,
    resentment: 1,
    devotion: 1,
  },
  INTP: {
    reason: 5,
    faith: 0,
    nihilism: 4,
    compassion: 1,
    desire: 1,
    pride: 2,
    selfDestruction: 2,
    fantasy: 3,
    resentment: 2,
    devotion: 0,
  },
  INFJ: {
    reason: 3,
    faith: 4,
    nihilism: 1,
    compassion: 4,
    desire: 1,
    pride: 1,
    selfDestruction: 2,
    fantasy: 4,
    resentment: 1,
    devotion: 4,
  },
  INFP: {
    reason: 2,
    faith: 3,
    nihilism: 1,
    compassion: 4,
    desire: 2,
    pride: 2,
    selfDestruction: 2,
    fantasy: 5,
    resentment: 1,
    devotion: 2,
  },
  ENFP: {
    reason: 2,
    faith: 2,
    nihilism: 1,
    compassion: 4,
    desire: 4,
    pride: 2,
    selfDestruction: 1,
    fantasy: 4,
    resentment: 1,
    devotion: 2,
  },
  ENFJ: {
    reason: 2,
    faith: 3,
    nihilism: 1,
    compassion: 5,
    desire: 3,
    pride: 2,
    selfDestruction: 1,
    fantasy: 3,
    resentment: 1,
    devotion: 4,
  },
  ISFJ: {
    reason: 2,
    faith: 4,
    nihilism: 0,
    compassion: 4,
    desire: 1,
    pride: 2,
    selfDestruction: 1,
    fantasy: 2,
    resentment: 1,
    devotion: 4,
  },
  ISFP: {
    reason: 1,
    faith: 1,
    nihilism: 2,
    compassion: 3,
    desire: 4,
    pride: 3,
    selfDestruction: 3,
    fantasy: 3,
    resentment: 2,
    devotion: 1,
  },
  ESFP: {
    reason: 1,
    faith: 1,
    nihilism: 1,
    compassion: 3,
    desire: 5,
    pride: 3,
    selfDestruction: 2,
    fantasy: 2,
    resentment: 1,
    devotion: 1,
  },
  ISTP: {
    reason: 4,
    faith: 0,
    nihilism: 3,
    compassion: 1,
    desire: 2,
    pride: 2,
    selfDestruction: 1,
    fantasy: 1,
    resentment: 2,
    devotion: 0,
  },
};

const normalizeScores = (scores: FullWeights): FullWeights => {
  const max = Math.max(...Object.values(scores), 1);
  const next = emptyScores();

  for (const dimension of dimensions) {
    next[dimension] = Number(((scores[dimension] / max) * 5).toFixed(2));
  }

  return next;
};

export const inferMbti = (scores: FullWeights): MbtiMatch[] => {
  const normalized = normalizeScores(scores);

  return Object.entries(mbtiProfiles)
    .map(([type, profile]) => {
      const score = dimensions.reduce((total, dimension) => {
        const distance = Math.abs(normalized[dimension] - profile[dimension]);
        return total + (5 - distance);
      }, 0);

      return { type, score: Number(score.toFixed(2)) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
};

export const calculateResult = (answers: Option[]) => {
  const userScores = answers.reduce<FullWeights>((acc, option) => {
    for (const dimension of dimensions) {
      acc[dimension] += option.weights[dimension] ?? 0;
    }
    return acc;
  }, emptyScores());

  const affinityScores = answers.reduce<Record<RoleId, number>>((acc, option) => {
    for (const [roleId, value] of Object.entries(option.roleAffinity)) {
      acc[roleId as RoleId] += value ?? 0;
    }
    return acc;
  }, emptyAffinity());

  const normalizedUserScores = normalizeScores(userScores);

  const ranked: RankedResult[] = results
    .map((result) => {
      const dimensionScore = dimensions.reduce((total, dimension) => {
        return total + normalizedUserScores[dimension] * result.profile[dimension];
      }, 0);

      const rawScore = dimensionScore + affinityScores[result.id] * RESULT_AFFINITY_WEIGHT;
      const baseline = RESULT_SCORE_BASELINE[result.id];
      const relativeStrength = (rawScore - baseline.mean) / baseline.std;
      const calibratedScore = relativeStrength + RESULT_DRAMA_BLEND * (rawScore / 100);

      return {
        result,
        score: Number(calibratedScore.toFixed(2)),
      };
    })
    .sort((a, b) => b.score - a.score);

  const mbtiMatches = inferMbti(userScores);

  return {
    result: ranked[0].result,
    ranked,
    userScores,
    normalizedScores: normalizedUserScores,
    topDimensions: [...dimensions]
      .sort((a, b) => userScores[b] - userScores[a])
      .slice(0, 5),
    mbtiMatches,
  };
};
