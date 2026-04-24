import type { GenerateRequest, GenerateResult, ModelId } from './types';
import { MODEL_REGISTRY, ALL_QUALITIES } from './model-registry';
import { dispatch } from './providers/index';

export function validate(body: unknown): GenerateRequest | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'body must be a JSON object' };
  }
  const b = body as Record<string, unknown>;

  const required = ['image', 'mimeType', 'prompt', 'model'] as const;
  for (const f of required) {
    if (typeof b[f] !== 'string' || (b[f] as string).length === 0) {
      return { error: `${f} is required` };
    }
  }

  if (!((b.model as string) in MODEL_REGISTRY)) {
    return {
      error: `model must be one of: ${Object.keys(MODEL_REGISTRY).join(', ')}`,
    };
  }

  if (b.ratio != null && typeof b.ratio !== 'string') {
    return { error: 'ratio must be a string' };
  }
  if (b.quality != null) {
    if (
      typeof b.quality !== 'string' ||
      !(ALL_QUALITIES as readonly string[]).includes(b.quality)
    ) {
      return { error: `quality must be one of: ${ALL_QUALITIES.join(', ')}` };
    }
  }
  if (b.image2 != null && typeof b.image2 !== 'string') {
    return { error: 'image2 must be a string' };
  }

  return {
    image: b.image as string,
    mimeType: b.mimeType as string,
    image2: (b.image2 as string | null) ?? null,
    mimeType2: (b.mimeType2 as string | null) ?? null,
    prompt: b.prompt as string,
    model: b.model as ModelId,
    ratio: b.ratio as GenerateRequest['ratio'],
    quality: b.quality as GenerateRequest['quality'],
  };
}

export async function handle(
  body: unknown,
  signal?: AbortSignal
): Promise<GenerateResult> {
  const v = validate(body);
  if ('error' in v) {
    return { ok: false, error: { error: v.error, status: 400 } };
  }
  return dispatch(v, signal);
}
