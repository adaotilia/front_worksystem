import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Betöltjük a környezeti változókat (pl. .env, .env.production)
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [sveltekit()],
    server: {
      port: 5050,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
        },
        '/Checkpoint': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
        },
        '/Admin': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
        },
        '/Manager': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
        },
        '/Employee': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
