import { useState, useRef } from 'react';
import { generateImage } from './api';
import ConfigPanel from './ConfigPanel';
import ImageGrid from './ImageGrid';
import JSZip from 'jszip';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadWarning, setUploadWarning] = useState('');
  const fileInputRef = useRef(null);

  async function handleFolderSelect(e) {
    const files = Array.from(e.target.files);
    const valid = files.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
    );
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    const truncated = valid.slice(0, MAX_IMAGES);

    const warnings = [];
    if (oversized.length > 0) warnings.push(`${oversized.length} file(s) over 10MB skipped`);
    if (valid.length > MAX_IMAGES) warnings.push(`Only first ${MAX_IMAGES} images loaded`);
    setUploadWarning(warnings.join('. '));

    const newImages = await Promise.all(
      truncated.map(async (file) => ({
        id: crypto.randomUUID(),
        filename: file.name,
        inputDataUrl: await readFileAsDataURL(file),
        mimeType: file.type,
        status: 'idle',
        outputDataUrl: null,
        error: null,
      }))
    );
    setImages(newImages);
  }

  async function handleGenerateAll() {
    setIsGenerating(true);
    const toProcess = images.filter((img) => img.status !== 'done');
    for (const img of toProcess) {
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, status: 'generating', error: null } : i))
      );
      try {
        const result = await generateImage({
          image: img.inputDataUrl,
          mimeType: img.mimeType,
          prompt,
          apiKey,
        });
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: 'done', outputDataUrl: result.image } : i
          )
        );
      } catch (err) {
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: 'error', error: err.message } : i
          )
        );
      }
    }
    setIsGenerating(false);
  }

  async function handleRegenerate(id) {
    const img = images.find((i) => i.id === id);
    if (!img) return;
    setImages((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'generating', error: null } : i))
    );
    try {
      const result = await generateImage({
        image: img.inputDataUrl,
        mimeType: img.mimeType,
        prompt,
        apiKey,
      });
      setImages((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: 'done', outputDataUrl: result.image } : i
        )
      );
    } catch (err) {
      setImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'error', error: err.message } : i))
      );
    }
  }

  function handleDownloadOne(id) {
    const img = images.find((i) => i.id === id);
    if (!img || !img.outputDataUrl) return;
    const ext = img.outputDataUrl.match(/^data:image\/([^;]+)/)?.[1] || 'png';
    const nameWithoutExt = img.filename.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = img.outputDataUrl;
    a.download = `output_${nameWithoutExt}.${ext}`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleDownloadAll() {
    const done = images.filter((img) => img.status === 'done');
    if (done.length === 0) return;
    const zip = new JSZip();
    for (const img of done) {
      const base64 = img.outputDataUrl.replace(/^data:[^;]+;base64,/, '');
      const ext = img.outputDataUrl.match(/^data:image\/([^;]+)/)?.[1] || 'png';
      const nameWithoutExt = img.filename.replace(/\.[^.]+$/, '');
      zip.file(`output_${nameWithoutExt}.${ext}`, base64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_output.zip';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Batch Image Generator</h1>
      </header>

      <main className="app-main">
        <ConfigPanel
          apiKey={apiKey}
          prompt={prompt}
          images={images}
          isGenerating={isGenerating}
          onApiKeyChange={setApiKey}
          onPromptChange={setPrompt}
          onGenerateAll={handleGenerateAll}
          onDownloadAll={handleDownloadAll}
        />

        <div
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFolderSelect({ target: { files: e.dataTransfer.files } });
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            webkitdirectory=""
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFolderSelect}
            style={{ display: 'none' }}
          />
          <span>
            📁 Drop folder here or <span className="upload-zone__link">click to select folder</span>
            {images.length > 0 && ` · ${images.length}/${MAX_IMAGES} images loaded`}
          </span>
          {uploadWarning && <div className="upload-zone__warning">{uploadWarning}</div>}
        </div>

        <ImageGrid
          images={images}
          isGenerating={isGenerating}
          onRegenerate={handleRegenerate}
          onDownload={handleDownloadOne}
        />
      </main>
    </div>
  );
}
