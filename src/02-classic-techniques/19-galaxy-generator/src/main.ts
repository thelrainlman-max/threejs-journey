import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

import "./style.css";

/**
 * Base
 */
// Debug
const gui = new dat.GUI({ width: 340 });

// Canvas
const canvas: HTMLElement = document.querySelector("canvas.webgl")!;

// Scene
const scene = new THREE.Scene();

/**
 * Create Canvas Texture for Soft Round Stars
 */
const createParticleTexture = () => {
	const canvas = document.createElement('canvas');
	canvas.width = 32;
	canvas.height = 32;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
	gradient.addColorStop(0, 'rgba(255,255,255,1)');
	gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
	gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
	gradient.addColorStop(1, 'rgba(0,0,0,0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 32, 32);

	const texture = new THREE.CanvasTexture(canvas);
	return texture;
};

const particleTexture = createParticleTexture();

/**
 * Galaxy Parameters (Кинематографичные настройки)
 */
const params = {
	count: 200000,
	size: 0.025,
	radius: 5,
	branches: 2,           // 2 рукава выглядят намного естественнее
	spin: 1.2,             // Мягкое закручивание
	randomness: 0.8,       // Хаотичный объём
	randomnessPower: 3.5,  // Плотная концентрация к центру
	inColor: "#ff9055",    // Тёплое янтарное ядро
	outColor: "#3262ff",   // Глубокий неоново-голубой край
};

let geometry: THREE.BufferGeometry | null = null;
let material: THREE.PointsMaterial | null = null;
let points: THREE.Points | null = null;

const generateGalaxy = () => {
	if (points !== null) {
		geometry?.dispose();
		material?.dispose();
		scene.remove(points);
	}

	geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(params.count * 3);
	const colors = new Float32Array(params.count * 3);

	const inColor = new THREE.Color(params.inColor);
	const outColor = new THREE.Color(params.outColor);

	for (let i = 0; i < params.count; i++) {
		const i3 = i * 3;

		// Position
		const radius = Math.pow(Math.random(), 2) * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			radius;
		const randomY =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			radius;
		const randomZ =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			radius;

		positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
		positions[i3 + 1] = randomY * 0.5; // Сплюснутый по вертикали диск
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

		// Color
		const mixedColor = inColor.clone();
		mixedColor.lerp(outColor, radius / params.radius);

		colors[i3 + 0] = mixedColor.r;
		colors[i3 + 1] = mixedColor.g;
		colors[i3 + 2] = mixedColor.b;
	}

	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

	material = new THREE.PointsMaterial({
		size: params.size,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: particleTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
	});

	points = new THREE.Points(geometry, material);
	scene.add(points);
};

generateGalaxy();

/**
 * GUI Controls
 */
gui.add(params, "count", 1000, 500000, 1000).onFinishChange(generateGalaxy);
gui.add(params, "size", 0.005, 0.08, 0.001).onFinishChange(generateGalaxy);
gui.add(params, "radius", 1, 15, 0.1).onFinishChange(generateGalaxy);
gui.add(params, "branches", 2, 8, 1).onFinishChange(generateGalaxy);
gui.add(params, "spin", -3, 3, 0.01).onFinishChange(generateGalaxy);
gui.add(params, "randomness", 0, 2, 0.01).onFinishChange(generateGalaxy);
gui.add(params, "randomnessPower", 1, 10, 0.01).onFinishChange(generateGalaxy);
gui.addColor(params, "inColor").onFinishChange(generateGalaxy);
gui.addColor(params, "outColor").onFinishChange(generateGalaxy);

/**
 * Sizes
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

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
	60,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.set(2, 4, 6);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Background Space (Далекое мерцающее окружение)
 */
const bgStarsCount = 6000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	bgPositions[i3] = (Math.random() - 0.5) * 150;
	bgPositions[i3 + 1] = (Math.random() - 0.5) * 150;
	bgPositions[i3 + 2] = (Math.random() - 0.5) * 150;

	bgColors[i3] = 0.4 + Math.random() * 0.6;
	bgColors[i3 + 1] = 0.5 + Math.random() * 0.5;
	bgColors[i3 + 2] = 0.8 + Math.random() * 0.2;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.06,
	sizeAttenuation: true,
	depthWrite: false,
	transparent: true,
	alphaMap: particleTexture,
	blending: THREE.AdditiveBlending,
	vertexColors: true,
});

const bgStars = new THREE.Points(bgGeometry, bgMaterial);
scene.add(bgStars);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Медленное закручивание
	bgStars.rotation.y = elapsedTime * 0.01;

	if (points) {
		points.rotation.y = elapsedTime * 0.05;
	}

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
