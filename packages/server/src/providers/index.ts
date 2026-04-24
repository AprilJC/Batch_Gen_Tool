import type { GenerateRequest, GenerateResult } from '../types';
import { MODEL_REGISTRY } from '../model-registry';
import { callNewApi } from './newapi';
import { callZhipu } from './zhipu';

export async function dispatch(
  req: GenerateRequest,
  signal?: AbortSignal
): Promise<GenerateResult> {
  const spec = MODEL_REGISTRY[req.model];
  if (!spec) {
    return { ok: false, error: { error: `Unknown model: ${req.model}`, status: 400 } };
  }

  if (req.ratio && !spec.ratios.includes(req.ratio)) {
    return {
      ok: false,
      error: {
        error: `ratio "${req.ratio}" not supported for model ${req.model}`,
        status: 400,
      },
    };
  }

  switch (spec.provider) {
    case 'newapi':
      return callNewApi(req, spec, signal);
    case 'zhipu-router':
      return callZhipu(req, spec, { variant: 'router' }, signal);
    case 'zhipu-paas':
      return callZhipu(req, spec, { variant: 'paas' }, signal);
  }
}
