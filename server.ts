import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { generateCoachingAdvice } from './src/server/aiHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for AI Coaching recommendations
app.post('/api/ai-recommendations', async (req, res) => {
  try {
    const result = await generateCoachingAdvice(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('API Error in /api/ai-recommendations:', error);
    res.status(500).json({ error: error.message || 'Internal error' });
  }
});

// Serve production static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server listening on http://0.0.0.0:${PORT}`);
});
