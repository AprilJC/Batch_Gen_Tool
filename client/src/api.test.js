import { generateImage } from './api';

beforeEach(() => {
  global.fetch = vi.fn();
});

test('sends correct request to /api/generate', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ image: 'data:image/png;base64,out', mimeType: 'image/png' }),
  });

  const result = await generateImage({
    image: 'data:image/jpeg;base64,in',
    mimeType: 'image/jpeg',
    prompt: 'watercolor',
    model: 'gemini-3.1-flash-image-preview',
  });

  expect(fetch).toHaveBeenCalledWith('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: 'data:image/jpeg;base64,in',
      mimeType: 'image/jpeg',
      prompt: 'watercolor',
      model: 'gemini-3.1-flash-image-preview',
    }),
  });
  expect(result).toEqual({ image: 'data:image/png;base64,out', mimeType: 'image/png' });
});

test('throws with server error message on non-ok response', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Generation failed' }),
  });

  await expect(
    generateImage({ image: 'data:image/jpeg;base64,in', mimeType: 'image/jpeg', prompt: 'test', model: 'gemini-3.1-flash-image-preview' })
  ).rejects.toThrow('Generation failed');
});
