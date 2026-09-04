import { serve } from '@hono/node-server';
import app from './index';

const port = 8787;
const hostname = '0.0.0.0';

console.log(`[CekSERP Worker Backend] Running on http://0.0.0.0:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname
});
