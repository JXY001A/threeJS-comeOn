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

#### 近裁剪面（near）与远裁剪面（far）详解

`near` 和 `far` 定义了相机**能看到多近和多远**。只有位于 `near` 和 `far` 之间的物体才会被渲染，之外的物体会被裁剪掉（不绘制）。

```
       near                   far
  ──────┼──────────────────────┼──────▶
  相机   │    可见区域（被渲染）   │
 位置  0.1                   1000
  （裁剪掉）                 （裁剪掉）
```

- **near（近裁剪面）**：相机镜头前方最近能看到多远。小于此距离的物体会被裁掉。
  - 值过小（如 `0.0001`）：导致**深度冲突**（z-fighting），远近物体重叠闪烁。
  - 值过大（如 `10`）：离相机近的物体会被裁掉，看起来像是"穿模"了。

- **far（远裁剪面）**：相机能看到的最远距离。超出此距离的物体会消失。
  - 值过大（如 `100000`）：降低深度缓冲区精度，同样会引发 z-fighting。
  - 值过小（如 `50`）：远处的物体会突然消失，出现"远景裁剪"现象。

> 经验法则：`near` 设大一点（`0.1`~`1`），`far` 不要太夸张（`1000`~`5000`），两者比值控制在 `10000` 以内以保证深度精度。

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
