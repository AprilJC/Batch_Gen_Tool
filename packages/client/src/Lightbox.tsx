import { useEffect } from 'react';
import type { ImageItem, HistoryBatch } from './types';

type LightboxImage =
  | ImageItem
  | HistoryBatch['images'][number]
  | null;

interface Props {
  image: LightboxImage;
  onClose: () => void;
}

export default function Lightbox({ image, onClose }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!image) return null;

  const dual = !!image.input2DataUrl;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-header">
          <span className="lightbox-filename">{image.filename}</span>
          <button className="lightbox-close" onClick={onClose}>✕</button>
        </div>
        <div className={`lightbox-body${dual ? ' lightbox-body--triple' : ''}`}>
          <div className="lightbox-slot">
            <div className="lightbox-label">INPUT{dual ? ' 1' : ''}</div>
            <img src={image.inputDataUrl} alt={`Input: ${image.filename}`} className="lightbox-img" />
          </div>
          {dual && image.input2DataUrl && (
            <div className="lightbox-slot">
              <div className="lightbox-label">INPUT 2</div>
              <img src={image.input2DataUrl} alt={`Input 2: ${image.filename}`} className="lightbox-img" />
            </div>
          )}
          <div className="lightbox-slot">
            <div className="lightbox-label lightbox-label--done">OUTPUT</div>
            {image.outputDataUrl && (
              <img src={image.outputDataUrl} alt={`Output: ${image.filename}`} className="lightbox-img" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
