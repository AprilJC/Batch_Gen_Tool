export default function ConfigPanel({
  apiKey, prompt, images, isGenerating,
  onApiKeyChange, onPromptChange, onGenerateAll, onDownloadAll,
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
