import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [sveltekit()],
  // Bundle Human's official, dependency-free matching module on the server.
  // Avoid loading native TensorFlow: inference remains in the browser.
  resolve: { alias: { 'human-match': fileURLToPath(new URL('./node_modules/@vladmandic/human/src/face/match.ts', import.meta.url)) } },
  ssr: { noExternal: ['human-match'] }
});
