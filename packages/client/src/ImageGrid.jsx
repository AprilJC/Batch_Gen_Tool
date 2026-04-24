import ImageCard from './ImageCard';

export default function ImageGrid({ images, isGenerating, onRegenerate, onDownload, onExpand, onDelete }) {
  if (images.length === 0) return null;

  return (
    <div className="image-grid">
      {images.map((img) => (
        <ImageCard
          key={img.id}
          filename={img.filename}
          inputDataUrl={img.inputDataUrl}
          input2DataUrl={img.input2DataUrl}
          status={img.status}
          outputDataUrl={img.outputDataUrl}
          error={img.error}
          isGenerating={isGenerating}
          onRegenerate={() => onRegenerate(img.id)}
          onDownload={() => onDownload(img.id)}
          onExpand={onExpand ? () => onExpand(img) : undefined}
          onDelete={() => onDelete(img.id)}
        />
      ))}
    </div>
  );
}
