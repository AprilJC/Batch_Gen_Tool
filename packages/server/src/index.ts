import express, { type Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { handle } from './handler';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const app: Express = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/generate', async (req, res) => {
  const result = await handle(req.body);
  if (result.ok) {
    res.json(result.response);
  } else {
    res.status(result.error.status).json({ error: result.error.error });
  }
});

const PORT = Number(process.env.PORT ?? 3001);
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
