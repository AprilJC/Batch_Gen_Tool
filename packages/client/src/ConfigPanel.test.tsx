import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigPanel from './ConfigPanel';
import type { ModelId, Ratio, Quality, Status } from './types';

const makeImage = (status: Status) => ({
  id: '1', filename: 'a.jpg', inputDataUrl: 'data:image/jpeg;base64,x',
  mimeType: 'image/jpeg', input2DataUrl: null, mimeType2: null,
  status, outputDataUrl: null, error: null,
});

const baseProps = {
  prompt: 'watercolor',
  model: 'gemini-3.1-flash-image-preview' as ModelId,
  ratio: '1:1' as Ratio,
  quality: '1K' as Quality,
  inputMode: 1 as const,
  images: [makeImage('idle')],
  isGenerating: false,
  onPromptChange: vi.fn(),
  onModelChange: vi.fn(),
  onRatioChange: vi.fn(),
  onQualityChange: vi.fn(),
  onInputModeChange: vi.fn(),
  onGenerateAll: vi.fn(),
  onDownloadAll: vi.fn(),
  onCancel: vi.fn(),
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

test('Cancel button shown when isGenerating is true', () => {
  render(<ConfigPanel {...baseProps} isGenerating={true} />);
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /generate all/i })).not.toBeInTheDocument();
});

test('Download All is disabled when no images are done', () => {
  render(<ConfigPanel {...baseProps} images={[makeImage('idle')]} />);
  expect(screen.getByRole('button', { name: /download all/i })).toBeDisabled();
});

test('Download All is enabled when at least one image is done', () => {
  render(<ConfigPanel {...baseProps} images={[makeImage('done')]} />);
  expect(screen.getByRole('button', { name: /download all/i })).not.toBeDisabled();
});

test('calls onGenerateAll when Generate All is clicked', async () => {
  const onGenerateAll = vi.fn();
  render(<ConfigPanel {...baseProps} onGenerateAll={onGenerateAll} />);
  await userEvent.click(screen.getByRole('button', { name: /generate all/i }));
  expect(onGenerateAll).toHaveBeenCalledTimes(1);
});

test('renders 4 model options', () => {
  render(<ConfigPanel {...baseProps} />);
  const select = screen.getAllByRole('combobox')[0];
  const options = Array.from(select?.querySelectorAll('option') ?? []);
  expect(options).toHaveLength(4);
});

test('ratio dropdown has 14 options for NB2', () => {
  render(<ConfigPanel {...baseProps} model="zhipu-nanobanana-2" />);
  const selects = screen.getAllByRole('combobox');
  const ratioSelect = selects[1];
  const options = Array.from(ratioSelect?.querySelectorAll('option') ?? []);
  expect(options).toHaveLength(14);
});

test('ratio dropdown has 10 options for Pro', () => {
  render(<ConfigPanel {...baseProps} model="zhipu-nanobanana-pro" />);
  const selects = screen.getAllByRole('combobox');
  const ratioSelect = selects[1];
  const options = Array.from(ratioSelect?.querySelectorAll('option') ?? []);
  expect(options).toHaveLength(10);
});

test('calls onRatioChange when ratio changes', async () => {
  const onRatioChange = vi.fn();
  render(<ConfigPanel {...baseProps} onRatioChange={onRatioChange} />);
  const selects = screen.getAllByRole('combobox');
  await userEvent.selectOptions(selects[1]!, '16:9');
  expect(onRatioChange).toHaveBeenCalledWith('16:9');
});

test('calls onQualityChange when quality changes', async () => {
  const onQualityChange = vi.fn();
  render(<ConfigPanel {...baseProps} onQualityChange={onQualityChange} />);
  const selects = screen.getAllByRole('combobox');
  await userEvent.selectOptions(selects[2]!, '2K');
  expect(onQualityChange).toHaveBeenCalledWith('2K');
});
