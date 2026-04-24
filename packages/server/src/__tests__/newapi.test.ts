import request from 'supertest';
import { app } from '../index';

beforeEach(() => {
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn();
  process.env.NEWAPI_KEY = 'test-key';
  process.env.NEWAPI_URL = 'https://test.example.com/v1';
});

describe('POST /api/generate', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ prompt: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('image is required');
  });

  it('returns generated image on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
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
      .send({
        image: 'data:image/jpeg;base64,inputdata',
        mimeType: 'image/jpeg',
        prompt: 'watercolor',
        model: 'gemini-3.1-flash-image-preview',
      });

    expect(res.status).toBe(200);
    expect(res.body.image).toBe('data:image/png;base64,base64output');
    expect(res.body.mimeType).toBe('image/png');
  });

  it('returns 500 when response contains no image', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        choices: [{ message: { content: [{ type: 'text', text: 'no image here' }] } }],
      }),
    });

    const res = await request(app)
      .post('/api/generate')
      .send({
        image: 'data:image/jpeg;base64,abc',
        mimeType: 'image/jpeg',
        prompt: 'test',
        model: 'gemini-3.1-flash-image-preview',
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('No image in response');
  });

  it('forwards API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: { message: 'Invalid API key' } }),
    });

    const res = await request(app)
      .post('/api/generate')
      .send({
        image: 'data:image/jpeg;base64,abc',
        mimeType: 'image/jpeg',
        prompt: 'test',
        model: 'gemini-3.1-flash-image-preview',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid API key');
  });

  it('returns 400 for unknown models', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ image: 'data:image/jpeg;base64,abc', mimeType: 'image/jpeg', prompt: 'test', model: 'unknown-model' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/model must be one of/);
  });
});
