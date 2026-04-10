import { useEffect } from 'react';

export default function Lightbox({ image, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!image) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-header">
          <span className="lightbox-filename">{image.filename}</span>
          <button className="lightbox-close" onClick={onClose}>✕</button>
        </div>
        <div className="lightbox-body">
          <div className="lightbox-slot">
            <div className="lightbox-label">INPUT</div>
            <img src={image.inputDataUrl} alt={`Input: ${image.filename}`} className="lightbox-img" />
          </div>
          <div className="lightbox-slot">
            <div className="lightbox-label lightbox-label--done">OUTPUT</div>
            <img src={image.outputDataUrl} alt={`Output: ${image.filename}`} className="lightbox-img" />
          </div>
        </div>
      </div>
    </div>
  );
}
