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

test('calls onDownload when Download is clicked', async () => {
  const onDownload = vi.fn();
  render(<ImageCard {...baseProps} status="done" outputDataUrl="data:image/png;base64,out" onDownload={onDownload} />);
  await userEvent.click(screen.getByRole('button', { name: /download/i }));
  expect(onDownload).toHaveBeenCalledTimes(1);
});
