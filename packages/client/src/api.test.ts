import { generateImage } from './api';
import type { GenerateImageRequest } from './api';

beforeEach(() => {
  global.fetch = vi.fn() as unknown as typeof fetch;
});

const mockFetch = () => global.fetch as ReturnType<typeof vi.fn>;

test('sends correct request to /api/generate', async () => {
  mockFetch().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ image: 'data:image/png;base64,out', mimeType: 'image/png' }),
  });

  const req: GenerateImageRequest = {
    image: 'data:image/jpeg;base64,in',
    mimeType: 'image/jpeg',
    prompt: 'watercolor',
    model: 'gemini-3.1-flash-image-preview',
  };
  const result = await generateImage(req);

  expect(global.fetch).toHaveBeenCalledWith('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  expect(result).toEqual({ image: 'data:image/png;base64,out', mimeType: 'image/png' });
});

test('throws with server error message on non-ok response', async () => {
  mockFetch().mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Generation failed' }),
  });

  await expect(
    generateImage({ image: 'data:image/jpeg;base64,in', mimeType: 'image/jpeg', prompt: 'test', model: 'gemini-3.1-flash-image-preview' })
  ).rejects.toThrow('Generation failed');
});

test('includes ratio and quality when provided', async () => {
  mockFetch().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ image: 'data:image/png;base64,out', mimeType: 'image/png' }),
  });

  await generateImage({
    image: 'data:image/jpeg;base64,in',
    mimeType: 'image/jpeg',
    prompt: 'test',
    model: 'gemini-3.1-flash-image-preview',
    ratio: '16:9',
    quality: '2K',
  });

  const body = JSON.parse(mockFetch().mock.calls[0]?.[1]?.body as string) as Record<string, unknown>;
  expect(body.ratio).toBe('16:9');
  expect(body.quality).toBe('2K');
});
