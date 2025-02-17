import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // 主进程入口文件路径，根据你的实际情况修改
        entry: './main.js', 
        onstart(options) {
          // 启动 Electron 应用
          options.startup(); 
        },
        vite: {
          build: {
            // 输出目录，可根据需要调整
            outDir: 'dist-electron/main', 
            minify: false,
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer({
      resolve: {
        // 可以在这里添加需要解析的模块
      },
    }),
  ],
  server: {
    port: '9090',
    proxy: {
      '/api': {
        target: 'http://localhost:8080/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // 不可以省略rewrite
      }
    }
  }
})
