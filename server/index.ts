import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Safari-specific CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Enable aggressive compression for faster responses
import compression from "compression";
const enableCompression = process.env.ENABLE_COMPRESSION !== 'false';
if (enableCompression) {
  console.log('Compression enabled for faster response delivery');
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req: any, res: any) => {
      return compression.filter(req, res) || res.getHeader('content-type')?.includes('application/json');
    }
  }));
}

app.use(express.json({ 
  limit: '10mb',
  strict: false // Allow Safari's less strict JSON parsing
}));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve static assets from both attached_assets and public/attached_assets folders
// This ensures compatibility between development and deployed environments
app.use('/@assets', express.static(join(__dirname, '..', 'attached_assets')));
app.use('/@assets', express.static(join(__dirname, '..', 'public', 'attached_assets')));

// Serve all public assets (including somm-logo.png)
app.use(express.static(join(__dirname, '..', 'public')));

// Serve food category images
app.use('/food-categories', express.static(join(__dirname, '..', 'public', 'food-categories')));

// Serve wine type images
app.use('/wine-types', express.static(join(__dirname, '..', 'public', 'wine-types')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "127.0.0.1"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
