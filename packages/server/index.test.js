const request = require('supertest');

global.fetch = jest.fn();

const app = require('./index');

beforeEach(() => {
  fetch.mockClear();
  process.env.NEWAPI_KEY = 'test-key';
  process.env.NEWAPI_URL = 'https://test.example.com/v1';
});

describe('POST /api/generate', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ prompt: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('image, mimeType, and prompt are required');
  });

  it('returns generated image on success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: [
              { type: 'image_url', image_url: { url: 'data:image/png;base64,base64output' } },
            ],
          },
        }],
      }),
    });

    const res = await request(app)
      .post('/api/generate')
      .send({ image: 'data:image/jpeg;base64,inputdata', mimeType: 'image/jpeg', prompt: 'watercolor' });

    expect(res.status).toBe(200);
    expect(res.body.image).toBe('data:image/png;base64,base64output');
    expect(res.body.mimeType).toBe('image/png');
  });

  it('returns 500 when response contains no image', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: [{ type: 'text', text: 'no image here' }] } }],
      }),
    });

    const res = await request(app)
      .post('/api/generate')
      .send({ image: 'data:image/jpeg;base64,abc', mimeType: 'image/jpeg', prompt: 'test' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('No image in response');
  });

  it('forwards API errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } }),
    });

    const res = await request(app)
      .post('/api/generate')
      .send({ image: 'data:image/jpeg;base64,abc', mimeType: 'image/jpeg', prompt: 'test' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid API key');
  });

  it('defaults to gemini-3.1-flash-image-preview for unknown models', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,out' } }],
          },
        }],
      }),
    });

    await request(app)
      .post('/api/generate')
      .send({ image: 'data:image/jpeg;base64,abc', mimeType: 'image/jpeg', prompt: 'test', model: 'unknown-model' });

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.model).toBe('gemini-3.1-flash-image-preview');
  });
});
