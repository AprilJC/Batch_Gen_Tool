export function stripDataUrlPrefix(dataUrl: string): string {
  const m = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return m?.[1] ?? dataUrl;
}

export function sniffMime(base64: string): string {
  if (base64.startsWith('/9j/'))        return 'image/jpeg';
  if (base64.startsWith('iVBOR'))       return 'image/png';
  if (base64.startsWith('UklGR'))       return 'image/webp';
  if (base64.startsWith('R0lGOD'))      return 'image/gif';
  return 'image/png';
}

export function wrapAsDataUrl(base64OrUrl: string): { image: string; mimeType: string } {
  if (base64OrUrl.startsWith('data:')) {
    const m = base64OrUrl.match(/^data:([^;]+);base64,/);
    return { image: base64OrUrl, mimeType: m?.[1] ?? 'image/png' };
  }
  const mime = sniffMime(base64OrUrl);
  return { image: `data:${mime};base64,${base64OrUrl}`, mimeType: mime };
}
