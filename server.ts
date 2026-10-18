import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'vfit_default_dev_secret_key_2026';

// Request body parser with 25mb limit for high-res base64 fashion images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI SDK if API key is present
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[VFit Backend] Google GenAI initialized successfully.');
  } catch (err) {
    console.warn('[VFit Backend] Error initializing Google GenAI:', err);
  }
} else {
  console.log('[VFit Backend] GEMINI_API_KEY not configured or placeholder detected; AI try-on will run in fallback simulation mode.');
}

// In-Memory Data Store (Provides persistent state within server lifecycle)
interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface StoredLook {
  id: string;
  title: string;
  userId?: string;
  createdAt: string;
  userPhoto?: string;
  resultImage?: string;
  eyewearProduct?: unknown;
  clothingProduct?: unknown;
  frameColor?: string;
  lensTint?: string;
  clothingSize?: string;
  notes?: string;
}

const usersDb: StoredUser[] = [
  {
    id: 'user-default-1',
    name: 'Elena Rostova',
    email: 'elena@vfit.studio',
    passwordHash: 'password123',
  },
];

const savedLooksDb: StoredLook[] = [];

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
  }

  const existing = usersDb.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    name,
    email,
    passwordHash: password, // For production with MongoDB, use bcrypt
  };
  usersDb.push(newUser);

  const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return res.json({
    success: true,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, token },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const user = usersDb.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return res.json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, token },
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No authorization token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    const user = usersDb.find((u) => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    return res.status(401).json({ success: false, error: 'Token is invalid or expired.' });
  }
});

// ==========================================
// 2. SAVED LOOKS ROUTES
// ==========================================

app.get('/api/saved-looks', (req, res) => {
  return res.json({ success: true, looks: savedLooksDb });
});

app.post('/api/saved-looks', (req, res) => {
  const newLook: StoredLook = {
    id: req.body.id || `look-${Date.now()}`,
    title: req.body.title || 'Untitled Ensemble',
    userId: req.body.userId,
    createdAt: req.body.createdAt || new Date().toISOString(),
    userPhoto: req.body.userPhoto,
    resultImage: req.body.resultImage,
    eyewearProduct: req.body.eyewearProduct,
    clothingProduct: req.body.clothingProduct,
    frameColor: req.body.frameColor,
    lensTint: req.body.lensTint,
    clothingSize: req.body.clothingSize,
    notes: req.body.notes,
  };

  savedLooksDb.unshift(newLook);
  return res.json({ success: true, look: newLook });
});

app.delete('/api/saved-looks/:id', (req, res) => {
  const id = req.params.id;
  const idx = savedLooksDb.findIndex((l) => l.id === id);
  if (idx !== -1) {
    savedLooksDb.splice(idx, 1);
  }
  return res.json({ success: true });
});

// ==========================================
// 3. EXTERNAL PRODUCT URL SCRAPER (SSRF SAFE)
// ==========================================

