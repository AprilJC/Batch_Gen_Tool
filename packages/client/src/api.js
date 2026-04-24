export async function generateImage({ image, mimeType, image2, mimeType2, prompt, model }) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image, mimeType, image2, mimeType2, prompt, model }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Generation failed');
  }
  return data;
}
