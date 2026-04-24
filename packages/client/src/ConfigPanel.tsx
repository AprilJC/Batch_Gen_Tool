import type { ImageItem, ModelId, Ratio, Quality } from './types';

interface ModelOption {
  id: ModelId;
  label: string;
}

const MODELS: ReadonlyArray<{ id: ModelId; label: string }> = [
  { id: 'gemini-3.1-flash-image-preview', label: 'nanobanana 2 (vertex)' },
  { id: 'gemini-3-pro-image-preview',    label: 'nanobanana pro (vertex)' },
  { id: 'zhipu-nanobanana-2',            label: 'nanobanana 2 (zhipu)' },
  { id: 'zhipu-nanobanana-pro',          label: 'nanobanana pro (zhipu)' },
] as const;

const RATIOS_ALL: ReadonlyArray<Ratio> = ['1:1','2:3','3:2','4:3','3:4','4:5','5:4','16:9','9:16','21:9','1:4','4:1','1:8','8:1'];
const RATIOS_PRO: ReadonlyArray<Ratio> = RATIOS_ALL.slice(0,10) as ReadonlyArray<Ratio>;
const QUALITIES: ReadonlyArray<Quality> = ['0.5K','1K','2K','4K'];

function ratiosForModel(model: ModelId): ReadonlyArray<Ratio> {
  if (model === 'zhipu-nanobanana-pro') return RATIOS_PRO;
  return RATIOS_ALL;
}

export type InputMode = 1 | 2;

interface Props {
  prompt: string;
  model: ModelId;
  ratio: Ratio;
  quality: Quality;
  inputMode: InputMode;
  images: ImageItem[];
  isGenerating: boolean;
  onPromptChange: (value: string) => void;
  onModelChange: (value: ModelId) => void;
  onRatioChange: (value: Ratio) => void;
  onQualityChange: (value: Quality) => void;
  onInputModeChange: (value: InputMode) => void;
  onGenerateAll: () => void;
  onDownloadAll: () => void;
  onCancel: () => void;
}

export default function ConfigPanel({
  prompt, model, ratio, quality, inputMode, images, isGenerating,
  onPromptChange, onModelChange, onRatioChange, onQualityChange, onInputModeChange, onGenerateAll, onDownloadAll, onCancel,
}: Props) {
  const hasDone = images.some((img) => img.status === 'done');
  const canGenerate = !!prompt && images.length > 0 && !isGenerating;

  return (
    <div className="config-panel">
      <div className="config-field">
        <label className="config-label">MODEL</label>
        <select
          className="config-input config-select"
          value={model}
          onChange={(e) => onModelChange(e.target.value as ModelId)}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>
      <div className="config-field">
        <label className="config-label">RATIO</label>
        <select className="config-input config-select" value={ratio} onChange={(e) => onRatioChange(e.target.value as Ratio)}>
          {ratiosForModel(model).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="config-field">
        <label className="config-label">QUALITY</label>
        <select className="config-input config-select" value={quality} onChange={(e) => onQualityChange(e.target.value as Quality)}>
          {QUALITIES.map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>
      <div className="config-field">
        <label className="config-label">INPUT MODE</label>
        <div className="mode-toggle">
          <button
            className={`mode-btn${inputMode === 1 ? ' mode-btn--active' : ''}`}
            onClick={() => onInputModeChange(1)}
            disabled={isGenerating}
          >1 image</button>
          <button
            className={`mode-btn${inputMode === 2 ? ' mode-btn--active' : ''}`}
            onClick={() => onInputModeChange(2)}
            disabled={isGenerating}
          >2 images</button>
        </div>
      </div>
      <div className="config-field config-field--grow">
        <label className="config-label">PROMPT</label>
        <textarea
          className="config-input config-textarea"
          placeholder="Describe how to transform the images..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={5}
        />
      </div>
      <div className="config-actions">
        {isGenerating ? (
          <button className="btn btn--cancel" onClick={onCancel}>
            ⬛ Cancel
          </button>
        ) : (
          <button
            className="btn btn--primary"
            onClick={onGenerateAll}
            disabled={!canGenerate}
          >
            ⚡ Generate All
          </button>
        )}
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
