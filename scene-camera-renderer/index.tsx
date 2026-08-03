import * as THREE from 'three'
import { useEffect, useRef } from 'react'


/**
 * 初始化 3D 场景，挂载到指定容器中
 * @param container 挂载 canvas 的容器元素
 */
export function initScene(container: HTMLElement) {
  // 创建场景
  const scene = new THREE.Scene();
  // 设置场景背景颜色
  // scene.background = new THREE.Color('steelblue')

  // 创建透视相机（符合人眼体验）
  // 75: 视野角度，container.clientWidth / container.clientHeight: 宽高比，0.1: 近裁剪面，1000: 远裁剪面
  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );
  // 相机位置
  camera.position.set(0, 0, 4);
  // 看向位置
  camera.lookAt(0, 0, 0);

  // 创建渲染器
  // antialias: 抗锯齿
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  // 设置渲染器像素比
  renderer.setPixelRatio(window.devicePixelRatio);  // Retina 屏适配
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // 创建一个立方体几何体
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // 创建一个基础材质,基础材质不需要光源
  // const material = new THREE.MeshBasicMaterial({ 
  //   color: 0x00ff00,
  // });
  const material = new THREE.MeshStandardMaterial({ 
    // color: 0xe74c3c,
    color: 0x3498db,
    // 光泽度
    roughness: 0.5,
    // 金属度
    metalness: 0.1,
  });
  // 创建一个网格对象
  // 网格对象由几何体和材质组成
  const cube = new THREE.Mesh(geometry, material);
  // 将网格对象添加到场景中
  scene.add(cube);

  // 添加环境光，均匀照亮场景：只有环境光源的情况下只能均匀的看清，缺乏主次
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // 环境光：均匀照亮
  scene.add(ambientLight);

  // 方向光：从一个方向照亮，光源会改变物体的明暗，光源颜色不同也会影响物体的色彩
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(15, 0, 5);
  scene.add(directionalLight);

  // 创建动画循环，实现旋转效果
  // requestAnimationFrame: 请求动画帧，自动处理浏览器渲染帧率
  function animate() {
    requestAnimationFrame(animate);
    // cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    cube.rotation.z += 0.01;
    renderer.render(scene, camera);
  }
  const handleResize = () => {
    // 更新相机宽高比
    camera.aspect = container.clientWidth / container.clientHeight;
    // 更新相机投影矩阵
    camera.updateProjectionMatrix();
    // 更新渲染器尺寸
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  animate();
  // 窗口自适应变化

  window.addEventListener('resize', handleResize);

  // 返回卸载 resize 事件的函数
  return () => {
    return window.removeEventListener('resize', handleResize);
  };
}

// ==================== dumi 文档嵌入组件 ====================
// 此组件直接使用上面的 initScene 渲染，不重复写 Three.js 逻辑
const SceneDemo = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    return initScene(containerRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 400 }}
    />
  );
};

export default SceneDemo;