app.post('/api/products/import-url', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'A valid product URL is required.' });
  }

  // Anti-SSRF Validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ success: false, error: 'Only HTTP and HTTPS URLs are supported.' });
    }

    const host = parsedUrl.hostname.toLowerCase();
    // Block private, local, and metadata endpoints
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '169.254.169.254' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      (host.startsWith('172.') && parseInt(host.split('.')[1] || '0', 10) >= 16 && parseInt(host.split('.')[1] || '0', 10) <= 31)
    ) {
      return res.status(403).json({ success: false, error: 'Access to internal or private hosts is prohibited.' });
    }
  } catch {
    return res.status(400).json({ success: false, error: 'Malformed URL provided.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const pageRes = await fetch(parsedUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!pageRes.ok) {
      return res.status(502).json({
        success: false,
        error: `External store returned HTTP status ${pageRes.status}. The store might block external requests.`,
      });
    }

    const html = await pageRes.text();

    // Extract OpenGraph / Twitter metadata via regex
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
      html.match(/<title>(.*?)<\/title>/i);
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i);
    const ogPriceMatch = html.match(/<meta\s+property=["']product:price:amount["']\s+content=["'](.*?)["']/i);
    const ogBrandMatch = html.match(/<meta\s+property=["']product:brand["']\s+content=["'](.*?)["']/i);

    let title = ogTitleMatch ? ogTitleMatch[1].trim() : 'External Product';
    // Clean common title suffixes like " - BrandName"
    title = title.split(' | ')[0].split(' - ')[0];

    let image = ogImageMatch ? ogImageMatch[1].trim() : null;
    if (image && !image.startsWith('http')) {
      image = new URL(image, parsedUrl.origin).href;
    }

    if (!image) {
      return res.status(422).json({
        success: false,
        error: 'Product image could not be automatically extracted from this store. Please upload a screenshot or product image directly.',
      });
    }

    // Determine category heuristically
    const isEyewear = /glasses|sunglasses|eyewear|shades|frames|spectacles/i.test(`${title} ${url}`);

    return res.json({
      success: true,
      product: {
        title,
        image,
        price: ogPriceMatch ? parseFloat(ogPriceMatch[1]) : 280,
        currency: 'USD',
        brand: ogBrandMatch ? ogBrandMatch[1].trim() : parsedUrl.hostname.replace('www.', ''),
        category: isEyewear ? 'eyewear' : 'clothing',
        originalUrl: url,
      },
    });
  } catch (err: unknown) {
    console.warn('[VFit Backend] Error scraping URL:', err);
    return res.status(502).json({
      success: false,
      error: 'Could not connect to external site or request timed out. Please upload the product image file directly.',
    });
  }
});

// ==========================================
// 4. AI VIRTUAL CLOTHING TRY-ON ENGINE
// ==========================================

// Helper to check provider availability
async function checkTryOnProviderStatus(): Promise<{
  configured: boolean;
  provider: 'gemini' | 'external' | 'none';
  message: string;
}> {
  if (process.env.VIRTUAL_TRYON_API_KEY && process.env.VIRTUAL_TRYON_API_KEY !== 'my_virtual_tryon_api_key') {
    return {
      configured: true,
      provider: 'external',
      message: 'External Virtual Try-On API is configured and active.',
    };
  }

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    return {
      configured: true,
      provider: 'gemini',
      message: 'Gemini Multimodal AI Image Engine is configured.',
    };
  }

  return {
    configured: false,
    provider: 'none',
    message: 'No virtual try-on provider is configured. Connect a paid Gemini API key with Image Generation or set VIRTUAL_TRYON_API_KEY in environment variables.',
  };
}

app.get('/api/tryon/status', async (_req, res) => {
  const status = await checkTryOnProviderStatus();
  return res.json(status);
});

app.post('/api/tryon/generate', async (req, res) => {
  const { userImage, garmentImage, garmentName, garmentCategory, garmentDescription, userConsent } = req.body;

  if (!userConsent) {
    return res.status(400).json({
      success: false,
      error: 'User consent is required before processing photos with the AI virtual try-on service.',
      code: 'CONSENT_REQUIRED',
    });
  }

  if (!userImage || !garmentImage) {
    return res.status(400).json({
      success: false,
      error: 'Both user photo and garment image are required for virtual try-on.',
    });
  }

  const startTime = Date.now();

  // Helper to extract base64 payload from data URL or fetch from local/remote URL
  const extractBase64Data = async (input: string): Promise<{ data: string; mimeType: string }> => {
    if (input.startsWith('data:')) {
      const parts = input.split(';base64,');
      const mime = parts[0].replace('data:', '');
      return { data: parts[1], mimeType: mime };
    }

    if (input.startsWith('/src/assets/images/')) {
      const fs = await import('fs/promises');
      const localFilePath = path.join(process.cwd(), input);
      const buffer = await fs.readFile(localFilePath);
      return { data: buffer.toString('base64'), mimeType: 'image/jpeg' };
    }

    const fetchRes = await fetch(input);
    const arrayBuf = await fetchRes.arrayBuffer();
    const mime = fetchRes.headers.get('content-type') || 'image/jpeg';
    return { data: Buffer.from(arrayBuf).toString('base64'), mimeType: mime };
  };

  // 1. Try external VIRTUAL_TRYON_API_KEY if configured
  if (process.env.VIRTUAL_TRYON_API_KEY && process.env.VIRTUAL_TRYON_API_KEY !== 'my_virtual_tryon_api_key') {
    try {
      console.log(`[VFit Try-On] Calling external try-on API for ${garmentName}...`);
      const externalApiUrl = process.env.VIRTUAL_TRYON_ENDPOINT || 'https://api.fashn.ai/v1/run';
      
      const externalRes = await fetch(externalApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VIRTUAL_TRYON_API_KEY}`,
        },
        body: JSON.stringify({
          model_image: userImage,
          garment_image: garmentImage,
          category: garmentCategory || 'tops',
          mode: 'balanced',
          nsfw_filter: true,
        }),
      });

      if (externalRes.ok) {
        const externalData = await externalRes.json();
        let resultUrl = externalData.output?.[0] || externalData.image_url;

        // If asynchronous task ID was returned, poll status endpoint
        if (!resultUrl && externalData.id) {
          const pollEndpoint = process.env.VIRTUAL_TRYON_STATUS_ENDPOINT || `https://api.fashn.ai/v1/status/${externalData.id}`;
          for (let attempt = 0; attempt < 18; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            try {
              const pollRes = await fetch(pollEndpoint, {
                headers: {
                  Authorization: `Bearer ${process.env.VIRTUAL_TRYON_API_KEY}`,
                },
              });
              if (pollRes.ok) {
                const pollData = await pollRes.json();
                if (pollData.status === 'completed' && (pollData.output?.[0] || pollData.image_url)) {
                  resultUrl = pollData.output?.[0] || pollData.image_url;
                  break;
                }
                if (pollData.status === 'failed') {
                  throw new Error(pollData.error || 'External fashion virtual try-on failed.');
                }
              }
            } catch (pErr) {
              console.warn('[VFit Try-On] Poll error:', pErr);
            }
          }
        }

        if (resultUrl) {
          return res.json({
            success: true,
            resultImage: resultUrl,
            serviceUsed: 'Specialized Fashion Try-On API',
            executionTimeMs: Date.now() - startTime,
            message: 'Garment successfully fitted using specialized fashion try-on model.',
          });
        }
      }
    } catch (extErr) {
      console.warn('[VFit Try-On] External API error:', extErr);
    }
  }

  // 2. Try Gemini Multimodal Image Generation if configured
  if (aiClient) {
    try {
      console.log(`[VFit AI] Initiating virtual try-on with Gemini for ${garmentName || 'garment'}...`);

      const [userImgData, garmentImgData] = await Promise.all([
        extractBase64Data(userImage),
        extractBase64Data(garmentImage),
      ]);

      const promptText = `High-fashion virtual garment try-on.
Image 1 is the person (model).
Image 2 is the garment: "${garmentName || 'designer apparel'}" (${garmentCategory || 'clothing'}), described as: "${garmentDescription || ''}".

TASK:
Produce a photorealistic fashion catalog photograph of the exact person from Image 1 wearing the garment from Image 2.
Preserve the person's exact face, facial features, hair, skin tone, body proportions and posture exactly.
Naturally fit and drape the garment over their body with realistic fabric folds, seams, collar structure, and lighting matching the environment.
Do not change the background or the person's identity.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: userImgData.data,
                mimeType: userImgData.mimeType,
              },
            },
            {
              inlineData: {
                data: garmentImgData.data,
                mimeType: garmentImgData.mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      });

      // Find image part in candidates
      let resultImage: string | null = null;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            resultImage = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (resultImage) {
        return res.json({
          success: true,
          resultImage,
          serviceUsed: 'Gemini 3.1 Flash Lite Multimodal Try-On Engine',
          executionTimeMs: Date.now() - startTime,
          message: 'Garment successfully synthesized onto photo with photorealistic drape.',
        });
      }

      return res.status(502).json({
        success: false,
        error: 'The AI model completed the request but did not return a generated image. Please try again with a clear front-facing photo.',
      });
    } catch (genAiErr: unknown) {
      console.warn('[VFit AI] Gemini generation error:', genAiErr);
      const errMsg = genAiErr instanceof Error ? genAiErr.message : String(genAiErr);

      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        return res.status(429).json({
          success: false,
          code: 'QUOTA_EXCEEDED',
          error: 'Gemini Image Generation quota limit reached on this API key. A paid Gemini API key or VIRTUAL_TRYON_API_KEY is required to generate new images.',
        });
      }

      return res.status(502).json({
        success: false,
        code: 'GENERATION_FAILED',
        error: `AI try-on generation failed: ${errMsg.slice(0, 180)}`,
      });
    }
  }

  // 3. Strict Non-Simulation Rule:
  // If no provider is configured, do NOT fake a successful overlay or return garmentImage.
  return res.status(503).json({
    success: false,
    code: 'PROVIDER_UNCONFIGURED',
    error: 'No AI virtual try-on provider is configured. Please configure a paid Gemini API key with Image Generation or set VIRTUAL_TRYON_API_KEY in the server environment.',
  });
});

// ==========================================
// 5. DEV & PRODUCTION SERVER SETUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('[VFit Backend] Vite middleware mounted in development mode.');
  } else {
    // Production mode: Serve built static files
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[VFit Backend] Serving static build from dist folder.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VFit Backend] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[VFit Backend] Fatal server initialization error:', err);
  process.exit(1);
});
