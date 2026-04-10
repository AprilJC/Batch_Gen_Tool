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
    apiKey: 'my-key',
  });

  expect(fetch).toHaveBeenCalledWith('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'my-key',
    },
    body: JSON.stringify({
      image: 'data:image/jpeg;base64,in',
      mimeType: 'image/jpeg',
      prompt: 'watercolor',
    }),
  });
  expect(result).toEqual({ image: 'data:image/png;base64,out', mimeType: 'image/png' });
});

test('throws with server error message on non-ok response', async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Invalid API key' }),
  });

  await expect(
    generateImage({ image: 'data:image/jpeg;base64,in', mimeType: 'image/jpeg', prompt: 'test', apiKey: 'bad' })
  ).rejects.toThrow('Invalid API key');
});
