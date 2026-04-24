import type { ModelId, Ratio, Quality } from './types';

export interface GenerateImageRequest {
  image: string;
  mimeType: string;
  image2?: string | null;
  mimeType2?: string | null;
  prompt: string;
  model: ModelId;
  ratio?: Ratio;
  quality?: Quality;
}

export interface GenerateImageResponse {
  image: string;
  mimeType: string;
}

export async function generateImage(req: GenerateImageRequest): Promise<GenerateImageResponse> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const data = await response.json() as unknown;
  if (!response.ok) {
    const errMsg =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : 'Generation failed';
    throw new Error(errMsg);
  }
  return data as GenerateImageResponse;
}
