import type { GenerateRequest, GenerateResult } from '../types';
import type { ModelSpec } from '../model-registry';
import { stripDataUrlPrefix, wrapAsDataUrl } from '../util/base64';

export interface ZhipuOptions {
  variant: 'router' | 'paas';
}

export async function callZhipu(
  req: GenerateRequest,
  spec: ModelSpec,
  options: ZhipuOptions,
  signal?: AbortSignal
): Promise<GenerateResult> {
  const { variant } = options;

  const baseUrl =
    variant === 'router'
      ? (process.env.ZHIPU_ROUTER_URL ?? 'https://router.z.ai/api/v1')
      : (process.env.ZHIPU_PAAS_URL ?? 'https://api.z.ai/api/paas/v4');

  const keyEnv = variant === 'router' ? 'ZHIPU_ROUTER_KEY' : 'ZHIPU_PAAS_KEY';
  const apiKey = process.env[keyEnv] ?? process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: { error: `${keyEnv} or ZHIPU_API_KEY not configured`, status: 500 },
    };
  }

  const images = [req.image, req.image2]
    .filter((img): img is string => typeof img === 'string' && img.length > 0)
    .map(stripDataUrlPrefix);

  const body: Record<string, unknown> = {
    model: spec.upstreamModel,
    prompt: req.prompt,
  };
  if (images.length > 0) {
    body.images = variant === 'router' ? images.map((url) => ({ url })) : images;
  }
  if (req.ratio) body.ratio = req.ratio;
  if (req.quality) body.quality = req.quality;

  try {
    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      signal: signal ?? AbortSignal.timeout(Number(process.env.UPSTREAM_TIMEOUT_MS ?? 120000)),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': variant === 'router' ? `Bearer ${apiKey}` : apiKey,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      return {
        ok: false,
        error: {
          error: `Upstream error (${response.status}): ${responseText.slice(0, 300)}`,
          status: 500,
        },
      };
    }

    if (!response.ok) {
      const err = (data as Record<string, unknown>)?.error;
      return {
        ok: false,
        error: {
          error: (typeof err === 'object' && err && 'message' in err)
            ? String(err.message)
            : 'Generation failed',
          status: response.status,
        },
      };
    }

    const dataArr = (data as Record<string, unknown>)?.data;
    if (!Array.isArray(dataArr) || dataArr.length === 0) {
      return { ok: false, error: { error: 'No image in response', status: 500 } };
    }

    const url = (dataArr[0] as Record<string, unknown>)?.url;
    if (typeof url !== 'string') {
      return { ok: false, error: { error: 'No image in response', status: 500 } };
    }

    if (url.startsWith('http')) {
      try {
        const imgResp = await fetch(url, {
          signal: signal ?? AbortSignal.timeout(30000),
        });
        const blob = await imgResp.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mime = imgResp.headers.get('content-type') ?? 'image/png';
        return {
          ok: true,
          response: {
            image: `data:${mime};base64,${base64}`,
            mimeType: mime,
          },
        };
      } catch {
        return { ok: false, error: { error: 'Failed to download image', status: 500 } };
      }
    }

    const result = wrapAsDataUrl(url);
    return { ok: true, response: result };
  } catch (err) {
    return {
      ok: false,
      error: {
        error: err instanceof Error ? err.message : 'Generation failed',
        status: 500,
      },
    };
  }
}
