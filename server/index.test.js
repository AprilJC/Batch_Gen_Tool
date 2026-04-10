const request = require('supertest');

jest.mock('@google/generative-ai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = require('./index');

describe('POST /api/generate', () => {
  it('returns 400 when x-api-key header is missing', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ image: 'data:image/jpeg;base64,abc', mimeType: 'image/jpeg', prompt: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('API key required');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/generate')
      .set('x-api-key', 'key')
      .send({ prompt: 'test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('image, mimeType, and prompt are required');
  });

  it('returns generated image on success', async () => {
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: async () => ({
          response: {
            candidates: [{
              content: {
                parts: [{ inlineData: { mimeType: 'image/png', data: 'base64output' } }],
              },
            }],
          },
        }),
      }),
    }));

    const res = await request(app)
      .post('/api/generate')
      .set('x-api-key', 'test-key')
      .send({ image: 'data:image/jpeg;base64,inputdata', mimeType: 'image/jpeg', prompt: 'watercolor' });

    expect(res.status).toBe(200);
    expect(res.body.image).toBe('data:image/png;base64,base64output');
    expect(res.body.mimeType).toBe('image/png');
  });

  it('returns 500 when Gemini returns no image part', async () => {
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: async () => ({
          response: {
            candidates: [{ content: { parts: [{ text: 'no image here' }] } }],
          },
        }),
      }),
    }));

    const res = await request(app)
      .post('/api/generate')
      .set('x-api-key', 'key')
      .send({ image: 'data:image/jpeg;base64,abc', mimeType: 'image/jpeg', prompt: 'test' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('No image in Gemini response');
  });

  it('forwards Gemini API errors', async () => {
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: async () => {
          const err = new Error('Invalid API key');
          err.status = 401;
          throw err;
        },
      }),
    }));

    const res = await request(app)
      .post('/api/generate')
      .set('x-api-key', 'bad-key')
      .send({ image: 'data:image/jpeg;base64,abc', mimeType: 'image/jpeg', prompt: 'test' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid API key');
  });
});
