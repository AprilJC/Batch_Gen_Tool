export type Ratio =
  | '1:1' | '2:3' | '3:2' | '4:3' | '3:4' | '4:5' | '5:4'
  | '16:9' | '9:16' | '21:9'
  | '1:4' | '4:1' | '1:8' | '8:1';

export type Quality = '0.5K' | '1K' | '2K' | '4K';

export type ModelId =
  | 'gemini-3.1-flash-image-preview'
  | 'gemini-3-pro-image-preview'
  | 'zhipu-nanobanana-2'
  | 'zhipu-nanobanana-pro';

export type ProviderName = 'newapi' | 'zhipu-router' | 'zhipu-paas';

export interface GenerateRequest {
  image: string;
  mimeType: string;
  image2?: string | null;
  mimeType2?: string | null;
  prompt: string;
  model: ModelId;
  ratio?: Ratio;
  quality?: Quality;
}

export interface GenerateResponse {
  image: string;
  mimeType: string;
}

export interface GenerateError {
  error: string;
  status: number;
}

export type GenerateResult =
  | { ok: true; response: GenerateResponse }
  | { ok: false; error: GenerateError };
