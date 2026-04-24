import type { ModelId, ProviderName, Ratio } from './types';

export interface ModelSpec {
  modelId: ModelId;
  provider: ProviderName;
  upstreamModel: string;
  ratios: ReadonlyArray<Ratio>;
}

const ALL_RATIOS: ReadonlyArray<Ratio> = [
  '1:1','2:3','3:2','4:3','3:4','4:5','5:4','16:9','9:16','21:9','1:4','4:1','1:8','8:1',
];
const PRO_RATIOS: ReadonlyArray<Ratio> = ALL_RATIOS.slice(0, 10) as ReadonlyArray<Ratio>;

export const MODEL_REGISTRY: Readonly<Record<ModelId, ModelSpec>> = {
  'gemini-3.1-flash-image-preview': {
    modelId: 'gemini-3.1-flash-image-preview',
    provider: 'newapi',
    upstreamModel: 'gemini-3.1-flash-image-preview',
    ratios: ALL_RATIOS,
  },
  'gemini-3-pro-image-preview': {
    modelId: 'gemini-3-pro-image-preview',
    provider: 'newapi',
    upstreamModel: 'gemini-3-pro-image-preview',
    ratios: ALL_RATIOS,
  },
  'zhipu-nanobanana-2': {
    modelId: 'zhipu-nanobanana-2',
    provider: 'zhipu-router',
    upstreamModel: 'google/gemini-3.1-flash-image-preview',
    ratios: ALL_RATIOS,
  },
  'zhipu-nanobanana-pro': {
    modelId: 'zhipu-nanobanana-pro',
    provider: 'zhipu-paas',
    upstreamModel: 'gemini-3-pro-image-preview',
    ratios: PRO_RATIOS,
  },
};

export const ALL_MODEL_IDS: ReadonlyArray<ModelId> = Object.keys(MODEL_REGISTRY) as ModelId[];
export const ALL_QUALITIES = ['0.5K','1K','2K','4K'] as const;
