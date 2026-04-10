const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/generate', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(400).json({ error: 'API key required' });
  }

  const { image, mimeType, prompt, model: modelId } = req.body;
  if (!image || !mimeType || !prompt) {
    return res.status(400).json({ error: 'image, mimeType, and prompt are required' });
  }

  const ALLOWED_MODELS = {
    'gemini-3.1-flash-image-preview': true,
    'gemini-3-pro-image-preview': true,
  };
  const resolvedModel = ALLOWED_MODELS[modelId] ? modelId : 'gemini-3.1-flash-image-preview';

  // Strip "data:image/jpeg;base64," prefix to get raw base64
  const base64Data = image.replace(/^data:[^;]+;base64,/, '');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: resolvedModel,
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Data } },
    ]);

    const parts = result.response.candidates[0].content.parts;
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      return res.status(500).json({ error: 'No image in Gemini response' });
    }

    res.json({
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      mimeType: imagePart.inlineData.mimeType,
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Generation failed' });
  }
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
