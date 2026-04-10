const MODELS = [
  { id: 'gemini-3.1-flash-image-preview', label: 'nanobana2' },
  { id: 'gemini-3-pro-image-preview',     label: 'nanobanana pro' },
];

export default function ConfigPanel({
  apiKey, prompt, model, images, isGenerating,
  onApiKeyChange, onPromptChange, onModelChange, onGenerateAll, onDownloadAll,
}) {
  const hasDone = images.some((img) => img.status === 'done');
  const canGenerate = !!apiKey && !!prompt && images.length > 0 && !isGenerating;

  return (
    <div className="config-panel">
      <div className="config-field">
        <label className="config-label">GOOGLE API KEY</label>
        <input
          type="password"
          className="config-input"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
        />
      </div>
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
        <button
          className="btn btn--primary"
          onClick={onGenerateAll}
          disabled={!canGenerate}
        >
          ⚡ Generate All
        </button>
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
