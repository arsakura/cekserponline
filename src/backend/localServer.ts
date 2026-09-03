import { serve } from '@hono/node-server';
import app from './index';

const port = 8787;
console.log(`[CekSERP Worker Backend] Running locally on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
