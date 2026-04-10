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
