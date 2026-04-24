import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handle } from '@batch-gen/server/handler';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const result = await handle(req.body);
  if (result.ok) res.json(result.response);
  else res.status(result.error.status).json({ error: result.error.error });
}
