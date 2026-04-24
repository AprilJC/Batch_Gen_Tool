import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigPanel from './ConfigPanel';

const baseProps = {
  prompt: 'watercolor',
  model: 'gemini-3.1-flash-image-preview',
  images: [{ status: 'idle' }],
  isGenerating: false,
  onPromptChange: vi.fn(),
  onModelChange: vi.fn(),
  onGenerateAll: vi.fn(),
  onDownloadAll: vi.fn(),
};

test('Generate All is enabled when all conditions are met', () => {
  render(<ConfigPanel {...baseProps} />);
  expect(screen.getByRole('button', { name: /generate all/i })).not.toBeDisabled();
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

test('calls onGenerateAll when Generate All is clicked', async () => {
  const onGenerateAll = vi.fn();
  render(<ConfigPanel {...baseProps} onGenerateAll={onGenerateAll} />);
  await userEvent.click(screen.getByRole('button', { name: /generate all/i }));
  expect(onGenerateAll).toHaveBeenCalledTimes(1);
});
