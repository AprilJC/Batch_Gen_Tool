import { handle } from '../handler';

const VALID_PNG = 'data:image/png;base64,iVBORw0KGgo=';

beforeEach(() => {
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn();
  process.env.NEWAPI_KEY = 'test-key';
  process.env.NEWAPI_URL = 'https://test.newapi.example.com/v1';
  process.env.ZHIPU_API_KEY = 'zhipu-key';
  delete process.env.ZHIPU_ROUTER_KEY;
  delete process.env.ZHIPU_PAAS_KEY;
});

const mockFetchOk = (body: unknown) =>
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  });

// --- Validation ---

it('rejects missing image with 400', async () => {
  const r = await handle({ mimeType: 'image/png', prompt: 'x', model: 'gemini-3.1-flash-image-preview' });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.status).toBe(400);
});

it('rejects unknown model with 400', async () => {
  const r = await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'bad-model' });
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.status).toBe(400);
    expect(r.error.error).toMatch(/model must be one of/);
  }
});

it('rejects invalid ratio for Pro with 400', async () => {
  const r = await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'zhipu-nanobanana-pro', ratio: '1:4' });
  expect(r.ok).toBe(false);
  if (!r.ok) {
    expect(r.error.status).toBe(400);
    expect(r.error.error).toMatch(/ratio.*not supported/i);
  }
});

it('rejects invalid quality with 400', async () => {
  const r = await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'gemini-3.1-flash-image-preview', quality: 'ultra' });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.status).toBe(400);
});

// --- Routing ---

it('routes gemini-3.1-flash to NewAPI URL', async () => {
  mockFetchOk({ choices: [{ message: { content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,OUT' } }] } }] });
  await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'gemini-3.1-flash-image-preview' });
  const url = (global.fetch as jest.Mock).mock.calls[0]?.[0] as string;
  expect(url).toContain('test.newapi.example.com');
});

it('routes gemini-3-pro to NewAPI URL', async () => {
  mockFetchOk({ choices: [{ message: { content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,OUT' } }] } }] });
  await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'gemini-3-pro-image-preview' });
  const url = (global.fetch as jest.Mock).mock.calls[0]?.[0] as string;
  expect(url).toContain('test.newapi.example.com');
});

it('routes zhipu-nanobanana-2 to router.z.ai', async () => {
  mockFetchOk({ data: [{ url: '/9j/abc' }] });
  await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'zhipu-nanobanana-2' });
  const url = (global.fetch as jest.Mock).mock.calls[0]?.[0] as string;
  expect(url).toContain('router.z.ai');
});

it('routes zhipu-nanobanana-pro to api.z.ai/paas', async () => {
  mockFetchOk({ data: [{ url: 'iVBORabc' }] });
  await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'zhipu-nanobanana-pro' });
  const url = (global.fetch as jest.Mock).mock.calls[0]?.[0] as string;
  expect(url).toContain('api.z.ai');
});

// --- ratio/quality passthrough ---

it('passes ratio and quality to NewAPI body', async () => {
  mockFetchOk({ choices: [{ message: { content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,OUT' } }] } }] });
  await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'gemini-3.1-flash-image-preview', ratio: '16:9', quality: '2K' });
  const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0]?.[1]?.body as string) as Record<string, unknown>;
  expect(body.ratio).toBe('16:9');
  expect(body.quality).toBe('2K');
});

it('passes ratio and quality to Zhipu body', async () => {
  mockFetchOk({ data: [{ url: '/9j/abc' }] });
  await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'zhipu-nanobanana-2', ratio: '16:9', quality: '2K' });
  const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0]?.[1]?.body as string) as Record<string, unknown>;
  expect(body.ratio).toBe('16:9');
  expect(body.quality).toBe('2K');
});

// --- Missing key guards ---

it('returns 500 for zhipu models when no key set', async () => {
  delete process.env.ZHIPU_API_KEY;
  const r = await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'zhipu-nanobanana-2' });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.status).toBe(500);
  expect(global.fetch).not.toHaveBeenCalled();
});

it('returns 500 for newapi models when no key set', async () => {
  delete process.env.NEWAPI_KEY;
  const r = await handle({ image: VALID_PNG, mimeType: 'image/png', prompt: 'x', model: 'gemini-3.1-flash-image-preview' });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.status).toBe(500);
  expect(global.fetch).not.toHaveBeenCalled();
});
