export async function generateImage({ image, mimeType, prompt, apiKey, model }) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ image, mimeType, prompt, model }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Generation failed');
  }
  return data;
}
