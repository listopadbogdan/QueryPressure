import react from '@vitejs/plugin-react';
import * as path from 'path';
import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5073",
        changeOrigin: true,
        secure: false
      },
    },
  },
  resolve: {
    alias: [
      {find: '@', replacement: path.resolve(__dirname, 'src')},
      {find: '@components', replacement: path.resolve(__dirname, 'src', 'components')},
      {find: '@utils', replacement: path.resolve(__dirname, 'src', 'utils')},
      {find: '@assets', replacement: path.resolve(__dirname, 'src', 'assets')},
      {find: '@models', replacement: path.resolve(__dirname, 'src', 'models')},
      {find: '@api', replacement: path.resolve(__dirname, 'src', 'api')},
      {find: '@services', replacement: path.resolve(__dirname, 'src', 'services')},
    ]
  }
});
