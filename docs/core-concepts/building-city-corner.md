---
title: 搭建城市一角
order: 2
group:
  title: 核心概念
  order: 2
---

# 搭建城市一角

通过搭建一个城市场景，练习和学习 **几何体组合**、**光照与阴影**、**场景布局**。

## 在线 Demo

<code src="../../city-corner/index.tsx"></code>

## 场景设计

### 地面

使用 `PlaneGeometry` 铺设草地，为后续建筑提供平面参考。

### 建筑群（待实现）

用若干 `BoxGeometry` 组合搭建高低错落的建筑，排列在道路两侧：

- 建筑主体：不同高度、宽度的长方体
- 材质：`MeshStandardMaterial`，各建筑不同颜色
- 阴影：`castShadow` + `receiveShadow`

### 道路（待实现）

十字网格状道路系统：
- 细长 `PlaneGeometry` / `BoxGeometry` 铺设
- 灰色沥青材质
- 白色虚线车道线

### 光照

| 光源 | 类型 | 作用 |
|------|------|------|
| `AmbientLight(0xffffff, 0.5)` | 环境光 | 模拟大气散射，均匀照亮阴影区域 |
| `DirectionalLight(0xffffff, 1.2)` | 方向光（太阳） | 产生明暗关系和阴影 |

### 相机视角

从斜上方俯瞰（`position: (20, 15, 25)`），便于观察建筑群的整体布局。

## 涉及的知识点

- `PlaneGeometry` 和 `BoxGeometry` 的组合使用
- `MeshStandardMaterial` 的 `roughness`、`color` 属性
- 阴影系统：`castShadow`、`receiveShadow`、`shadowMap`
- `DirectionalLight` 的阴影相机参数配置
- 场景空间布局与坐标规划
