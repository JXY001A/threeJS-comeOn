import { defineConfig } from 'dumi';

export default defineConfig({
  title: 'Three.js 学习笔记',
  outputPath: 'docs-dist',
  themeConfig: {
    name: 'Three.js 学习',
    logo: false,
    nav: [
      { title: '核心概念', link: '/core-concepts/scene-camera-renderer' }
    ],
  },
});
