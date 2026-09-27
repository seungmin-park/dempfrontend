import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    envPrefix: ['VITE_', 'VUE_APP_'],
    server: {
      port: 5050,
      strictPort: true,
      proxy: { '/api': { target: env.DEV_API_TARGET || 'http://localhost:8080', changeOrigin: true } },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['tests/unit/**/*.spec.js'],
      setupFiles: ['./tests/setup.js'],
    },
  };
});
