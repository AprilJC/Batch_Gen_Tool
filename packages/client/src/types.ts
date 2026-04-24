export type Status = 'idle' | 'generating' | 'done' | 'error';

export interface ImageItem {
  id: string;
  filename: string;
  inputDataUrl: string;
  mimeType: string;
  input2DataUrl: string | null;
  mimeType2: string | null;
  status: Status;
  outputDataUrl: string | null;
  error: string | null;
}

export interface HistoryBatch {
  id: string;
  prompt: string;
  timestamp: string;
  images: Array<Pick<ImageItem, 'id' | 'filename' | 'inputDataUrl' | 'input2DataUrl' | 'outputDataUrl'>>;
}

export type Ratio =
  | '1:1' | '2:3' | '3:2' | '4:3' | '3:4' | '4:5' | '5:4' | '16:9' | '9:16' | '21:9'
  | '1:4' | '4:1' | '1:8' | '8:1';

export type Quality = '0.5K' | '1K' | '2K' | '4K';

export type ModelId =
  | 'gemini-3.1-flash-image-preview'
  | 'gemini-3-pro-image-preview'
  | 'zhipu-nanobanana-2'
  | 'zhipu-nanobanana-pro';
