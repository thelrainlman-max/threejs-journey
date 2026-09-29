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

// Глубокий тёмно-космический фон
scene.fog = new THREE.FogExp2("#010103", 0.0018);

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
	gradient.addColorStop(0.12, 'rgba(255, 235, 190, 0.95)');
	gradient.addColorStop(0.35, 'rgba(255, 180, 90, 0.25)');
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);

	return new THREE.CanvasTexture(canvas);
};

const starTexture = createStarTexture();

/**
 * 1. Milky Way Band (Полоса Млечного Пути на заднем фоне)
 */
const milkyWayGroup = new THREE.Group();

const createMilkyWay = () => {
	const count = 120000;
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	const colorCenter = new THREE.Color("#4a148c"); // Глубокий фиолетовый
	const colorEdge = new THREE.Color("#0d47a1");   // Ультрамарин

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		
		// Распределение по длинной дуге/диску
		const angle = (Math.random() - 0.5) * Math.PI * 1.8;
		const distance = 160 + Math.random() * 40;
		const spreadX = (Math.random() - 0.5) * 220;
		const spreadY = (Math.random() - 0.5) * 35;
		const spreadZ = (Math.random() - 0.5) * 35;

		pos[i3] = Math.cos(angle) * distance + spreadX;
		pos[i3 + 1] = spreadY;
		pos[i3 + 2] = Math.sin(angle) * distance + spreadZ;

		const mixed = colorCenter.clone().lerp(colorEdge, Math.random());
		const factor = 0.2 + Math.random() * 0.4;
		col[i3] = mixed.r * factor;
		col[i3 + 1] = mixed.g * factor;
		col[i3 + 2] = mixed.b * factor;
	}

	geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

	const mat = new THREE.PointsMaterial({
		size: 0.12,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: starTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.35
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.rotation.z = Math.PI * 0.25; // Наклон дуги Млечного Пути
	mesh.rotation.x = Math.PI * 0.15;
	milkyWayGroup.add(mesh);
};

createMilkyWay();
scene.add(milkyWayGroup);

/**
 * 2. Main Golden Galaxy "ЭЛИС" (Изящная и Элегантная)
 */
const params = {
	count: 500000,
	size: 0.02,
	radius: 9.5,
	branches: 2,
	spin: 1.1,
	randomness: 0.6,
	randomnessPower: 3.8,
	inColor: "#fff7db",  // Кремово-золотое сияние ядра
	outColor: "#d97700", // Янтарное благородное золото
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

		const radius = Math.pow(Math.random(), 2.5) * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		const isCore = radius < 1.5;
		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.3);
		
		const heightLimit = isCore ? 1.4 : Math.max(0.08, 1.2 - (radius / params.radius) * 1.0);
		const randomY = (Math.random() - 0.5) * params.randomness * heightLimit;

		const randomZ =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.3);

		positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
		positions[i3 + 1] = randomY;
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

		const mixedColor = inColor.clone();
		mixedColor.lerp(outColor, radius / params.radius);

		const brightness = 0.85 + Math.random() * 0.35;
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
		opacity: 0.9
	});

	mainGalaxy = new THREE.Points(mainGeometry, mainMaterial);
	scene.add(mainGalaxy);
};

generateMainGalaxy();

/**
 * 3. Distant Tiny Galaxies (3 аккуратные маленькие Вселенные)
 */
const distantGroup = new THREE.Group();

const createDistantSpiral = (x: number, y: number, z: number, scale: number, rx: number, ry: number, rz: number) => {
	const count = 18000;
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	const coreColor = new THREE.Color("#ce93d8"); // Фиолетовый
	const armColor = new THREE.Color("#1e88e5");  // Неоново-синий

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		const r = Math.pow(Math.random(), 2.0) * scale;
		const angle = r * 1.6 + ((i % 2) * Math.PI);

		const randomOffset = (Math.random() - 0.5) * r * 0.2;

		pos[i3] = Math.cos(angle) * r + randomOffset;
		pos[i3 + 1] = (Math.random() - 0.5) * r * 0.1;
		pos[i3 + 2] = Math.sin(angle) * r + randomOffset;

		const mixed = coreColor.clone().lerp(armColor, r / scale);
		const factor = 0.3 + (1 - r / scale) * 0.5;
		col[i3] = mixed.r * factor;
		col[i3 + 1] = mixed.g * factor;
		col[i3 + 2] = mixed.b * factor;
	}

	geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

	const mat = new THREE.PointsMaterial({
		size: 0.06,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: starTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.45
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.position.set(x, y, z);
	mesh.rotation.set(rx, ry, rz);
	distantGroup.add(mesh);
};

// 3 маленькие Вселенные вдалеке
createDistantSpiral(-130, 60, -140, 7, 0.8, 0.4, -0.5);
createDistantSpiral(150, -70, -160, 8, -0.6, 1.2, 0.3);
createDistantSpiral(-90, -80, 110, 6, 1.1, -0.7, 0.8);

scene.add(distantGroup);

/**
 * 4. Deep Space Starfield (Чёткое глубокое звёздное небо)
 */
const bgStarsCount = 40000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	const radius = 100 + Math.random() * 220;
	const u = Math.random();
	const v = Math.random();
	const theta = u * 2.0 * Math.PI;
	const phi = Math.acos(2.0 * v - 1.0);

	bgPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
	bgPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
	bgPositions[i3 + 2] = radius * Math.cos(phi);

	const isBlueStar = Math.random() > 0.7;
	const val = 0.35 + Math.random() * 0.65;
	bgColors[i3] = isBlueStar ? val * 0.7 : val;
	bgColors[i3 + 1] = isBlueStar ? val * 0.85 : val;
	bgColors[i3 + 2] = isBlueStar ? val : val * 0.8;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.075,
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
gui.add(params, "count", 50000, 700000, 10000).onFinishChange(generateMainGalaxy);
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

// Эстетичный кинематографичный ракурс
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 550);
camera.position.set(4.5, 3.8, 11);
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

	// Плавное медленное вращение фона и туманностей
	bgStars.rotation.y = elapsedTime * 0.0006;
	milkyWayGroup.rotation.y = elapsedTime * 0.0003;
	distantGroup.rotation.y = elapsedTime * 0.0012;

	// Вращение главной галактики
	if (mainGalaxy) {
		mainGalaxy.rotation.y = elapsedTime * 0.018;
	}

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
