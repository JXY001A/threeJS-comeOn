import * as THREE from "three";

/**
 * 创建自定义三维坐标系
 * @param {number} size     - 每条轴从原点到箭头的长度
 * @param {THREE.Scene} scene - 要添加到的场景
 */
export function createCoordinateSystem(size = 5, scene: THREE.Scene) {
    // ========================================
    // X 轴（红色）—— 正半轴 + 负半轴
    // ========================================
    const xAxisGroup = new THREE.Group();

    // 正半轴：从原点指向 +X 的线段
    const xPos = createAxisSegment(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(size, 0, 0),
        0xff0000, // 红色
    );
    xAxisGroup.add(xPos);

    // 箭头（正半轴末端）
    const xArrow = createArrowHead(
        new THREE.Vector3(size, 0, 0),
        new THREE.Vector3(1, 0, 0), // 指向 +X
        0xff0000,
    );
    xAxisGroup.add(xArrow);

    // 负半轴：从原点指向 -X 的虚线（较暗）
    const xNeg = createAxisSegment(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-size, 0, 0),
        0x880000, // 暗红色
    );
    xAxisGroup.add(xNeg);

    // X 轴标签
    const xLabel = createLabel(
        "+X",
        0xff0000,
        new THREE.Vector3(size + 0.5, 0.2, 0),
    );
    xAxisGroup.add(xLabel);

    scene.add(xAxisGroup);

    // ========================================
    // Y 轴（绿色）—— 正半轴 + 负半轴
    // ========================================
    const yAxisGroup = new THREE.Group();
    yAxisGroup.add(
        createAxisSegment(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, size, 0),
            0x00ff00,
        ),
    );
    yAxisGroup.add(
        createArrowHead(
            new THREE.Vector3(0, size, 0),
            new THREE.Vector3(0, 1, 0),
            0x00ff00,
        ),
    );
    yAxisGroup.add(
        createAxisSegment(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -size, 0),
            0x008800,
        ),
    );
    yAxisGroup.add(
        createLabel("+Y", 0x00ff00, new THREE.Vector3(0.2, size + 0.5, 0)),
    );
    scene.add(yAxisGroup);

    // ========================================
    // Z 轴（蓝色）—— 正半轴 + 负半轴
    // 右手系：+Z 指向观察者（屏幕外）
    // ========================================
    const zAxisGroup = new THREE.Group();
    zAxisGroup.add(
        createAxisSegment(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, size),
            0x0000ff,
        ),
    );
    zAxisGroup.add(
        createArrowHead(
            new THREE.Vector3(0, 0, size),
            new THREE.Vector3(0, 0, 1),
            0x0000ff,
        ),
    );
    zAxisGroup.add(
        createAxisSegment(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -size),
            0x000088,
        ),
    );
    zAxisGroup.add(
        createLabel("+Z", 0x0000ff, new THREE.Vector3(0.2, 0.2, size + 0.5)),
    );
    scene.add(zAxisGroup);
}

// ============================================
// 辅助函数：创建一条线段（从 A 到 B）
// ============================================
export function createAxisSegment(
    start: THREE.Vector3,
    end: THREE.Vector3,
    colorHex: number,
) {
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: colorHex });
    return new THREE.Line(geometry, material);
}

// ============================================
// 辅助函数：创建圆锥箭头（位于 tip 位置，指向 direction）
// ============================================
export function createArrowHead(
    tip: THREE.Vector3,
    direction: THREE.Vector3,
    colorHex: number,
) {
    const arrowLength = 0.4;
    const arrowRadius = 0.1;
    const geometry = new THREE.ConeGeometry(arrowRadius, arrowLength, 8);
    const material = new THREE.MeshBasicMaterial({ color: colorHex });
    const cone = new THREE.Mesh(geometry, material);

    // 默认圆锥尖朝 +Y，旋转到目标方向
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize(),
    );
    cone.setRotationFromQuaternion(quaternion);

    // 把圆锥的底部放在 tip 位置，让尖端指向外
    cone.position.copy(tip);
    return cone;
}

// ============================================
// 辅助函数：创建文字标签（Sprite）
// ============================================
export function createLabel(text: string, colorHex: number, position: THREE.Vector3) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法获取 Canvas 2D 上下文");
    ctx.fillStyle = "#" + colorHex.toString(16).padStart(6, "0");
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,
        depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(1, 1, 1);
    return sprite;
}

// ============================================
// 辅助函数：刻度网格（XZ 平面）
// ============================================
export function createGrid(size = 5, divisions = 10, scene: THREE.Scene) {
    const gridHelper = new THREE.GridHelper(
        size * 2,
        divisions,
        0x444444,
        0x222222,
    );
    gridHelper.position.y = -0.01; // 稍微低于原点，避免遮挡轴线
    scene.add(gridHelper);
}
