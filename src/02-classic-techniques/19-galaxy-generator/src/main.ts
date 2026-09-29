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

// Мягкий космический туман для глубины
scene.fog = new THREE.FogExp2("#030308", 0.005);

/**
 * Canvas Texture Generator for Soft Stars & Gas
 */
const createGlowTexture = () => {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient.addColorStop(0.1, 'rgba(255, 240, 200, 0.8)');
	gradient.addColorStop(0.35, 'rgba(255, 180, 80, 0.15)');
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);

	return new THREE.CanvasTexture(canvas);
};

const glowTexture = createGlowTexture();

/**
 * Main Golden Galaxy: "ЭЛИС"
 */
const params = {
	count: 250000,
	size: 0.02,
	radius: 7,
	branches: 2,
	spin: 0.9,
	randomness: 0.65,
	randomnessPower: 4.0,
	inColor: "#fff2b3",  // Мягкое золотисто-кремовое ядро
	outColor: "#c26d00", // Тёплый глубокий янтарный край
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

		// Распределение по радиусу (сгущение к центру)
		const radius = Math.pow(Math.random(), 2.5) * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		// Объемный разброс
		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.5);
		const randomY =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius * 0.3 + 0.2); // Пышное ядро, плоский диск
		const randomZ =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.5);

		positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
		positions[i3 + 1] = randomY;
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

		// Плавный градиент цвета
		const mixedColor = inColor.clone();
		mixedColor.lerp(outColor, radius / params.radius);

		// Небольшой случайный оттенок для реализма отдельных звезд
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
		alphaMap: glowTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.85
	});

	mainGalaxy = new THREE.Points(mainGeometry, mainMaterial);
	scene.add(mainGalaxy);
};

generateMainGalaxy();

/**
 * Distant Deep Space Galaxies (Реалистичный далекий космос)
 */
const distantUniverseGroup = new THREE.Group();

const createDistantGalaxy = (
	x: number, y: number, z: number,
	scale: number,
	rotX: number, rotY: number, rotZ: number,
	isElliptical = false
) => {
	const count = isElliptical ? 8000 : 15000;
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	const baseColor = new THREE.Color(0.65, 0.7, 0.8); // Серо-голубоватый туманный тон

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		const r = Math.pow(Math.random(), isElliptical ? 1.5 : 2) * scale;

		let px = 0, py = 0, pz = 0;

		if (isElliptical) {
			// Эллиптическая туманная галактика-облако
			const u = Math.random();
			const v = Math.random();
			const theta = u * 2.0 * Math.PI;
			const phi = Math.acos(2.0 * v - 1.0);
			const rSph = Math.cbrt(Math.random()) * scale;

			px = rSph * Math.sin(phi) * Math.cos(theta);
			py = rSph * Math.sin(phi) * Math.sin(theta) * 0.5;
			pz = rSph * Math.cos(phi);
		} else {
			// Спиральная далекая галактика
			const angle = r * 1.5 + ((i % 2) * Math.PI);
			px = Math.cos(angle) * r + (Math.random() - 0.5) * r * 0.3;
			py = (Math.random() - 0.5) * r * 0.15;
			pz = Math.sin(angle) * r + (Math.random() - 0.5) * r * 0.3;
		}

		pos[i3] = px;
		pos[i3 + 1] = py;
		pos[i3 + 2] = pz;

		const factor = 0.2 + (1 - r / scale) * 0.5;
		col[i3] = baseColor.r * factor;
		col[i3 + 1] = baseColor.g * factor;
		col[i3 + 2] = baseColor.b * factor;
	}

	geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

	const mat = new THREE.PointsMaterial({
		size: 0.08,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: glowTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.35 // Полупрозрачные, не перебивают главный кадр
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.position.set(x, y, z);
	mesh.rotation.set(rotX, rotY, rotZ);

	distantUniverseGroup.add(mesh);
};

// Генерация 8 далеких галактик, раскиданных в 3D по сферической орбите
const galaxyCount = 8;
for (let i = 0; i < galaxyCount; i++) {
	const distance = 80 + Math.random() * 120; // Очень далеко
	const theta = Math.random() * Math.PI * 2;
	const phi = Math.acos((Math.random() * 2) - 1);

	const x = distance * Math.sin(phi) * Math.cos(theta);
	const y = distance * Math.sin(phi) * Math.sin(theta);
	const z = distance * Math.cos(phi);

	const scale = 3 + Math.random() * 5;
	const isElliptical = Math.random() > 0.5;

	createDistantGalaxy(
		x, y, z,
		scale,
		Math.random() * Math.PI,
		Math.random() * Math.PI,
		Math.random() * Math.PI,
		isElliptical
	);
}

scene.add(distantUniverseGroup);

/**
 * Spherical Deep Starfield (Сферическое звёздное небо)
 */
const bgStarsCount = 20000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	// Распределение по сфере, а не по кубу
	const radius = 100 + Math.random() * 150;
	const u = Math.random();
	const v = Math.random();
	const theta = u * 2.0 * Math.PI;
	const phi = Math.acos(2.0 * v - 1.0);

	bgPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
	bgPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
	bgPositions[i3 + 2] = radius * Math.cos(phi);

	const val = 0.2 + Math.random() * 0.6;
	bgColors[i3] = val * 0.8;
	bgColors[i3 + 1] = val * 0.85;
	bgColors[i3 + 2] = val;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.06,
	sizeAttenuation: true,
	depthWrite: false,
	transparent: true,
	alphaMap: glowTexture,
	blending: THREE.AdditiveBlending,
	vertexColors: true,
	opacity: 0.6
});

const bgStars = new THREE.Points(bgGeometry, bgMaterial);
scene.add(bgStars);

/**
 * GUI Controls
 */
gui.add(params, "count", 10000, 500000, 10000).onFinishChange(generateMainGalaxy);
gui.add(params, "size", 0.005, 0.05, 0.001).onFinishChange(generateMainGalaxy);
gui.add(params, "radius", 2, 12, 0.1).onFinishChange(generateMainGalaxy);
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

// Камера под эстетичным кинематографичным углом
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 400);
camera.position.set(3.5, 3, 8);
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

	// Очень медленное, естественное вращение фона
	bgStars.rotation.y = elapsedTime * 0.0015;
	distantUniverseGroup.rotation.y = elapsedTime * 0.003;

	// Медленное закручивание главной галактики
	if (mainGalaxy) {
		mainGalaxy.rotation.y = elapsedTime * 0.025;
	}

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
