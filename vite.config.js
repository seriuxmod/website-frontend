import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/player-directory': {
                target: 'https://search.players.seriuxmod.net',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/player-directory/, '')
            }
        }
    }
});
