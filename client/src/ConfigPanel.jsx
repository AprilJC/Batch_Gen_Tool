const MODELS = [
  { id: 'gemini-3.1-flash-image-preview', label: 'nanobana2' },
  { id: 'gemini-3-pro-image-preview',   label: 'nanobanana pro' },
];

export default function ConfigPanel({
  prompt, model, inputMode, images, isGenerating,
  onPromptChange, onModelChange, onInputModeChange, onGenerateAll, onDownloadAll, onCancel,
}) {
  const hasDone = images.some((img) => img.status === 'done');
  const canGenerate = !!prompt && images.length > 0 && !isGenerating;

  return (
    <div className="config-panel">
      <div className="config-field">
        <label className="config-label">MODEL</label>
        <select
          className="config-input config-select"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
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
