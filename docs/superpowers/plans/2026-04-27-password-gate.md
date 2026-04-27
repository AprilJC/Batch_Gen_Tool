# Password Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen password gate that blocks access to the app until the user enters `Zoombo2026!`, with the unlocked state persisted in `localStorage`.

**Architecture:** A new `PasswordGate` component wraps `<App>` in `main.tsx`. It reads `localStorage` on mount; if already unlocked it renders children immediately, otherwise it renders a centered password form. On correct submission it writes to `localStorage` and renders children. `App.tsx` is not touched.

**Tech Stack:** React 18, TypeScript, Vitest, @testing-library/react, @testing-library/user-event

---

### Task 1: Create PasswordGate component with tests

**Files:**
- Create: `packages/client/src/PasswordGate.test.tsx`
- Create: `packages/client/src/PasswordGate.tsx`

- [ ] **Step 1: Write the failing tests**

Create `packages/client/src/PasswordGate.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordGate from './PasswordGate';

beforeEach(() => {
  localStorage.clear();
});

test('shows password form when not authenticated', () => {
  render(<PasswordGate><div>app content</div></PasswordGate>);
  expect(screen.getByPlaceholderText('请输入访问密码')).toBeInTheDocument();
  expect(screen.queryByText('app content')).not.toBeInTheDocument();
});

test('renders children immediately when localStorage auth=1', () => {
  localStorage.setItem('auth', '1');
  render(<PasswordGate><div>app content</div></PasswordGate>);
  expect(screen.getByText('app content')).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('请输入访问密码')).not.toBeInTheDocument();
});

test('unlocks and renders children on correct password', async () => {
  render(<PasswordGate><div>app content</div></PasswordGate>);
  await userEvent.type(screen.getByPlaceholderText('请输入访问密码'), 'Zoombo2026!');
  await userEvent.click(screen.getByRole('button', { name: /进入/i }));
  expect(screen.getByText('app content')).toBeInTheDocument();
  expect(localStorage.getItem('auth')).toBe('1');
});

test('shows error message on wrong password', async () => {
  render(<PasswordGate><div>app content</div></PasswordGate>);
  await userEvent.type(screen.getByPlaceholderText('请输入访问密码'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /进入/i }));
  expect(screen.getByText('密码错误，请重试')).toBeInTheDocument();
  expect(screen.queryByText('app content')).not.toBeInTheDocument();
  expect(localStorage.getItem('auth')).toBeNull();
});

test('clears input after wrong password', async () => {
  render(<PasswordGate><div>app content</div></PasswordGate>);
  await userEvent.type(screen.getByPlaceholderText('请输入访问密码'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /进入/i }));
  expect(screen.getByPlaceholderText('请输入访问密码')).toHaveValue('');
});

test('submits on Enter key', async () => {
  render(<PasswordGate><div>app content</div></PasswordGate>);
  await userEvent.type(screen.getByPlaceholderText('请输入访问密码'), 'Zoombo2026!{enter}');
  expect(screen.getByText('app content')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/client && npx vitest run PasswordGate.test.tsx
```

Expected: 6 tests fail with "Cannot find module './PasswordGate'"

- [ ] **Step 3: Implement PasswordGate.tsx**

Create `packages/client/src/PasswordGate.tsx`:

```tsx
import { useState } from 'react';

const PASSWORD = 'Zoombo2026!';
const STORAGE_KEY = 'auth';

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1'
  );
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (authenticated) return <>{children}</>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1');
      setAuthenticated(true);
    } else {
      setError(true);
      setInput('');
    }
  }

  return (
    <>
      <style>{`
        .pg-overlay {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #0d1117;
        }
        .pg-card {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 32px 28px;
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .pg-title {
          font-size: 16px;
          font-weight: 600;
          color: #e6edf3;
          text-align: center;
        }
        .pg-input {
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 4px;
          padding: 8px 12px;
          color: #e6edf3;
          font-size: 14px;
          outline: none;
          width: 100%;
          transition: border-color 0.15s;
        }
        .pg-input:focus { border-color: #58a6ff; }
        .pg-btn {
          background: #238636;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 8px 0;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          transition: opacity 0.15s;
        }
        .pg-btn:hover { opacity: 0.85; }
        .pg-error {
          color: #f85149;
          font-size: 12px;
          text-align: center;
          min-height: 16px;
        }
      `}</style>
      <div className="pg-overlay">
        <form className="pg-card" onSubmit={handleSubmit}>
          <div className="pg-title">Batch Image Generator</div>
          <input
            className="pg-input"
            type="password"
            placeholder="请输入访问密码"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            autoFocus
          />
          <button className="pg-btn" type="submit">进入</button>
          <div className="pg-error">{error ? '密码错误，请重试' : ''}</div>
        </form>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run tests to confirm they all pass**

```bash
cd packages/client && npx vitest run PasswordGate.test.tsx
```

Expected: 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/PasswordGate.tsx packages/client/src/PasswordGate.test.tsx
git commit -m "feat: add PasswordGate component with localStorage persistence"
```

---

### Task 2: Wire PasswordGate into main.tsx

**Files:**
- Modify: `packages/client/src/main.tsx`

- [ ] **Step 1: Update main.tsx**

Replace the contents of `packages/client/src/main.tsx` with:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';
import PasswordGate from './PasswordGate';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PasswordGate>
      <App />
    </PasswordGate>
  </React.StrictMode>
);
```

- [ ] **Step 2: Run the full test suite**

```bash
cd packages/client && npx vitest run
```

Expected: all tests pass (including existing ConfigPanel, ImageCard, api tests)

- [ ] **Step 3: Typecheck**

```bash
cd packages/client && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add packages/client/src/main.tsx
git commit -m "feat: gate app behind PasswordGate"
```
