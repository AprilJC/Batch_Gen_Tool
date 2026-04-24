import type { Status } from './types';

interface Props {
  filename: string;
  inputDataUrl: string;
  mimeType: string;
  input2DataUrl: string | null;
  status: Status;
  outputDataUrl: string | null;
  error: string | null;
  isGenerating: boolean;
  onRegenerate: () => void;
  onDownload: () => void;
  onExpand?: (() => void) | undefined;
  onDelete: () => void;
}

export default function ImageCard({
  filename, inputDataUrl, input2DataUrl, status, outputDataUrl, error,
  isGenerating, onRegenerate, onDownload, onExpand, onDelete,
}: Props) {
  const cardClass = `image-card image-card--${status}`;
  const regenDisabled = isGenerating || status === 'generating';
  const downloadDisabled = status !== 'done';
  const canExpand = status === 'done' && !!onExpand;
  const deleteDisabled = isGenerating || status === 'generating';
  const dual = !!input2DataUrl;

  return (
    <div className={cardClass}>
      <div className="image-card__header">
        <div className="image-card__filename">{filename}</div>
        <button
          className="image-card__delete"
          onClick={onDelete}
          disabled={deleteDisabled}
          title="Remove"
        >×</button>
      </div>

      <div className="image-card__images">
        <div className={`image-card__slot${dual ? ' image-card__slot--dual' : ''}`}>
          <div className="image-card__slot-label">INPUT{dual ? ' 1+2' : ''}</div>
          <img
            src={inputDataUrl}
            alt={`Input: ${filename}`}
            className="image-card__img"
          />
          {dual && input2DataUrl && (
            <img
              src={input2DataUrl}
              alt={`Input 2: ${filename}`}
              className="image-card__img"
            />
          )}
        </div>

        <div className="image-card__slot">
          <div className={`image-card__slot-label image-card__slot-label--${status}`}>
            {status === 'idle' && 'WAITING'}
            {status === 'generating' && 'GENERATING...'}
            {status === 'done' && 'OUTPUT ✓ (click to expand)'}
            {status === 'error' && 'ERROR'}
          </div>

          {status === 'idle' && <div className="image-card__placeholder" />}
          {status === 'generating' && <div className="spinner" aria-label="generating" />}
          {status === 'done' && outputDataUrl && (
            <img
              src={outputDataUrl}
              alt={`Output: ${filename}`}
              className={`image-card__img${canExpand ? ' image-card__img--clickable' : ''}`}
              onClick={canExpand ? onExpand : undefined}
            />
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
