declare const Deno: any;

import app from './index';

// Deno Deploy Entrypoint Server
const port = Number(Deno.env.get('PORT')) || 8000;

console.log(`🚀 Cek SERP Online Deno Deploy Server starting on port ${port}...`);

Deno.serve({
  port,
  handler: app.fetch
});
