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

scene.fog = new THREE.FogExp2("#020205", 0.0025);

/**
 * Soft Glowing Star Texture
 */
const createGlowTexture = () => {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient.addColorStop(0.15, 'rgba(255, 240, 210, 0.9)');
	gradient.addColorStop(0.4, 'rgba(255, 190, 100, 0.25)');
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);

	return new THREE.CanvasTexture(canvas);
};

const glowTexture = createGlowTexture();

/**
 * Main Golden Galaxy: "ЭЛИС" (Пышная и Объёмная)
 */
const params = {
	count: 350000,
	size: 0.025,
	radius: 8,
	branches: 2,
	spin: 1.1,
	randomness: 0.8,
	randomnessPower: 3.2,
	bulgeSize: 1.8,      // Размер объёмного центрального балджа
	inColor: "#fff4ca",  // Искрящийся центр
	outColor: "#d97300", // Глубокое золото на краях
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

		// 1. Центральное сферическое ядро (Балдж)
		const isBulge = Math.random() < 0.35; // 35% частиц формируют яркий 3D-шар в центре
		let randomX = 0, randomY = 0, randomZ = 0;

		if (isBulge) {
			const bulgeRadius = Math.random() * params.bulgeSize;
			const u = Math.random();
			const v = Math.random();
			const theta = u * 2.0 * Math.PI;
			const phi = Math.acos(2.0 * v - 1.0);

			randomX = bulgeRadius * Math.sin(phi) * Math.cos(theta);
			randomY = bulgeRadius * Math.sin(phi) * Math.sin(theta) * 0.8;
			randomZ = bulgeRadius * Math.cos(phi);

			positions[i3 + 0] = randomX;
			positions[i3 + 1] = randomY;
			positions[i3 + 2] = randomZ;
		} else {
			// 2. Объёмный диск и изгибающиеся рукава
			randomX =
				Math.pow(Math.random(), params.randomnessPower) *
				(Math.random() < 0.5 ? 1 : -1) *
				params.randomness *
				(radius + 0.5);
			
			// Пышная толщина диска (уменьшается к краям)
			const heightFactor = Math.max(0.15, 1.2 - (radius / params.radius) * 0.8);
			randomY = (Math.random() - 0.5) * params.randomness * heightFactor * 2.5;

			randomZ =
				Math.pow(Math.random(), params.randomnessPower) *
				(Math.random() < 0.5 ? 1 : -1) *
				params.randomness *
				(radius + 0.5);

			positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
			positions[i3 + 1] = randomY;
			positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;
		}

		// Градиент цвета
		const mixedColor = inColor.clone();
		mixedColor.lerp(outColor, radius / params.radius);

		const brightness = 0.85 + Math.random() * 0.3;
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
		opacity: 0.9
	});

	mainGalaxy = new THREE.Points(mainGeometry, mainMaterial);
	scene.add(mainGalaxy);
};

generateMainGalaxy();

/**
 * Distant Deep Space Galaxies (Всего 3 детализированные сине-фиолетовые галактики)
 */
const distantUniverseGroup = new THREE.Group();

const createDistantGalaxy = (
	x: number, y: number, z: number,
	scale: number,
	rotX: number, rotY: number, rotZ: number
) => {
	const count = 25000;
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	const colorCore = new THREE.Color("#bcaaa4"); // Мягкое светлое ядро
	const colorArms = new THREE.Color("#3f51b5"); // Индиго/фиолетовые рукава

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		const r = Math.pow(Math.random(), 2.2) * scale;

		// Формируем четкую спираль для далекой галактики
		const spinAngle = r * 1.5;
		const branchAngle = ((i % 2) / 2) * Math.PI * 2;

		const rx = (Math.random() - 0.5) * r * 0.25;
		const ry = (Math.random() - 0.5) * r * 0.12;
		const rz = (Math.random() - 0.5) * r * 0.25;

		pos[i3] = Math.cos(branchAngle + spinAngle) * r + rx;
		pos[i3 + 1] = ry;
		pos[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + rz;

		const mixed = colorCore.clone().lerp(colorArms, r / scale);
		const factor = 0.4 + (1 - r / scale) * 0.5;
		col[i3] = mixed.r * factor;
		col[i3 + 1] = mixed.g * factor;
		col[i3 + 2] = mixed.b * factor;
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
		opacity: 0.45
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.position.set(x, y, z);
	mesh.rotation.set(rotX, rotY, rotZ);

	distantUniverseGroup.add(mesh);
};

// Всего 3 умеренно расположенные галактики вдалеке под сильным наклоном
createDistantGalaxy(-110, 45, -120, 9, 0.8, 0.4, -0.5);
createDistantGalaxy(130, -50, -140, 11, -0.6, 1.1, 0.3);
createDistantGalaxy(-90, -70, 80, 8, 1.2, -0.8, 0.9);

scene.add(distantUniverseGroup);

/**
 * Spherical Background Starfield (Умеренное количество звезд)
 */
const bgStarsCount = 15000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	const radius = 100 + Math.random() * 180;
	const u = Math.random();
	const v = Math.random();
	const theta = u * 2.0 * Math.PI;
	const phi = Math.acos(2.0 * v - 1.0);

	bgPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
	bgPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
	bgPositions[i3 + 2] = radius * Math.cos(phi);

	const val = 0.3 + Math.random() * 0.6;
	bgColors[i3] = val * 0.85;
	bgColors[i3 + 1] = val * 0.9;
	bgColors[i3 + 2] = val;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.07,
	sizeAttenuation: true,
	depthWrite: false,
	transparent: true,
	alphaMap: glowTexture,
	blending: THREE.AdditiveBlending,
	vertexColors: true,
	opacity: 0.7
});

const bgStars = new THREE.Points(bgGeometry, bgMaterial);
scene.add(bgStars);

/**
 * GUI Controls
 */
gui.add(params, "count", 10000, 500000, 10000).onFinishChange(generateMainGalaxy);
gui.add(params, "size", 0.005, 0.06, 0.001).onFinishChange(generateMainGalaxy);
gui.add(params, "radius", 2, 15, 0.1).onFinishChange(generateMainGalaxy);
gui.add(params, "bulgeSize", 0.5, 4, 0.1).onFinishChange(generateMainGalaxy);
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

// Камера направлена чуть сбоку для демонстрации объема ядра
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 450);
camera.position.set(4, 3, 9.5);
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

	bgStars.rotation.y = elapsedTime * 0.001;
	distantUniverseGroup.rotation.y = elapsedTime * 0.002;

	if (mainGalaxy) {
		mainGalaxy.rotation.y = elapsedTime * 0.025;
	}

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
