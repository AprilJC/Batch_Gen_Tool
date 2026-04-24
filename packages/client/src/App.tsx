import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { generateImage } from './api';
import ConfigPanel, { type InputMode } from './ConfigPanel';
import ImageGrid from './ImageGrid';
import Lightbox from './Lightbox';
import JSZip from 'jszip';
import type { HistoryBatch, ImageItem, ModelId, Ratio, Quality } from './types';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') resolve(result);
      else reject(new Error('FileReader did not return a string'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [prompt, setPrompt] = useState<string>('');
  const [model, setModel] = useState<ModelId>('gemini-3.1-flash-image-preview');
  const [ratio, setRatio] = useState<Ratio>('1:1');
  const [quality, setQuality] = useState<Quality>('1K');
  const [inputMode, setInputMode] = useState<InputMode>(1);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [uploadWarning, setUploadWarning] = useState<string>('');
  const [history] = useState<HistoryBatch[]>([]);
  const [lightboxImage, setLightboxImage] = useState<ImageItem | HistoryBatch['images'][number] | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const cancelRef = useRef<boolean>(false);

  const handleModelChange = useCallback((nextModel: ModelId) => {
    setModel(nextModel);
    const RATIOS_PRO = ['1:1','2:3','3:2','4:3','3:4','4:5','5:4','16:9','9:16','21:9'];
    if (nextModel === 'zhipu-nanobanana-pro' && !(RATIOS_PRO as string[]).includes(ratio)) {
      setRatio('1:1');
    }
  }, [ratio]);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    if (isGenerating) return;

    const files = Array.from(fileList);
    const valid = files.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
    );
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);

    const warnings: string[] = [];
    if (oversized.length > 0) warnings.push(`${oversized.length} file(s) over 10MB skipped`);

    if (inputMode === 2) {
      const lastItem = images[images.length - 1];
      const lastIsUnpaired = !!lastItem && !lastItem.input2DataUrl && lastItem.status === 'idle';
      const slotsAvailable = MAX_IMAGES - images.length;
      // 1 file to fill the last unpaired slot (if any) + slotsAvailable * 2 for new pairs
      const fileLimit = lastIsUnpaired ? 1 + slotsAvailable * 2 : slotsAvailable * 2;
      const truncated = valid.slice(0, fileLimit);

      if (valid.length > fileLimit) warnings.push(`Only ${slotsAvailable} more group(s) can be added (max ${MAX_IMAGES})`);
      setUploadWarning(warnings.join('. '));
      if (truncated.length === 0) return;

      const filesToPair: File[] = [...truncated];
      let updatedLast: ImageItem | null = null;

      if (lastIsUnpaired && lastItem && filesToPair.length > 0) {
        const fillFile = filesToPair.shift();
        if (fillFile) {
          const dataUrl = await readFileAsDataURL(fillFile);
          updatedLast = {
            ...lastItem,
            filename: `${lastItem.filename} + ${fillFile.name}`,
            input2DataUrl: dataUrl,
            mimeType2: fillFile.type,
          };
        }
      }

      const pairs: Array<[File, File | null]> = [];
      for (let i = 0; i < filesToPair.length; i += 2) {
        const f1 = filesToPair[i];
        const f2 = filesToPair[i + 1] ?? null;
        if (f1) pairs.push([f1, f2]);
      }

      const newItems: ImageItem[] = await Promise.all(
        pairs.map(async ([f1, f2]): Promise<ImageItem> => ({
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

      setImages((prev) => {
        const updated = updatedLast
          ? prev.map((img) => (img.id === updatedLast!.id ? updatedLast! : img))
          : [...prev];
        return [...updated, ...newItems];
      });
    } else {
      const remaining = MAX_IMAGES - images.length;
      const truncated = valid.slice(0, remaining);
      if (valid.length > remaining) warnings.push(`Only ${remaining} more image(s) can be added (max ${MAX_IMAGES})`);
      setUploadWarning(warnings.join('. '));
      if (truncated.length === 0) return;

      const newImages: ImageItem[] = await Promise.all(
        truncated.map(async (file): Promise<ImageItem> => ({
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
      setImages((prev) => [...prev, ...newImages]);
    }
  }, [images, inputMode, isGenerating]);

  // Paste support
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageFiles = items
        .filter((item) => ACCEPTED_TYPES.includes(item.type))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (imageFiles.length > 0) await processFiles(imageFiles);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  function handleFilesSelect(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(e.target.files);
  }

  function handleCancel() {
    cancelRef.current = true;
    setIsGenerating(false);
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
          ratio,
          quality,
        });
        if (cancelRef.current) break;
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: 'done', outputDataUrl: result.image } : i
          )
        );
      } catch (err) {
        if (cancelRef.current) break;
        const message = err instanceof Error ? err.message : String(err);
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: 'error', error: message } : i
          )
        );
      }
    }
    setIsGenerating(false);
  }

  async function handleRegenerate(id: string) {
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
        ratio,
        quality,
      });
      setImages((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, status: 'done', outputDataUrl: result.image } : i
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'error', error: message } : i))
      );
    }
  }

  function handleDelete(id: string) {
    setImages((prev) => prev.filter((i) => i.id !== id));
  }

  function handleDownloadOne(id: string) {
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
    const done = images.filter((img): img is ImageItem & { outputDataUrl: string } => img.status === 'done' && !!img.outputDataUrl);
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
          ratio={ratio}
          quality={quality}
          images={images}
          isGenerating={isGenerating}
          onPromptChange={setPrompt}
          onModelChange={handleModelChange}
          onRatioChange={setRatio}
          onQualityChange={setQuality}
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
            processFiles(e.dataTransfer.files);
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
            or drag, drop, or paste here
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
                      {img.outputDataUrl && (
                        <img src={img.outputDataUrl} alt={img.filename} className="history-item__img" />
                      )}
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
