import { defineConfig } from 'dumi';

export default defineConfig({
  title: 'Three.js 学习笔记',
  outputPath: 'docs-dist',
  alias: {
    '@': './',
  },
  themeConfig: {
    name: 'Three.js 学习',
    logo: false,
    nav: [
      { title: '核心概念', link: '/core-concepts/scene-camera-renderer' },
      { title: '搭建城市一角', link: '/core-concepts/building-city-corner' },
      { title: '相机与控制器的深度实验', link: '/core-concepts/camera-controller-experiment' },
      { title: '建筑物体贴图', link: '/core-concepts/building-texture' }
    ],
  },
});
