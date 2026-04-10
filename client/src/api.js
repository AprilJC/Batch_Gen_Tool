export async function generateImage({ image, mimeType, prompt, apiKey }) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ image, mimeType, prompt }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Generation failed');
  }
  return data;
}
