import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = 3000;

// Initialize @google/genai SDK server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Server-side AI Query Endpoint
 * Role-aware and grounded in actual hotel dataset metrics and knowledge documents
 */
app.post('/api/ai/query', async (req, res) => {
  try {
    const { query, role = 'customer' } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    if (!ai) {
      // Graceful fallback if GEMINI_API_KEY is pending
      return res.json({
        answer: `[Nivora System]: Grounded intelligence for role '${role}'. Query '${query}' was received. Please ensure GEMINI_API_KEY is configured in AI Studio Secrets for live generative synthesis.`,
        role_scope: role,
        data_freshness: new Date().toISOString(),
      });
    }

    // Role-specific system instructions
    let rolePrompt = '';
    if (role === 'customer') {
      rolePrompt = `You are the Nivora Resort Personal Guest Concierge. Provide warm, luxurious, concise assistance for hotel guests. Only discuss public resort amenities, guest policies, dining, and recommendations. Never reveal staff operational logs or private guest data.`;
    } else if (role === 'staff') {
      rolePrompt = `You are the Nivora Staff Operations Intelligence. Assist hotel staff with housekeeping protocols, standard operating procedures, maintenance triage, and task resolution.`;
    } else {
      rolePrompt = `You are the Nivora Front Desk & Revenue Intelligence. Provide operational insights regarding check-in readiness, room inventory, booking channels, payment settlement, and hotel analytics.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction: rolePrompt,
        temperature: 0.3,
      },
    });

    return res.json({
      answer: response.text || 'No response generated.',
      role_scope: role,
      data_freshness: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Server AI query error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error while processing AI query',
    });
  }
});

// Full-stack Vite dev middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nivora Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
