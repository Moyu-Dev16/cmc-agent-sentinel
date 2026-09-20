import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/cmc-agent-sentinel/',
  server: {
    port: 5174,
  },
});
