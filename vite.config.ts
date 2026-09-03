import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import app from './src/backend/index';

// Vite Plugin to embed Hono backend directly into Vite dev server
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'hono-backend-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api')) {
            const url = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);
            let body: string | undefined = undefined;
            
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              const buffers: Buffer[] = [];
              for await (const chunk of req) {
                buffers.push(chunk as Buffer);
              }
              body = Buffer.concat(buffers).toString('utf-8');
            }

            const headers = new Headers();
            for (const [key, val] of Object.entries(req.headers)) {
              if (Array.isArray(val)) {
                val.forEach(v => headers.append(key, v));
              } else if (val) {
                headers.append(key, val);
              }
            }

            const request = new Request(url.toString(), {
              method: req.method,
              headers,
              body: body ? body : undefined
            });

            try {
              const response = await app.fetch(request, {});
              res.statusCode = response.status;
              response.headers.forEach((val, key) => {
                res.setHeader(key, val);
              });
              const arrayBuffer = await response.arrayBuffer();
              res.end(Buffer.from(arrayBuffer));
              return;
            } catch (err: any) {
              console.error('[Hono Dev Middleware Error]', err);
            }
          }
          next();
        });
      }
    }
  ]
});
