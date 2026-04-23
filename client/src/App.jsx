import { useState, useRef } from 'react';
import { generateImage } from './api';
import ConfigPanel from './ConfigPanel';
import ImageGrid from './ImageGrid';
import Lightbox from './Lightbox';
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
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-3.1-flash-image-preview');
  const [inputMode, setInputMode] = useState(1);
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadWarning, setUploadWarning] = useState('');
  const [history, setHistory] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const cancelRef = useRef(false);

  async function handleFilesSelect(e) {
    const files = Array.from(e.target.files);
    const valid = files.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
    );
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);

    const remaining = MAX_IMAGES - images.length;
    const fileLimit = inputMode === 2 ? remaining * 2 : remaining;
    const truncated = valid.slice(0, fileLimit);

    const warnings = [];
    if (oversized.length > 0) warnings.push(`${oversized.length} file(s) over 10MB skipped`);
    if (valid.length > fileLimit) warnings.push(
      inputMode === 2
        ? `Only ${remaining} more group(s) can be added (max ${MAX_IMAGES})`
        : `Only ${remaining} more image(s) can be added (max ${MAX_IMAGES})`
    );
    setUploadWarning(warnings.join('. '));

    if (truncated.length === 0) return;

    let newImages;
    if (inputMode === 2) {
      const pairs = [];
      for (let i = 0; i < truncated.length; i += 2) {
        pairs.push([truncated[i], truncated[i + 1] || null]);
      }
      newImages = await Promise.all(
        pairs.map(async ([f1, f2]) => ({
          id: crypto.randomUUID(),
          filename: f2 ? `${f1.name} + ${f2.name}` : f1.name,
          inputDataUrl: await readFileAsDataURL(f1),
          mimeType: f1.type,
          input2DataUrl: f2 ? await readFileAsDataURL(f2) : null,
          mimeType2: f2 ? f2.type : null,
          status: 'idle',
          outputDataUrl: null,
          error: null,
        }))
      );
    } else {
      newImages = await Promise.all(
        truncated.map(async (file) => ({
          id: crypto.randomUUID(),
          filename: file.name,
          inputDataUrl: await readFileAsDataURL(file),
          mimeType: file.type,
          input2DataUrl: null,
          mimeType2: null,
          status: 'idle',
          outputDataUrl: null,
          error: null,
        }))
      );
    }
    setImages((prev) => [...prev, ...newImages]);
  }

  function handleCancel() {
    cancelRef.current = true;
    setImages((prev) =>
      prev.map((img) => (img.status === 'generating' ? { ...img, status: 'idle' } : img))
    );
  }

  async function handleGenerateAll() {
    cancelRef.current = false;
    setIsGenerating(true);
    const toProcess = images;
    for (const img of toProcess) {
      if (cancelRef.current) break;
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, status: 'generating', error: null } : i))
      );
      try {
        const result = await generateImage({
          image: img.inputDataUrl,
          mimeType: img.mimeType,
          image2: img.input2DataUrl,
          mimeType2: img.mimeType2,
          prompt,
          model,
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
        image2: img.input2DataUrl,
        mimeType2: img.mimeType2,
        prompt,
        model,
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

  function handleDelete(id) {
    setImages((prev) => prev.filter((i) => i.id !== id));
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
          prompt={prompt}
          model={model}
          images={images}
          isGenerating={isGenerating}
          onPromptChange={setPrompt}
          onModelChange={setModel}
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          onGenerateAll={handleGenerateAll}
          onDownloadAll={handleDownloadAll}
          onCancel={handleCancel}
        />

        <div
          className="upload-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFilesSelect({ target: { files: e.dataTransfer.files } });
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFilesSelect}
            style={{ display: 'none' }}
          />
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFilesSelect}
            style={{ display: 'none' }}
          />
          <div className="upload-zone__buttons">
            <button className="btn btn--secondary" onClick={() => fileInputRef.current?.click()}>
              📄 Select Images
            </button>
            <button className="btn btn--secondary" onClick={() => folderInputRef.current?.click()}>
              📁 Select Folder
            </button>
          </div>
          <span className="upload-zone__hint">
            or drag and drop here
            {images.length > 0 && ` · ${images.length}/${MAX_IMAGES} loaded`}
          </span>
          {uploadWarning && <div className="upload-zone__warning">{uploadWarning}</div>}
        </div>

        <ImageGrid
          images={images}
          isGenerating={isGenerating}
          onRegenerate={handleRegenerate}
          onDownload={handleDownloadOne}
          onDelete={handleDelete}
          onExpand={(img) => setLightboxImage(img)}
        />

        {history.length > 0 && (
          <div className="history-section">
            <div className="history-section-title">HISTORY</div>
            {history.map((batch) => (
              <details key={batch.id} className="history-batch">
                <summary className="history-batch-summary">
                  <span className="history-batch__prompt">{batch.prompt}</span>
                  <span className="history-batch__meta">
                    {batch.images.length} image{batch.images.length !== 1 ? 's' : ''} · {batch.timestamp}
                  </span>
                </summary>
                <div className="history-grid">
                  {batch.images.map((img) => (
                    <div
                      key={img.id}
                      className="history-item"
                      onClick={() => setLightboxImage(img)}
                    >
                      <img src={img.outputDataUrl} alt={img.filename} className="history-item__img" />
                      <div className="history-item__filename">{img.filename}</div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </main>

      <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
