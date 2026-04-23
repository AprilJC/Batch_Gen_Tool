require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const ALLOWED_MODELS = {
  'gemini-3.1-flash-image-preview': true,
  'gemini-3-pro-image-preview': true,
};

app.post('/api/generate', async (req, res) => {
  const { image, mimeType, image2, mimeType2, prompt, model: modelId } = req.body;
  if (!image || !mimeType || !prompt) {
    return res.status(400).json({ error: 'image, mimeType, and prompt are required' });
  }

  const resolvedModel = ALLOWED_MODELS[modelId] ? modelId : 'gemini-3.1-flash-image-preview';
  const apiKey = process.env.NEWAPI_KEY;
  const baseUrl = process.env.NEWAPI_URL || 'https://ia.router.zoombo.ai/v1';

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(120000),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } },
            ...(image2 ? [{ type: 'image_url', image_url: { url: image2 } }] : []),
          ],
        }],
        modalities: ['image', 'text'],
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: `Upstream error (${response.status}): ${responseText.slice(0, 300)}` });
    }
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Generation failed' });
    }

    const content = data.choices?.[0]?.message?.content;
    let imageUrl = null;

    if (Array.isArray(content)) {
      const imgPart = content.find((p) => p.type === 'image_url');
      imageUrl = imgPart?.image_url?.url;
    } else if (typeof content === 'string') {
      // Markdown format: ![image](data:image/png;base64,...)
      const mdMatch = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
      if (mdMatch) {
        imageUrl = mdMatch[1];
      } else if (content.startsWith('data:image/')) {
        imageUrl = content;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image in response' });
    }

    const mimeTypeOut = imageUrl.match(/^data:([^;]+)/)?.[1] || 'image/png';
    res.json({ image: imageUrl, mimeType: mimeTypeOut });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
