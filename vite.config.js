////import { defineConfig } from 'vite'
////import react from '@vitejs/plugin-react'
////
////// https://vite.dev/config/
////export default defineConfig({
////  plugins: [react()],
////})
//import { defineConfig } from 'vite'
//import react from '@vitejs/plugin-react'
//
//export default defineConfig({
//  plugins: [react()],
//  server: {
//    host: true,
//    port: 5173,
//    proxy: {
//      '/api': {
//        target: 'https://menu-b-f5se.onrender.com',
//        changeOrigin: true,
//        secure: false
//      }
//    }
//  }
//})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // No proxy needed when using direct URL
  }
})