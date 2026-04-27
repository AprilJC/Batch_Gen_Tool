import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordGate from './PasswordGate';

beforeEach(() => {
  const storage = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
    configurable: true,
  });
});

test('shows password form when not authenticated', () => {
  render(
    <PasswordGate>
      <div>app content</div>
    </PasswordGate>
  );

  expect(screen.getByPlaceholderText('请输入访问密码')).toBeInTheDocument();
  expect(screen.queryByText('app content')).not.toBeInTheDocument();
});

test('renders children immediately when localStorage auth=1', () => {
  window.localStorage.setItem('auth', '1');

  render(
    <PasswordGate>
      <div>app content</div>
    </PasswordGate>
  );

  expect(screen.getByText('app content')).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('请输入访问密码')).not.toBeInTheDocument();
});

test('unlocks and renders children on correct password', async () => {
  render(
    <PasswordGate>
      <div>app content</div>
    </PasswordGate>
  );

  await userEvent.type(screen.getByPlaceholderText('请输入访问密码'), 'Zoombo2026!');
  await userEvent.click(screen.getByRole('button', { name: /进入/i }));

  expect(screen.getByText('app content')).toBeInTheDocument();
  expect(window.localStorage.getItem('auth')).toBe('1');
});

test('shows error message on wrong password', async () => {
  render(
    <PasswordGate>
      <div>app content</div>
    </PasswordGate>
  );

  await userEvent.type(screen.getByPlaceholderText('请输入访问密码'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /进入/i }));

  expect(screen.getByText('密码错误，请重试')).toBeInTheDocument();
  expect(screen.queryByText('app content')).not.toBeInTheDocument();
  expect(window.localStorage.getItem('auth')).toBeNull();
});

test('clears input after wrong password', async () => {
  render(
    <PasswordGate>
      <div>app content</div>
    </PasswordGate>
  );

  await userEvent.type(screen.getByPlaceholderText('请输入访问密码'), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /进入/i }));

  expect(screen.getByPlaceholderText('请输入访问密码')).toHaveValue('');
});

test('submits on Enter key', async () => {
  render(
    <PasswordGate>
      <div>app content</div>
    </PasswordGate>
  );

  await userEvent.type(screen.getByPlaceholderText('请输入访问密码'), 'Zoombo2026!{enter}');

  expect(screen.getByText('app content')).toBeInTheDocument();
});
