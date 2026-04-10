# Batch Image Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React frontend + Express backend web tool that batch-edits up to 10 images using the Gemini API with a single user-supplied prompt.

**Architecture:** Express backend proxies calls to the Gemini API (keeping the API key out of responses and avoiding CORS). The React frontend reads images from a local folder, sends them sequentially to `/api/generate`, and displays live per-card status. All file I/O is in-memory (base64); JSZip handles batch download entirely client-side.

**Tech Stack:** Node.js 18+, Express 4, `@google/generative-ai`, Vite 5, React 18, Vitest, @testing-library/react, supertest, Jest, JSZip, concurrently

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Root: `concurrently` dev script |
| `server/package.json` | Server deps (express, @google/generative-ai, cors, jest, supertest) |
| `server/index.js` | Express app + `POST /api/generate` endpoint |
| `server/index.test.js` | Jest + supertest tests for the endpoint |
| `client/package.json` | Client deps (react, vite, jszip, vitest, @testing-library/*) |
| `client/vite.config.js` | Vite config: React plugin, `/api` proxy to :3001, vitest jsdom |
| `client/index.html` | HTML shell |
| `client/src/main.jsx` | React entry point |
| `client/src/test-setup.js` | `@testing-library/jest-dom` import |
| `client/src/api.js` | `generateImage()` fetch wrapper |
| `client/src/api.test.js` | Vitest tests for api.js |
| `client/src/App.jsx` | Root state, upload handler, generation loop, download handler |
| `client/src/App.css` | Dark theme styles |
| `client/src/ConfigPanel.jsx` | API key input, prompt textarea, Generate All + Download All buttons |
| `client/src/ConfigPanel.test.jsx` | Vitest + RTL tests for ConfigPanel |
| `client/src/ImageGrid.jsx` | Responsive CSS grid of ImageCard components |
| `client/src/ImageCard.jsx` | Per-image card: input, status, output, Regenerate, Download |
| `client/src/ImageCard.test.jsx` | Vitest + RTL tests for ImageCard |

---

## Task 1: Scaffold project structure

**Files:**
- Create: `package.json`
- Create: `server/package.json`
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/src/main.jsx`
- Create: `client/src/test-setup.js`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "batch-image-tool",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm --prefix server start\" \"npm --prefix client run dev\""
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: Create `server/package.json`**

```json
{
  "name": "batch-image-server",
  "scripts": {
    "start": "node index.js",
    "test": "jest --forceExit"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

- [ ] **Step 3: Create `client/package.json`**

```json
{
  "name": "batch-image-client",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "jszip": "^3.10.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^15.0.7",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.0.0",
    "vite": "^5.3.4",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 4: Create `client/vite.config.js`**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
});
```

- [ ] **Step 5: Create `client/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Batch Image Generator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `client/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 7: Create `client/src/test-setup.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 8: Create `.gitignore`**

```
node_modules/
dist/
.env
.superpowers/
```

- [ ] **Step 9: Install dependencies (run from project root)**

```bash
npm install && npm --prefix server install && npm --prefix client install
```

Expected: no errors, `node_modules` created in root, `server/`, and `client/`.

- [ ] **Step 10: Commit**

```bash
git init
git add package.json .gitignore server/package.json client/package.json client/vite.config.js client/index.html client/src/main.jsx client/src/test-setup.js
git commit -m "chore: scaffold project structure"
```

---

## Task 2: Express server — `POST /api/generate`

**Files:**
- Create: `server/index.test.js`
- Create: `server/index.js`

- [ ] **Step 1: Write failing tests in `server/index.test.js`**

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npm test
```

Expected: all 5 tests fail with `Cannot find module './index'`

- [ ] **Step 3: Implement `server/index.js`**

```js
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/generate', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'API key required' });
  }

  const { image, mimeType, prompt } = req.body;
  if (!image || !mimeType || !prompt) {
    return res.status(400).json({ error: 'image, mimeType, and prompt are required' });
  }

  // Strip "data:image/jpeg;base64," prefix to get raw base64
  const base64Data = image.replace(/^data:[^;]+;base64,/, '');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-image-preview',
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Data } },
    ]);

    const parts = result.response.candidates[0].content.parts;
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      return res.status(500).json({ error: 'No image in Gemini response' });
    }

    res.json({
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      mimeType: imagePart.inlineData.mimeType,
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Generation failed' });
  }
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npm test
```

Expected: 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/index.js server/index.test.js
git commit -m "feat: add Express server with POST /api/generate"
```

---

## Task 3: Client — `api.js` fetch wrapper

**Files:**
- Create: `client/src/api.test.js`
- Create: `client/src/api.js`

- [ ] **Step 1: Write failing tests in `client/src/api.test.js`**

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd client && npm test
```

Expected: 2 tests fail with `Cannot find module './api'`

- [ ] **Step 3: Implement `client/src/api.js`**

```js
export async function generateImage({ image, mimeType, prompt, apiKey }) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ image, mimeType, prompt }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Generation failed');
  }
  return data;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd client && npm test
```

Expected: 2 tests pass

- [ ] **Step 5: Commit**

```bash
git add client/src/api.js client/src/api.test.js
git commit -m "feat: add generateImage API wrapper"
```

---

## Task 4: `ConfigPanel` component

**Files:**
- Create: `client/src/ConfigPanel.test.jsx`
- Create: `client/src/ConfigPanel.jsx`

- [ ] **Step 1: Write failing tests in `client/src/ConfigPanel.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigPanel from './ConfigPanel';

const baseProps = {
  apiKey: 'mykey',
  prompt: 'watercolor',
  images: [{ status: 'idle' }],
  isGenerating: false,
  onApiKeyChange: vi.fn(),
  onPromptChange: vi.fn(),
  onGenerateAll: vi.fn(),
  onDownloadAll: vi.fn(),
};

test('Generate All is enabled when all conditions are met', () => {
  render(<ConfigPanel {...baseProps} />);
  expect(screen.getByRole('button', { name: /generate all/i })).not.toBeDisabled();
});

test('Generate All is disabled when apiKey is empty', () => {
  render(<ConfigPanel {...baseProps} apiKey="" />);
  expect(screen.getByRole('button', { name: /generate all/i })).toBeDisabled();
});

test('Generate All is disabled when prompt is empty', () => {
  render(<ConfigPanel {...baseProps} prompt="" />);
  expect(screen.getByRole('button', { name: /generate all/i })).toBeDisabled();
});

test('Generate All is disabled when images array is empty', () => {
  render(<ConfigPanel {...baseProps} images={[]} />);
  expect(screen.getByRole('button', { name: /generate all/i })).toBeDisabled();
});

test('Generate All is disabled when isGenerating is true', () => {
  render(<ConfigPanel {...baseProps} isGenerating={true} />);
  expect(screen.getByRole('button', { name: /generate all/i })).toBeDisabled();
});

test('Download All is disabled when no images are done', () => {
  render(<ConfigPanel {...baseProps} images={[{ status: 'idle' }]} />);
  expect(screen.getByRole('button', { name: /download all/i })).toBeDisabled();
});

test('Download All is enabled when at least one image is done', () => {
  render(<ConfigPanel {...baseProps} images={[{ status: 'done' }]} />);
  expect(screen.getByRole('button', { name: /download all/i })).not.toBeDisabled();
});

test('calls onApiKeyChange when API key input changes', async () => {
  const onApiKeyChange = vi.fn();
  render(<ConfigPanel {...baseProps} onApiKeyChange={onApiKeyChange} />);
  await userEvent.clear(screen.getByPlaceholderText(/api key/i));
  await userEvent.type(screen.getByPlaceholderText(/api key/i), 'x');
  expect(onApiKeyChange).toHaveBeenCalled();
});

test('calls onGenerateAll when Generate All is clicked', async () => {
  const onGenerateAll = vi.fn();
  render(<ConfigPanel {...baseProps} onGenerateAll={onGenerateAll} />);
  await userEvent.click(screen.getByRole('button', { name: /generate all/i }));
  expect(onGenerateAll).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd client && npm test
```

Expected: 9 tests fail with `Cannot find module './ConfigPanel'`

- [ ] **Step 3: Implement `client/src/ConfigPanel.jsx`**

```jsx
export default function ConfigPanel({
  apiKey, prompt, images, isGenerating,
  onApiKeyChange, onPromptChange, onGenerateAll, onDownloadAll,
}) {
  const hasDone = images.some((img) => img.status === 'done');
  const canGenerate = !!apiKey && !!prompt && images.length > 0 && !isGenerating;

  return (
    <div className="config-panel">
      <div className="config-field">
        <label className="config-label">GOOGLE API KEY</label>
        <input
          type="password"
          className="config-input"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
        />
      </div>
      <div className="config-field config-field--grow">
        <label className="config-label">PROMPT</label>
        <textarea
          className="config-input config-textarea"
          placeholder="Describe how to transform the images..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={2}
        />
      </div>
      <div className="config-actions">
        <button
          className="btn btn--primary"
          onClick={onGenerateAll}
          disabled={!canGenerate}
        >
          ⚡ Generate All
        </button>
        <button
          className="btn btn--secondary"
          onClick={onDownloadAll}
          disabled={!hasDone}
        >
          ⬇ Download All
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd client && npm test
```

Expected: all ConfigPanel tests pass

- [ ] **Step 5: Commit**

```bash
git add client/src/ConfigPanel.jsx client/src/ConfigPanel.test.jsx
git commit -m "feat: add ConfigPanel component"
```

---

## Task 5: `ImageCard` component

**Files:**
- Create: `client/src/ImageCard.test.jsx`
- Create: `client/src/ImageCard.jsx`

- [ ] **Step 1: Write failing tests in `client/src/ImageCard.test.jsx`**

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageCard from './ImageCard';

const baseProps = {
  filename: 'photo_001.jpg',
  inputDataUrl: 'data:image/jpeg;base64,abc',
  status: 'idle',
  outputDataUrl: null,
  error: null,
  isGenerating: false,
  onRegenerate: vi.fn(),
  onDownload: vi.fn(),
};

test('renders filename', () => {
  render(<ImageCard {...baseProps} />);
  expect(screen.getByText('photo_001.jpg')).toBeInTheDocument();
});

test('shows "Waiting" label when status is idle', () => {
  render(<ImageCard {...baseProps} status="idle" />);
  expect(screen.getByText('WAITING')).toBeInTheDocument();
});

test('shows "Generating..." when status is generating', () => {
  render(<ImageCard {...baseProps} status="generating" />);
  expect(screen.getByText('GENERATING...')).toBeInTheDocument();
});

test('shows output image when status is done', () => {
  render(<ImageCard {...baseProps} status="done" outputDataUrl="data:image/png;base64,out" />);
  const outputImg = screen.getAllByRole('img')[1];
  expect(outputImg).toHaveAttribute('src', 'data:image/png;base64,out');
});

test('shows error message when status is error', () => {
  render(<ImageCard {...baseProps} status="error" error="Rate limited" />);
  expect(screen.getByText('Rate limited')).toBeInTheDocument();
});

test('Regenerate button is disabled when isGenerating is true', () => {
  render(<ImageCard {...baseProps} status="done" isGenerating={true} />);
  expect(screen.getByRole('button', { name: /regenerate/i })).toBeDisabled();
});

test('Regenerate button is disabled when this card is generating', () => {
  render(<ImageCard {...baseProps} status="generating" isGenerating={false} />);
  expect(screen.getByRole('button', { name: /regenerate/i })).toBeDisabled();
});

test('Download button is disabled when status is not done', () => {
  render(<ImageCard {...baseProps} status="idle" />);
  expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
});

test('Download button is enabled when status is done', () => {
  render(<ImageCard {...baseProps} status="done" outputDataUrl="data:image/png;base64,out" />);
  expect(screen.getByRole('button', { name: /download/i })).not.toBeDisabled();
});

test('calls onRegenerate when Regenerate is clicked', async () => {
  const onRegenerate = vi.fn();
  render(<ImageCard {...baseProps} status="done" outputDataUrl="data:image/png;base64,out" onRegenerate={onRegenerate} />);
  await userEvent.click(screen.getByRole('button', { name: /regenerate/i }));
  expect(onRegenerate).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd client && npm test
```

Expected: 10 ImageCard tests fail with `Cannot find module './ImageCard'`

- [ ] **Step 3: Implement `client/src/ImageCard.jsx`**

```jsx
export default function ImageCard({
  filename, inputDataUrl, status, outputDataUrl, error,
  isGenerating, onRegenerate, onDownload,
}) {
  const cardClass = `image-card image-card--${status}`;
  const regenDisabled = isGenerating || status === 'generating';
  const downloadDisabled = status !== 'done';

  return (
    <div className={cardClass}>
      <div className="image-card__filename">{filename}</div>

      <div className="image-card__images">
        <div className="image-card__slot">
          <div className="image-card__slot-label">INPUT</div>
          <img src={inputDataUrl} alt={`Input: ${filename}`} className="image-card__img" />
        </div>

        <div className="image-card__slot">
          <div className={`image-card__slot-label image-card__slot-label--${status}`}>
            {status === 'idle' && 'WAITING'}
            {status === 'generating' && 'GENERATING...'}
            {status === 'done' && 'OUTPUT ✓'}
            {status === 'error' && 'ERROR'}
          </div>

          {status === 'idle' && <div className="image-card__placeholder" />}
          {status === 'generating' && <div className="spinner" aria-label="generating" />}
          {status === 'done' && (
            <img src={outputDataUrl} alt={`Output: ${filename}`} className="image-card__img" />
          )}
          {status === 'error' && (
            <div className="image-card__error">{error}</div>
          )}
        </div>
      </div>

      <div className="image-card__actions">
        <button
          className="btn btn--small"
          onClick={onRegenerate}
          disabled={regenDisabled}
        >
          ↺ Regenerate
        </button>
        <button
          className="btn btn--small"
          onClick={onDownload}
          disabled={downloadDisabled}
        >
          ⬇ Download
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd client && npm test
```

Expected: all ImageCard tests pass

- [ ] **Step 5: Commit**

```bash
git add client/src/ImageCard.jsx client/src/ImageCard.test.jsx
git commit -m "feat: add ImageCard component"
```

---

## Task 6: `ImageGrid` component

**Files:**
- Create: `client/src/ImageGrid.jsx`

No complex logic — just layout. No dedicated test needed.

- [ ] **Step 1: Create `client/src/ImageGrid.jsx`**

```jsx
import ImageCard from './ImageCard';

export default function ImageGrid({ images, isGenerating, onRegenerate, onDownload }) {
  if (images.length === 0) return null;

  return (
    <div className="image-grid">
      {images.map((img) => (
        <ImageCard
          key={img.id}
          filename={img.filename}
          inputDataUrl={img.inputDataUrl}
          status={img.status}
          outputDataUrl={img.outputDataUrl}
          error={img.error}
          isGenerating={isGenerating}
          onRegenerate={() => onRegenerate(img.id)}
          onDownload={() => onDownload(img.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/ImageGrid.jsx
git commit -m "feat: add ImageGrid component"
```

---

## Task 7: `App.jsx` — state, upload zone, and layout

**Files:**
- Create: `client/src/App.jsx`

- [ ] **Step 1: Create `client/src/App.jsx`**

```jsx
import { useState, useRef } from 'react';
import { generateImage } from './api';
import ConfigPanel from './ConfigPanel';
import ImageGrid from './ImageGrid';
import JSZip from 'jszip';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadWarning, setUploadWarning] = useState('');
  const fileInputRef = useRef(null);

  async function handleFolderSelect(e) {
    const files = Array.from(e.target.files);
    const valid = files.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
    );
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    const truncated = valid.slice(0, MAX_IMAGES);

    const warnings = [];
    if (oversized.length > 0) warnings.push(`${oversized.length} file(s) over 10MB skipped`);
    if (valid.length > MAX_IMAGES) warnings.push(`Only first ${MAX_IMAGES} images loaded`);
    setUploadWarning(warnings.join('. '));

    const newImages = await Promise.all(
      truncated.map(async (file) => ({
        id: crypto.randomUUID(),
        filename: file.name,
        inputDataUrl: await readFileAsDataURL(file),
        mimeType: file.type,
        status: 'idle',
        outputDataUrl: null,
        error: null,
      }))
    );
    setImages(newImages);
  }

  async function handleGenerateAll() {
    setIsGenerating(true);
    const toProcess = images.filter((img) => img.status !== 'done');
    for (const img of toProcess) {
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, status: 'generating', error: null } : i))
      );
      try {
        const result = await generateImage({
          image: img.inputDataUrl,
          mimeType: img.mimeType,
          prompt,
          apiKey,
        });
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: 'done', outputDataUrl: result.image } : i
          )
        );
      } catch (err) {
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: 'error', error: err.message } : i
          )
        );
      }
    }
    setIsGenerating(false);
  }

  async function handleRegenerate(id) {
    const img = images.find((i) => i.id === id);
    if (!img) return;
    setImages((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'generating', error: null } : i))
    );
    try {
      const result = await generateImage({
        image: img.inputDataUrl,
        mimeType: img.mimeType,
        prompt,
        apiKey,
      });
      setImages((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: 'done', outputDataUrl: result.image } : i
        )
      );
    } catch (err) {
      setImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'error', error: err.message } : i))
      );
    }
  }

  function handleDownloadOne(id) {
    const img = images.find((i) => i.id === id);
    if (!img || !img.outputDataUrl) return;
    const ext = img.outputDataUrl.match(/^data:image\/([^;]+)/)?.[1] || 'png';
    const nameWithoutExt = img.filename.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = img.outputDataUrl;
    a.download = `output_${nameWithoutExt}.${ext}`;
    a.click();
  }

  async function handleDownloadAll() {
    const done = images.filter((img) => img.status === 'done');
    if (done.length === 0) return;
    const zip = new JSZip();
    for (const img of done) {
      const base64 = img.outputDataUrl.replace(/^data:[^;]+;base64,/, '');
      const ext = img.outputDataUrl.match(/^data:image\/([^;]+)/)?.[1] || 'png';
      const nameWithoutExt = img.filename.replace(/\.[^.]+$/, '');
      zip.file(`output_${nameWithoutExt}.${ext}`, base64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_output.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Batch Image Generator</h1>
      </header>

      <main className="app-main">
        <ConfigPanel
          apiKey={apiKey}
          prompt={prompt}
          images={images}
          isGenerating={isGenerating}
          onApiKeyChange={setApiKey}
          onPromptChange={setPrompt}
          onGenerateAll={handleGenerateAll}
          onDownloadAll={handleDownloadAll}
        />

        <div
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFolderSelect({ target: { files: e.dataTransfer.files } });
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            webkitdirectory=""
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFolderSelect}
            style={{ display: 'none' }}
          />
          <span>
            📁 Drop folder here or <span className="upload-zone__link">click to select folder</span>
            {images.length > 0 && ` · ${images.length}/${MAX_IMAGES} images loaded`}
          </span>
          {uploadWarning && <div className="upload-zone__warning">{uploadWarning}</div>}
        </div>

        <ImageGrid
          images={images}
          isGenerating={isGenerating}
          onRegenerate={handleRegenerate}
          onDownload={handleDownloadOne}
        />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Run client tests to ensure nothing is broken**

```bash
cd client && npm test
```

Expected: all existing tests still pass

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: add App with state, upload, generation loop, and download"
```

---

## Task 8: Dark theme styles

**Files:**
- Create: `client/src/App.css`

- [ ] **Step 1: Create `client/src/App.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #0d1117;
  color: #e6edf3;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  min-height: 100vh;
}

/* Layout */
.app { display: flex; flex-direction: column; min-height: 100vh; }
.app-header { padding: 16px 24px; border-bottom: 1px solid #30363d; }
.app-header h1 { font-size: 18px; font-weight: 600; color: #e6edf3; }
.app-main { flex: 1; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

/* Config panel */
.config-panel {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.config-field { display: flex; flex-direction: column; gap: 4px; }
.config-field--grow { flex: 1; min-width: 200px; }
.config-label { font-size: 10px; font-weight: 600; color: #8b949e; letter-spacing: 0.05em; }
.config-input {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 4px;
  padding: 6px 10px;
  color: #e6edf3;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  min-width: 200px;
}
.config-input:focus { border-color: #58a6ff; }
.config-textarea { resize: vertical; min-height: 52px; font-family: inherit; }
.config-actions { display: flex; gap: 8px; flex-shrink: 0; }

/* Buttons */
.btn {
  border: none;
  border-radius: 6px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;
  white-space: nowrap;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn--primary { background: #238636; color: #fff; }
.btn--primary:not(:disabled):hover { background: #2ea043; }
.btn--secondary { background: #21262d; border: 1px solid #30363d; color: #e6edf3; }
.btn--secondary:not(:disabled):hover { background: #30363d; }
.btn--small { flex: 1; padding: 5px 8px; font-size: 12px; background: #21262d; border: 1px solid #30363d; color: #e6edf3; }
.btn--small:not(:disabled):hover { background: #30363d; }

/* Upload zone */
.upload-zone {
  background: #161b22;
  border: 2px dashed #30363d;
  border-radius: 8px;
  padding: 14px 20px;
  text-align: center;
  color: #8b949e;
  cursor: pointer;
  transition: border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.upload-zone:hover { border-color: #58a6ff; }
.upload-zone__link { color: #58a6ff; }
.upload-zone__warning { font-size: 12px; color: #f0883e; }

/* Image grid */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

/* Image card */
.image-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.2s;
}
.image-card--generating { border-color: #58a6ff; }
.image-card--done { border-color: #238636; }
.image-card--error { border-color: #da3633; }

.image-card__filename {
  font-size: 11px;
  color: #8b949e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-card__images { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.image-card__slot { display: flex; flex-direction: column; gap: 4px; }
.image-card__slot-label { font-size: 9px; font-weight: 600; letter-spacing: 0.05em; color: #8b949e; }
.image-card__slot-label--generating { color: #58a6ff; }
.image-card__slot-label--done { color: #3fb950; }
.image-card__slot-label--error { color: #f85149; }

.image-card__img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  background: #0d1117;
}
.image-card__placeholder {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  border: 1px dashed #30363d;
  background: #0d1117;
}
.image-card__error {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  background: #1a0c0c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #f85149;
  padding: 6px;
  text-align: center;
  overflow: hidden;
}

.image-card__actions { display: flex; gap: 6px; }

/* Spinner */
.spinner {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  background: #0d1117;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spinner::after {
  content: '';
  width: 28px;
  height: 28px;
  border: 3px solid #30363d;
  border-top-color: #58a6ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 2: Commit**

```bash
git add client/src/App.css
git commit -m "feat: add dark theme styles"
```

---

## Task 9: Smoke test — verify it runs end-to-end

- [ ] **Step 1: Run all tests one final time**

```bash
cd server && npm test
cd ../client && npm test
```

Expected: all tests pass across both directories

- [ ] **Step 2: Start the dev servers**

```bash
cd .. && npm run dev
```

Expected:
- Express starts on http://localhost:3001
- Vite starts on http://localhost:5173

- [ ] **Step 3: Manual smoke test in browser**

1. Open http://localhost:5173
2. Enter a real Gemini API key
3. Enter a prompt like "Transform into a watercolor painting"
4. Click the upload zone and select a folder with 1-2 test images
5. Verify images appear in the card grid with INPUT shown
6. Click "Generate All"
7. Verify cards show blue "GENERATING..." state, then green "OUTPUT ✓"
8. Verify Regenerate and Download buttons appear on done cards
9. Click Download on one card — file should download
10. Click "Download All" — `batch_output.zip` should download with all done images

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: complete batch image generator"
```
