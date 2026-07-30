import * as THREE from 'three'
import { useEffect, useRef } from 'react'

/**
 * 初始化 3D 场景，挂载到指定容器中
 * @param container 挂载 canvas 的容器元素
 */
export function initScene(container: HTMLElement): void {
  // 创建场景
  const scene = new THREE.Scene();
  // scene.background = new THREE.Color("plum");

  // 创建透视相机（符合人眼体验）
  // 75: 视野角度，container.clientWidth / container.clientHeight: 宽高比，0.1: 近裁剪面，1000: 远裁剪面
  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );
  // 相机位置，z轴方向偏移5
  camera.position.z = 2;

  // 创建渲染器
  // antialias: 抗锯齿
  const renderer = new THREE.WebGLRenderer({ antialias: true })

  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // 创建一个立方体几何体
  const geometry = new THREE.BoxGeometry();
  // 创建一个基础材质
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

  // 创建一个网格对象
  // 网格对象由几何体和材质组成
  const cube = new THREE.Mesh(geometry, material);
  // 将网格对象添加到场景中
  scene.add(cube);

  // 创建动画循环，实现旋转效果
  // requestAnimationFrame: 请求动画帧，自动处理浏览器渲染帧率
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}

// ==================== dumi 文档嵌入组件 ====================
// 此组件直接使用上面的 initScene 渲染，不重复写 Three.js 逻辑
const SceneDemo = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    initScene(containerRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 400 }}
    />
  );
};

export default SceneDemo;
