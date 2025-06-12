// Development server to test API routes locally
// Run with: node dev-server.js

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import your API handlers
import shortenHandler from './api/shorten.js';
import redirectHandler from './api/s/[id].js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001; // Different from Vite's 5173

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/shorten', async (req, res) => {
  await shortenHandler(req, res);
});

app.get('/s/:id', async (req, res) => {
  req.query = { id: req.params.id };
  await redirectHandler(req, res);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Dev server running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Dev API server running on http://localhost:${PORT}`);
  console.log(`Test with: curl -X POST http://localhost:${PORT}/api/shorten -H "Content-Type: application/json" -d '{"url":"test"}'`);
}); 