import { useState, type FormEvent, type ReactNode } from 'react';

const PASSWORD = 'Zoombo2026!';
const STORAGE_KEY = 'auth';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(
    () => window.localStorage.getItem(STORAGE_KEY) === '1'
  );
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (authenticated) return <>{children}</>;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (input === PASSWORD) {
      window.localStorage.setItem(STORAGE_KEY, '1');
      setAuthenticated(true);
      return;
    }

    setError(true);
    setInput('');
  }

  return (
    <>
      <style>{`
        .password-gate {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #0d1117;
        }

        .password-gate__card {
          width: min(100%, 320px);
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .password-gate__title {
          color: #e6edf3;
          font-size: 18px;
          font-weight: 600;
          text-align: center;
        }

        .password-gate__input {
          width: 100%;
          background: #0d1117;
          border: 1px solid #30363d;
          border-radius: 4px;
          padding: 8px 10px;
          color: #e6edf3;
          font: inherit;
          outline: none;
          transition: border-color 0.15s;
        }

        .password-gate__input:focus {
          border-color: #58a6ff;
        }

        .password-gate__button {
          width: 100%;
          border: none;
          border-radius: 6px;
          padding: 8px 14px;
          background: #238636;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }

        .password-gate__button:hover {
          background: #2ea043;
        }

        .password-gate__error {
          min-height: 16px;
          color: #f85149;
          font-size: 12px;
          text-align: center;
        }
      `}</style>
      <div className="password-gate">
        <form className="password-gate__card" onSubmit={handleSubmit}>
          <div className="password-gate__title">Batch Image Generator</div>
          <input
            className="password-gate__input"
            type="password"
            placeholder="请输入访问密码"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            autoFocus
          />
          <button className="password-gate__button" type="submit">
            进入
          </button>
          <div className="password-gate__error">
            {error ? '密码错误，请重试' : ''}
          </div>
        </form>
      </div>
    </>
  );
}
