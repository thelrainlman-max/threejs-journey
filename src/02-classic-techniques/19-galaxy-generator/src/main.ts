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

/**
 * Procedural Soft Glow Texture (Чистый круглый сгусток без резких краев)
 */
const createStarTexture = () => {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient.addColorStop(0.1, 'rgba(255, 230, 160, 0.8)');
	gradient.addColorStop(0.3, 'rgba(255, 170, 60, 0.2)');
	gradient.addColorStop(0.8, 'rgba(20, 10, 0, 0.02)');
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);

	return new THREE.CanvasTexture(canvas);
};

const starTexture = createStarTexture();

/**
 * 1. МИРИАДЫ ЯРКИХ МЕРЦАЮЩИХ ЗВЁЗД (По всему пространству)
 */
const bgStarsCount = 40000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);
const bgScales = new Float32Array(bgStarsCount);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	// Распределяем близко к камере, чтобы закруглить весь обзор
	const radius = 10 + Math.random() * 85;
	const theta = Math.random() * Math.PI * 2;
	const phi = Math.acos((Math.random() * 2) - 1);

	bgPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
	bgPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
	bgPositions[i3 + 2] = radius * Math.cos(phi);

	const isWarm = Math.random() > 0.5;
	bgColors[i3] = isWarm ? 1.0 : 0.6;
	bgColors[i3 + 1] = isWarm ? 0.85 : 0.8;
	bgColors[i3 + 2] = isWarm ? 0.6 : 1.0;

	bgScales[i] = 0.03 + Math.random() * 0.06;
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
	opacity: 0.95
});

const bgStars = new THREE.Points(bgGeometry, bgMaterial);
scene.add(bgStars);

/**
 * 2. ГЛАВНАЯ ЗОЛОТАЯ ГАЛАКТИКА «ЭЛИС» (Без пересвета и квадратов)
 */
const params = {
	count: 350000,
	size: 0.022,
	radius: 8.5,
	branches: 2,
	spin: 1.05,
	randomness: 0.55,
	randomnessPower: 3.5,
	inColor: "#ffea9f",  // Тёплое золото ядра
	outColor: "#d16800", // Глубокий янтарь
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

		const radius = Math.pow(Math.random(), 2.2) * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		// Мягкое распределение без пересвета ядра
		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.4);
		
		const heightFactor = Math.max(0.05, 1.0 - (radius / params.radius) * 0.85);
		const randomY = (Math.random() - 0.5) * params.randomness * heightFactor * 1.5;

		const randomZ =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.4);

		positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
		positions[i3 + 1] = randomY;
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

		// Гашение яркости в самом центре, чтобы избежать квадратов от аддитивного сложения
		const coreDamp = Math.min(1.0, 0.35 + (radius / params.radius) * 0.8);

		const mixedColor = inColor.clone();
		mixedColor.lerp(outColor, radius / params.radius);

		colors[i3 + 0] = mixedColor.r * coreDamp;
		colors[i3 + 1] = mixedColor.g * coreDamp;
		colors[i3 + 2] = mixedColor.b * coreDamp;
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
		opacity: 0.85
	});

	mainGalaxy = new THREE.Points(mainGeometry, mainMaterial);
	scene.add(mainGalaxy);
};

generateMainGalaxy();

/**
 * 3. АБСТРАКТНЫЕ ДАЛЕКИЕ ВСЕЛЕННЫЕ (Облака, без труб)
 */
const distantGroup = new THREE.Group();

const createAbstractNebula = (x: number, y: number, z: number, scale: number, colorHex: string) => {
	const count = 12000;
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	const baseColor = new THREE.Color(colorHex);

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		
		// Мягкое бесформенное 3D облако
		const u = Math.random();
		const v = Math.random();
		const theta = u * 2.0 * Math.PI;
		const phi = Math.acos(2.0 * v - 1.0);
		const rSph = Math.cbrt(Math.random()) * scale;

		pos[i3] = rSph * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * 2;
		pos[i3 + 1] = rSph * Math.sin(phi) * Math.sin(theta) * 0.6;
		pos[i3 + 2] = rSph * Math.cos(phi);

		const factor = 0.25 + (1 - rSph / scale) * 0.4;
		col[i3] = baseColor.r * factor;
		col[i3 + 1] = baseColor.g * factor;
		col[i3 + 2] = baseColor.b * factor;
	}

	geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

	const mat = new THREE.PointsMaterial({
		size: 0.1,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: starTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.35
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.position.set(x, y, z);
	distantGroup.add(mesh);
};

// 3 мягких абстрактных сине-фиолетовых туманных облака
createAbstractNebula(-45, 20, -50, 8, "#8a2be2");
createAbstractNebula(55, -25, -60, 10, "#1e90ff");
createAbstractNebula(-35, -30, 40, 7, "#9370db");

scene.add(distantGroup);

/**
 * GUI Controls
 */
gui.add(params, "count", 100000, 600000, 10000).onFinishChange(generateMainGalaxy);
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

const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 300);
camera.position.set(3.5, 3, 8.5);
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

	// Медленное вращение
	bgStars.rotation.y = elapsedTime * 0.0005;
	distantGroup.rotation.y = elapsedTime * 0.001;

	if (mainGalaxy) {
		mainGalaxy.rotation.y = elapsedTime * 0.02;
	}

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
