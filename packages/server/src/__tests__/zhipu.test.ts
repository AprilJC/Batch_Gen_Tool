import { callZhipu } from '../providers/zhipu';
import type { GenerateRequest } from '../types';
import { MODEL_REGISTRY } from '../model-registry';

const routerSpec = MODEL_REGISTRY['zhipu-nanobanana-2'];
const paasSpec = MODEL_REGISTRY['zhipu-nanobanana-pro'];

const makeReq = (overrides: Partial<GenerateRequest> = {}): GenerateRequest => ({
  image: 'data:image/jpeg;base64,SU5QVVQ=',
  mimeType: 'image/jpeg',
  prompt: 'turn it into watercolor',
  model: 'zhipu-nanobanana-2',
  ...overrides,
});

function mockUpstreamJson(status: number, payload: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
    headers: new Map(),
  } as unknown as Response;
}

function mockUpstreamRaw(status: number, text: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    headers: new Map(),
  } as unknown as Response;
}

function mockBinary(bytes: Uint8Array, contentType = 'image/png'): Response {
  return {
    ok: true,
    status: 200,
    blob: async () => ({ arrayBuffer: async () => bytes.buffer }),
    headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? contentType : null) },
  } as unknown as Response;
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ZHIPU_ROUTER_KEY;
  delete process.env.ZHIPU_PAAS_KEY;
  delete process.env.ZHIPU_API_KEY;
  delete process.env.ZHIPU_ROUTER_URL;
  delete process.env.ZHIPU_PAAS_URL;
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn();
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('callZhipu', () => {
  it('router variant: bare jpeg base64 response wraps into jpeg data URL', async () => {
    process.env.ZHIPU_ROUTER_KEY = 'router-key';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(200, { data: [{ url: '/9j/abc123' }] })
    );

    const result = await callZhipu(makeReq(), routerSpec, { variant: 'router' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.mimeType).toBe('image/jpeg');
    expect(result.response.image).toBe('data:image/jpeg;base64,/9j/abc123');
  });

  it('paas variant: bare png base64 response wraps into png data URL', async () => {
    process.env.ZHIPU_PAAS_KEY = 'paas-key';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(200, { data: [{ url: 'iVBORw0KGgo' }] })
    );

    const result = await callZhipu(
      makeReq({ model: 'zhipu-nanobanana-pro' }),
      paasSpec,
      { variant: 'paas' }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.mimeType).toBe('image/png');
    expect(result.response.image).toBe('data:image/png;base64,iVBORw0KGgo');
  });

  it('paas variant: http URL response is downloaded and converted to data URL', async () => {
    process.env.ZHIPU_PAAS_KEY = 'paas-key';
    const remoteUrl = 'https://cdn.example.com/abc.png';
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockUpstreamJson(200, { data: [{ url: remoteUrl }] }))
      .mockResolvedValueOnce(mockBinary(new Uint8Array([1, 2, 3, 4]), 'image/png'));

    const result = await callZhipu(
      makeReq({ model: 'zhipu-nanobanana-pro' }),
      paasSpec,
      { variant: 'paas' }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.mimeType).toBe('image/png');
    const expectedB64 = Buffer.from([1, 2, 3, 4]).toString('base64');
    expect(result.response.image).toBe(`data:image/png;base64,${expectedB64}`);
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe(remoteUrl);
  });

  it('paas dual image request sends images as array of strings', async () => {
    process.env.ZHIPU_PAAS_KEY = 'paas-key';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(200, { data: [{ url: 'iVBORxx' }] })
    );

    await callZhipu(
      makeReq({
        model: 'zhipu-nanobanana-pro',
        image: 'data:image/jpeg;base64,AAA',
        image2: 'data:image/png;base64,BBB',
      }),
      paasSpec,
      { variant: 'paas' }
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.images).toEqual(['AAA', 'BBB']);
  });

  it('router dual image request sends images as array of {url} objects', async () => {
    process.env.ZHIPU_ROUTER_KEY = 'router-key';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(200, { data: [{ url: '/9j/xx' }] })
    );

    await callZhipu(
      makeReq({
        image: 'data:image/jpeg;base64,AAA',
        image2: 'data:image/png;base64,BBB',
      }),
      routerSpec,
      { variant: 'router' }
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.images).toEqual([{ url: 'AAA' }, { url: 'BBB' }]);
  });

  it('strips data-URL prefix on outbound images', async () => {
    process.env.ZHIPU_PAAS_KEY = 'paas-key';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(200, { data: [{ url: 'iVBORxx' }] })
    );

    await callZhipu(
      makeReq({
        model: 'zhipu-nanobanana-pro',
        image: 'data:image/jpeg;base64,RAW_BYTES',
      }),
      paasSpec,
      { variant: 'paas' }
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.images).toEqual(['RAW_BYTES']);
    expect(JSON.stringify(body)).not.toContain('data:');
  });

  it('router auth header uses Bearer prefix', async () => {
    process.env.ZHIPU_ROUTER_KEY = 'rkey';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(200, { data: [{ url: '/9j/x' }] })
    );

    await callZhipu(makeReq(), routerSpec, { variant: 'router' });

    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer rkey');
  });

  it('paas auth header uses raw key without Bearer', async () => {
    process.env.ZHIPU_PAAS_KEY = 'pkey';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(200, { data: [{ url: 'iVBORxx' }] })
    );

    await callZhipu(
      makeReq({ model: 'zhipu-nanobanana-pro' }),
      paasSpec,
      { variant: 'paas' }
    );

    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('pkey');
  });

  it('missing key returns 500 without calling fetch', async () => {
    const result = await callZhipu(makeReq(), routerSpec, { variant: 'router' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.status).toBe(500);
    expect(result.error.error).toContain('ZHIPU_ROUTER_KEY');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('401 upstream passes through status and message', async () => {
    process.env.ZHIPU_ROUTER_KEY = 'rkey';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(401, { error: { message: 'Invalid API key' } })
    );

    const result = await callZhipu(makeReq(), routerSpec, { variant: 'router' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.status).toBe(401);
    expect(result.error.error).toBe('Invalid API key');
  });

  it('non-JSON upstream response returns 500 with truncated body', async () => {
    process.env.ZHIPU_ROUTER_KEY = 'rkey';
    const longText = 'a'.repeat(500);
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockUpstreamRaw(502, longText));

    const result = await callZhipu(makeReq(), routerSpec, { variant: 'router' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.status).toBe(500);
    expect(result.error.error).toContain('Upstream error (502)');
    expect(result.error.error.length).toBeLessThan(longText.length + 100);
    expect(result.error.error).toContain('a'.repeat(300));
    expect(result.error.error).not.toContain('a'.repeat(301));
  });

  it('falls back to ZHIPU_API_KEY when variant-specific key is missing', async () => {
    process.env.ZHIPU_API_KEY = 'shared-key';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(200, { data: [{ url: '/9j/ok' }] })
    );

    const result = await callZhipu(makeReq(), routerSpec, { variant: 'router' });

    expect(result.ok).toBe(true);
    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer shared-key');
  });

  it('empty data array returns "No image in response"', async () => {
    process.env.ZHIPU_ROUTER_KEY = 'rkey';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockUpstreamJson(200, { data: [] })
    );

    const result = await callZhipu(makeReq(), routerSpec, { variant: 'router' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.status).toBe(500);
    expect(result.error.error).toBe('No image in response');
  });
});
