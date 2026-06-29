import { defineConfig } from 'vitest/config'; // <- Wichtig: Aus 'vitest/config' importieren!
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});

