import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O protótipo é auto-contido e reutiliza as dependências instaladas na raiz do
// repositório (react, react-dom, recharts, vite). Não tem backend nem base de dados.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5180,
    host: '0.0.0.0',
    open: false,
    // Em desenvolvimento a votação em directo fala com o servidor da assembleia
    // (`npm run servidor`, porta 5190). Em produção é o mesmo processo que serve
    // a aplicação e a API, por isso não é preciso proxy nenhum.
    proxy: {
      '/api': {
        target: process.env.SGC_SERVIDOR ?? 'http://127.0.0.1:5190',
        changeOrigin: true,
        // O canal de eventos é um fluxo aberto: não pode ser guardado em buffer.
        configure: (proxy) => {
          proxy.on('proxyRes', (res) => { res.headers['x-accel-buffering'] = 'no'; });
        },
      },
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Separa os gráficos do resto: o primeiro ecrã não espera pelo Recharts.
    rollupOptions: {
      output: {
        manualChunks: { graficos: ['recharts'] },
      },
    },
  },
});
