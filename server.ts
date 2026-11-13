import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import type { CardData } from './types';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CustomCardOptions {
  name?: string;
  description?: string;
  stats?: { label: string; value: number }[];
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getErrorStatusAndMessage(error: unknown): { status: number; message: string } {
  if (error instanceof Error) {
    const anyErr = error as Error & { status?: number; code?: number };
    const status =
      typeof anyErr.status === 'number' && anyErr.status >= 400 && anyErr.status < 600
        ? anyErr.status
        : typeof anyErr.code === 'number' && anyErr.code >= 400 && anyErr.code < 600
          ? anyErr.code
          : 500;
    return { status, message: error.message || 'An unexpected server error occurred.' };
  }
  return { status: 500, message: 'An unexpected server error occurred.' };
}

function getThemeArtStyle(theme: string): string {
  switch (theme) {
    case 'Cyberpunk':
      return ' Art style: High-tech, neon lights, futuristic armor, cyberpunk city background, digital art, vibrant cyan and magenta.';
    case 'Fantasy':
      return ' Art style: Oil painting, dungeons and dragons style, magical aura, detailed armor or robes, epic fantasy background.';
    case 'Retro Arcade':
      return ' Art style: 16-bit pixel art, arcade aesthetic, vibrant colors, retro gaming background.';
    case 'Zombie Apocalypse':
      return ' Art style: Gritty, survival horror, tattered clothes, intense atmosphere, dark and moody background.';
    case 'Superhero':
      return ' Art style: Realistic cinematic superhero concept art, highly detailed costume, dramatic lighting, heroic background. Focus on photorealistic facial features within the superhero aesthetic.';
    case 'Sci-Fi':
      return ' Art style: Space opera, sleek futuristic uniforms, starship interior, glowing holograms, clean lines, deep space background.';
    case 'Horror':
      return ' Art style: Dark fantasy horror, shadows, mist, eldritch elements, gloomy, cinematic lighting, haunted atmosphere.';
    case 'Mythology':
      return ' Art style: Divine, ancient god/goddess, ethereal glow, golden ornaments, clouds, mount olympus style, majestic.';
    default:
      return '';
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.post('/api/card/metadata', async (req: Request, res: Response) => {
    try {
      const { base64Image, theme, options } = req.body as {
        base64Image?: string;
        theme?: string;
        options?: CustomCardOptions;
      };

      if (!base64Image || !theme) {
        res.status(400).json({ error: 'base64Image and theme are required.' });
        return;
      }

      const ai = getAiClient();
      const model = 'gemini-2.5-flash';

      let customInstruction = '';
      if (options?.name) {
        customInstruction += `\n- **User Override Name:** Use this exact name: "${options.name}". Do not generate a random name.`;
      }
      if (options?.description) {
        customInstruction += `\n- **User Override Description:** Use this exact description: "${options.description}".`;
      }
      if (options?.stats && options.stats.length > 0) {
        customInstruction += `\n- **User Override Stats:** Include these exact stats in the output: ${JSON.stringify(options.stats)}. Do not add any extra stats.`;
      }

      const systemInstruction = `
    You are a creative game designer for a popular trading card game.
    Analyze the provided image of a person and generate metadata for a trading card based on the theme: "${theme}".
    
    Guidelines:
    - **Name:** Generate a cool, thematic name based on the person's look (e.g., "Kael th Shadow" for Fantasy, "Unit 734" for Cyberpunk).
    - **Title:** A short subtitle (e.g., "Cybernetic Enforcer", "High Mage").
    - **Element:** A thematic element (Fantasy: Fire, Ice; Cyberpunk: Neon, Glitch; Zombie: Decay).
    - **Stats:** Generate exactly 3 stats appropriate for the theme with values between 0-100.${customInstruction ? '' : '\n      - Cyberpunk example: Hacking, Agility, Tech.\n      - Fantasy example: Magic, Strength, Spirit.'}
    - **Description:** A short, fun, 2-sentence "flavor text" or bio.
    - **Rarity:** Choose Common, Rare, Epic, or Legendary based on how "cool" the generated concept is.
    - **Colors:** Suggest hex codes for primary, secondary, accent, and border colors that match the theme and the image colors.

    ${customInstruction}
  `;

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
              { text: `Generate trading card metadata for a ${theme} theme. Ensure exactly 3 stats.` },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              title: { type: Type.STRING },
              element: { type: Type.STRING },
              description: { type: Type.STRING },
              stats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.INTEGER },
                  },
                  required: ['label', 'value'],
                },
              },
              rarity: { type: Type.STRING, enum: ['Common', 'Rare', 'Epic', 'Legendary'] },
              colors: {
                type: Type.OBJECT,
                properties: {
                  primary: { type: Type.STRING },
                  secondary: { type: Type.STRING },
                  accent: { type: Type.STRING },
                  border: { type: Type.STRING },
                },
                required: ['primary', 'secondary', 'accent', 'border'],
              },
            },
            required: ['name', 'title', 'element', 'description', 'stats', 'rarity', 'colors'],
          },
        },
      });

      if (!response.text) {
        res.status(502).json({ error: 'Failed to generate card metadata' });
        return;
      }

      const cardData = JSON.parse(response.text) as CardData;
      res.json(cardData);
    } catch (error: unknown) {
      console.error('Error generating card metadata:', error);
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/card/transform', async (req: Request, res: Response) => {
    try {
      const { base64Image, theme, cardData } = req.body as {
        base64Image?: string;
        theme?: string;
        cardData?: CardData;
      };

      if (!base64Image || !theme || !cardData) {
        res.status(400).json({ error: 'base64Image, theme, and cardData are required.' });
        return;
      }

      const ai = getAiClient();
      const model = 'gemini-2.5-flash-image';

      let prompt = `Transform this person into a ${theme} character named ${cardData.name}, ${cardData.title}.`;
      prompt += getThemeArtStyle(theme);
      prompt +=
        ' CRITICAL: Retain at least 80% of the original facial features and identity. The face must be clearly recognizable as the person in the source image, only adapting the texture and lighting to the style. Do not change the facial structure. High quality, detailed, trading card illustration.';

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
              { text: prompt },
            ],
          },
        ],
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (part) => part.inlineData?.data
      );

      if (!imagePart?.inlineData?.data) {
        res.status(502).json({ error: 'Failed to generate transformed image' });
        return;
      }

      res.json({ imageBase64: imagePart.inlineData.data });
    } catch (error: unknown) {
      console.error('Error transforming card image:', error);
      const { status, message } = getErrorStatusAndMessage(error);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((req: Request, res: Response, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
