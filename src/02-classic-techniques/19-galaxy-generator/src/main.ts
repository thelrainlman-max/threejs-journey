import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

import "./style.css";

/**
 * Base Setup
 */
const gui = new dat.GUI({ width: 320 });
const canvas: HTMLElement = document.querySelector("canvas.webgl")!;
const scene = new THREE.Scene();

// Космический туман для глубокой перспективы
scene.fog = new THREE.FogExp2("#020204", 0.002);

/**
 * High Quality Soft Star Texture
 */
const createStarTexture = () => {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient.addColorStop(0.1, 'rgba(255, 235, 180, 0.9)');
	gradient.addColorStop(0.35, 'rgba(255, 180, 80, 0.25)');
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);

	return new THREE.CanvasTexture(canvas);
};

const starTexture = createStarTexture();

/**
 * Main Golden Galaxy "ЭЛИС" (Изящная, масштабная и идеальная)
 */
const params = {
	count: 450000,        // Высокая плотность для эффекта пышного космического тумана
	size: 0.022,
	radius: 9,
	branches: 2,
	spin: 1.15,
	randomness: 0.65,
	randomnessPower: 3.5,
	inColor: "#fff3cc",  // Благородное светлое золото в центре
	outColor: "#c86e00", // Глубокий янтарно-золотой край
};

let mainGeometry: THREE.BufferGeometry | null = null;
let mainMaterial: THREE.PointsMaterial | null = null;
let mainGalaxy: THREE.Points | null = null;

const generateMainGalaxy = () => {
	if (mainGalaxy !== null) {
		mainGeometry?.dispose();
		mainMaterial?.dispose();
		scene.remove(mainGalaxy);
	}

	mainGeometry = new THREE.BufferGeometry();
	const positions = new Float32Array(params.count * 3);
	const colors = new Float32Array(params.count * 3);

	const inColor = new THREE.Color(params.inColor);
	const outColor = new THREE.Color(params.outColor);

	for (let i = 0; i < params.count; i++) {
		const i3 = i * 3;

		// Плавное распределение по радиусу (сверхплотное ядро и изящно расширяющиеся рукава)
		const radius = Math.pow(Math.random(), 2.4) * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		// Выверенная вертикальная форма (объемный балдж + сужающийся диск)
		const isCore = radius < 1.8;
		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.3);
		
		const heightLimit = isCore ? 1.2 : Math.max(0.1, 1.2 - (radius / params.radius) * 0.9);
		const randomY = (Math.random() - 0.5) * params.randomness * heightLimit;

		const randomZ =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.3);

		positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
		positions[i3 + 1] = randomY;
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

		// Изящный градиент золота
		const mixedColor = inColor.clone();
		mixedColor.lerp(outColor, radius / params.radius);

		const brightness = 0.8 + Math.random() * 0.4;
		colors[i3 + 0] = mixedColor.r * brightness;
		colors[i3 + 1] = mixedColor.g * brightness;
		colors[i3 + 2] = mixedColor.b * brightness;
	}

	mainGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	mainGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

	mainMaterial = new THREE.PointsMaterial({
		size: params.size,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: starTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.88
	});

	mainGalaxy = new THREE.Points(mainGeometry, mainMaterial);
	scene.add(mainGalaxy);
};

generateMainGalaxy();

/**
 * Distant Background Galaxies (Всего 2 далекие изящные сине-фиолетовые спирали)
 */
const distantGroup = new THREE.Group();

const createDistantSpiral = (x: number, y: number, z: number, scale: number, rx: number, ry: number, rz: number) => {
	const count = 30000;
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	const coreColor = new THREE.Color("#e1bee7"); // Мягкий фиолетовый центр
	const armColor = new THREE.Color("#2979ff");  // Сапфирово-синий край

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		const r = Math.pow(Math.random(), 2.2) * scale;
		const angle = r * 1.4 + ((i % 2) * Math.PI);

		const randomOffset = (Math.random() - 0.5) * r * 0.2;

		pos[i3] = Math.cos(angle) * r + randomOffset;
		pos[i3 + 1] = (Math.random() - 0.5) * r * 0.1;
		pos[i3 + 2] = Math.sin(angle) * r + randomOffset;

		const mixed = coreColor.clone().lerp(armColor, r / scale);
		const factor = 0.35 + (1 - r / scale) * 0.5;
		col[i3] = mixed.r * factor;
		col[i3 + 1] = mixed.g * factor;
		col[i3 + 2] = mixed.b * factor;
	}

	geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

	const mat = new THREE.PointsMaterial({
		size: 0.07,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: starTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.4
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.position.set(x, y, z);
	mesh.rotation.set(rx, ry, rz);
	distantGroup.add(mesh);
};

// 2 эстетичные галактики глубоко в фоне
createDistantSpiral(-120, 50, -130, 10, 0.7, 0.3, -0.4);
createDistantSpiral(140, -60, -150, 12, -0.5, 1.2, 0.2);

scene.add(distantGroup);

/**
 * Dense & Glowing Starfield (35 000 выразительных звёзд)
 */
const bgStarsCount = 35000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	const radius = 90 + Math.random() * 200;
	const u = Math.random();
	const v = Math.random();
	const theta = u * 2.0 * Math.PI;
	const phi = Math.acos(2.0 * v - 1.0);

	bgPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
	bgPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
	bgPositions[i3 + 2] = radius * Math.cos(phi);

	const isColdStar = Math.random() > 0.6;
	const val = 0.4 + Math.random() * 0.6;
	bgColors[i3] = isColdStar ? val * 0.7 : val;
	bgColors[i3 + 1] = isColdStar ? val * 0.85 : val;
	bgColors[i3 + 2] = isColdStar ? val : val * 0.8;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.08,
	sizeAttenuation: true,
	depthWrite: false,
	transparent: true,
	alphaMap: starTexture,
	blending: THREE.AdditiveBlending,
	vertexColors: true,
	opacity: 0.8
});

const bgStars = new THREE.Points(bgGeometry, bgMaterial);
scene.add(bgStars);

/**
 * GUI Controls
 */
gui.add(params, "count", 50000, 600000, 10000).onFinishChange(generateMainGalaxy);
gui.add(params, "size", 0.005, 0.05, 0.001).onFinishChange(generateMainGalaxy);
gui.add(params, "radius", 3, 16, 0.1).onFinishChange(generateMainGalaxy);
gui.add(params, "branches", 2, 6, 1).onFinishChange(generateMainGalaxy);
gui.add(params, "spin", -3, 3, 0.01).onFinishChange(generateMainGalaxy);
gui.add(params, "randomness", 0, 2, 0.01).onFinishChange(generateMainGalaxy);
gui.addColor(params, "inColor").onFinishChange(generateMainGalaxy);
gui.addColor(params, "outColor").onFinishChange(generateMainGalaxy);

/**
 * Sizes & Camera
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener("resize", () => {
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Красивый ракурс под углом
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 500);
camera.position.set(4.5, 3.5, 10.5);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animation Loop
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	bgStars.rotation.y = elapsedTime * 0.0008;
	distantGroup.rotation.y = elapsedTime * 0.0015;

	if (mainGalaxy) {
		mainGalaxy.rotation.y = elapsedTime * 0.02;
	}

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
