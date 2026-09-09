import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/v1/models': {
        target: 'http://127.0.0.1:1234',
        changeOrigin: true,
      },
      '/agent-proxy/v1/chat/completions': {
        target: 'http://127.0.0.1:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace('/agent-proxy', ''),
      },
    },
  },
});
