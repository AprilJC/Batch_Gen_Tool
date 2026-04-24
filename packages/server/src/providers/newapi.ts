import type { GenerateRequest, GenerateResult } from '../types';
import type { ModelSpec } from '../model-registry';
import { wrapAsDataUrl } from '../util/base64';

export async function callNewApi(
  req: GenerateRequest,
  spec: ModelSpec,
  signal?: AbortSignal
): Promise<GenerateResult> {
  const apiKey = process.env.NEWAPI_KEY;
  if (!apiKey) {
    return { ok: false, error: { error: 'NEWAPI_KEY not configured', status: 500 } };
  }
  const baseUrl = process.env.NEWAPI_URL ?? 'https://ia.router.zoombo.ai/v1';

  const content: unknown[] = [
    { type: 'text', text: req.prompt },
    { type: 'image_url', image_url: { url: req.image } },
  ];
  if (req.image2) {
    content.push({ type: 'image_url', image_url: { url: req.image2 } });
  }

  const body: Record<string, unknown> = {
    model: spec.upstreamModel,
    messages: [{ role: 'user', content }],
    modalities: ['image', 'text'],
  };
  if (req.ratio) body.ratio = req.ratio;
  if (req.quality) body.quality = req.quality;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: signal ?? AbortSignal.timeout(Number(process.env.UPSTREAM_TIMEOUT_MS ?? 120000)),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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

    const choices = (data as Record<string, unknown>)?.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      return { ok: false, error: { error: 'No choices in response', status: 500 } };
    }
    const message = (choices[0] as Record<string, unknown>)?.message;
    const content2 = (message as Record<string, unknown>)?.content;

    let imageUrl: string | null = null;

    if (Array.isArray(content2)) {
      const imgPart = content2.find(
        (p: unknown) => (p as Record<string, unknown>)?.type === 'image_url'
      ) as Record<string, unknown> | undefined;
      imageUrl = (imgPart?.image_url as Record<string, string>)?.url ?? null;
    } else if (typeof content2 === 'string') {
      const mdMatch = content2.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
      if (mdMatch && mdMatch[1]) {
        imageUrl = mdMatch[1];
      } else if (content2.startsWith('data:image/')) {
        imageUrl = content2;
      }
    }

    if (!imageUrl) {
      return { ok: false, error: { error: 'No image in response', status: 500 } };
    }

    const result = wrapAsDataUrl(imageUrl);
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
