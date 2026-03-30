import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({mode})=>{

  const env = loadEnv(mode, process.cwd(), '')

  return {  
        plugins: [
        react(),
        tailwindcss(),
      ],
      server:{
        host: true,
        port: 5173,
        watch: {
          usePolling: true
        },

        proxy:{
          '/backend':{
            target: env.VITE_API_PROXY_URL,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/backend/, '')
          },
          '/ws':{
            target: env.VITE_CHATS_WEBSOCKET_PROXY_URL,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/ws/, ''),
            ws:true
          },
          '/socket.io': {
            target: 'https://localhost:8080',
            changeOrigin: true,
            ws: true,
            secure: false
          }
        }

      },
    }


})
