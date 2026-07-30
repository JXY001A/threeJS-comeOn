import * as THREE from 'three'

// 创建场景
const scene = new THREE.Scene();

// 创建透视相机（符合人眼体验）
// 75: 视野角度，window.innerWidth / window.innerHeight: 宽高比，0.1: 近裁剪面，1000: 远裁剪面
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 相机位置，z轴方向偏移5
camera.position.z = 5;

// 创建渲染器
// antialias: 抗锯齿
const renderer = new THREE.WebGLRenderer({antialias: true})

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建一个立方体几何体
const geometry = new THREE.BoxGeometry();
// 创建一个基础材质
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});

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
