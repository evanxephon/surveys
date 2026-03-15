export type Dimension =
  | 'reason'
  | 'faith'
  | 'nihilism'
  | 'compassion'
  | 'desire'
  | 'pride'
  | 'selfDestruction'
  | 'fantasy'
  | 'resentment'
  | 'devotion';

export type RoleId =
  | 'raskolnikov'
  | 'sonya'
  | 'myshkin'
  | 'nastasya'
  | 'ivan'
  | 'alyosha'
  | 'dmitri'
  | 'grushenka'
  | 'smerdyakov'
  | 'stavrogin'
  | 'kirillov'
  | 'underground'
  | 'alexei'
  | 'nelly'
  | 'devushkin'
  | 'netochka'
  | 'dreamer'
  | 'nastenka';

export type Weights = Partial<Record<Dimension, number>>;
export type FullWeights = Record<Dimension, number>;

export interface Option {
  id: string;
  label: string;
  text: string;
  weights: Weights;
  roleAffinity: Partial<Record<RoleId, number>>;
}

export interface Question {
  id: string;
  prompt: string;
  options: Option[];
}

export interface ResultProfile {
  id: RoleId;
  name: string;
  russianName: string;
  source: string;
  title: string;
  verdict: string;
  analysis: string;
  quote: string;
  communityMbti?: string;
  palette: {
    accent: string;
    secondary: string;
    glow: string;
    surface: string;
    paper: string;
  };
  profile: FullWeights;
}

export interface RankedResult {
  result: ResultProfile;
  score: number;
}

export interface MbtiMatch {
  type: string;
  score: number;
}
