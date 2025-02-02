import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      // Externalize LangChain dependencies
      external: [
        'langchain/tools',
        'langchain/chains',
        'langchain/chat_models/openai',
        'langchain/memory',
        'langchain/prompts',
        'langchain/schema'
      ]
    }
  }
});