---
title: 场景、相机、渲染器
order: 1
group:
  title: 核心概念
  order: 1
---

# 场景(Scene)、相机(Camera)、渲染器(Renderer)

Three.js 的三要素：**场景**、**相机**、**渲染器**，构成了所有 3D 应用的基础。

## 在线 Demo

<code src="../../scene-camera-renderer/index.tsx"></code>

## 核心概念

### Scene（场景）

场景是所有 3D 物体的容器。你可以把它想象成一个**舞台**，所有物体、光源都要添加到场景中才能被渲染。

```typescript
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);
```

### Camera（相机）

相机决定了**从哪个角度观察场景**。`PerspectiveCamera`（透视相机）模拟人眼效果——近大远小。

```typescript
const camera = new THREE.PerspectiveCamera(
  75,                                    // 视野角度（FOV）
  window.innerWidth / window.innerHeight, // 宽高比（aspect）
  0.1,                                   // 近裁剪面（near）
  1000,                                  // 远裁剪面（far）
);
camera.position.z = 5;
```

参数说明：
| 参数 | 说明 | 默认建议 |
|------|------|---------|
| FOV | 视野角度，度数 | 45~75 |
| aspect | 宽高比 | 通常用窗口宽/高 |
| near | 近裁剪面 | 0.1 |
| far | 远裁剪面 | 1000 |

### Renderer（渲染器）

渲染器将场景和相机结合起来，输出到 `<canvas>` 元素上。

```typescript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
```

### 动画循环

通过 `requestAnimationFrame` 实现连续渲染，让物体动起来。

```typescript
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
```

## 总结

| 要素 | 类比 | 职责 |
|------|------|------|
| Scene | 舞台 | 存放所有物体、光源 |
| Camera | 摄像机 | 定义观察视角 |
| Renderer | 放映机 | 把画面绘制到屏幕上 |

> 三者缺一不可。**Scene** 装东西，**Camera** 选角度，**Renderer** 出画面。
