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

// Глубокий космический туман
scene.fog = new THREE.FogExp2("#010103", 0.0015);

/**
 * High-Quality Soft Glow Texture Generator
 */
const createStarTexture = () => {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient.addColorStop(0.15, 'rgba(255, 235, 180, 0.9)');
	gradient.addColorStop(0.4, 'rgba(255, 180, 80, 0.2)');
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);

	return new THREE.CanvasTexture(canvas);
};

const starTexture = createStarTexture();

/**
 * 1. ИЗЯЩНАЯ ЗОЛОТАЯ ГАЛАКТИКА «ЭЛИС»
 */
const params = {
	count: 500000,
	size: 0.022,
	radius: 9,
	branches: 2,
	spin: 1.1,
	randomness: 0.65,
	randomnessPower: 3.5,
	inColor: "#fff5d6",  // Кремовое золото в центре
	outColor: "#cc7000", // Насыщенный янтарь на краях
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

		const radius = Math.pow(Math.random(), 2.3) * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		const isCore = radius < 1.6;
		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.3);
		
		const heightLimit = isCore ? 1.5 : Math.max(0.1, 1.2 - (radius / params.radius) * 1.0);
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
		opacity: 0.9
	});

	mainGalaxy = new THREE.Points(mainGeometry, mainMaterial);
	scene.add(mainGalaxy);
};

generateMainGalaxy();

/**
 * 2. ДАЛЕКИЕ ВСЕЛЕННЫЕ (Без труб и полос — мягкие 3D-туманности)
 */
const distantGroup = new THREE.Group();

const createDistantCluster = (x: number, y: number, z: number, scale: number, color1Hex: string, color2Hex: string) => {
	const count = 20000;
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	const c1 = new THREE.Color(color1Hex);
	const c2 = new THREE.Color(color2Hex);

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		
		// Сферическое/эллиптическое облако без жестких полос
		const u = Math.random();
		const v = Math.random();
		const theta = u * 2.0 * Math.PI;
		const phi = Math.acos(2.0 * v - 1.0);
		const rSph = Math.cbrt(Math.random()) * scale;

		pos[i3] = rSph * Math.sin(phi) * Math.cos(theta);
		pos[i3 + 1] = rSph * Math.sin(phi) * Math.sin(theta) * 0.5; // Слегка сплюснутый шар
		pos[i3 + 2] = rSph * Math.cos(phi);

		const mixed = c1.clone().lerp(c2, rSph / scale);
		const factor = 0.35 + (1 - rSph / scale) * 0.5;
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
		alphaMap: starTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.4
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.position.set(x, y, z);
	mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
	distantGroup.add(mesh);
};

// 3 эстетичные далекие Вселенные в форме сине-фиолетовых мягких облаков
createDistantCluster(-140, 50, -150, 10, "#9c27b0", "#2196f3"); // Фиолетово-синяя
createDistantCluster(160, -60, -170, 12, "#3f51b5", "#00bcd4"); // Индиго-бирюзовая
createDistantCluster(-110, -80, 120, 8, "#673ab7", "#3f51b5");  // Глубокий ультрамарин

scene.add(distantGroup);

/**
 * 3. МИРИАДЫ МЕРЦАЮЩИХ ЗВЁЗД (60 000 частиц + Анимация сияния)
 */
const bgStarsCount = 60000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);
const bgBaseColors = new Float32Array(bgStarsCount * 3); // Запоминаем базовую яркость для мерцания

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	const radius = 80 + Math.random() * 220;
	const u = Math.random();
	const v = Math.random();
	const theta = u * 2.0 * Math.PI;
	const phi = Math.acos(2.0 * v - 1.0);

	bgPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
	bgPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
	bgPositions[i3 + 2] = radius * Math.cos(phi);

	const isBlue = Math.random() > 0.65;
	const val = 0.3 + Math.random() * 0.7;

	const r = isBlue ? val * 0.7 : val;
	const g = isBlue ? val * 0.85 : val;
	const b = isBlue ? val : val * 0.8;

	bgColors[i3] = r;
	bgColors[i3 + 1] = g;
	bgColors[i3 + 2] = b;

	bgBaseColors[i3] = r;
	bgBaseColors[i3 + 1] = g;
	bgBaseColors[i3 + 2] = b;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.085,
	sizeAttenuation: true,
	depthWrite: false,
	transparent: true,
	alphaMap: starTexture,
	blending: THREE.AdditiveBlending,
	vertexColors: true,
	opacity: 0.85
});

const bgStars = new THREE.Points(bgGeometry, bgMaterial);
scene.add(bgStars);

/**
 * GUI Controls
 */
gui.add(params, "count", 100000, 800000, 10000).onFinishChange(generateMainGalaxy);
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

const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 500);
camera.position.set(4, 3.5, 11);
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
 * Animation Loop (С вращением и мерцанием звёзд)
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// 1. Медленное космическое вращение
	bgStars.rotation.y = elapsedTime * 0.0008;
	distantGroup.rotation.y = elapsedTime * 0.0015;

	if (mainGalaxy) {
		mainGalaxy.rotation.y = elapsedTime * 0.018;
	}

	// 2. Анимация мерцания звёзд (Twinkle effect)
	const colorAttr = bgGeometry.attributes.color as THREE.BufferAttribute;
	const colorArray = colorAttr.array as Float32Array;

	for (let i = 0; i < bgStarsCount; i += 15) { // Обновляем часть звезд каждый кадр для производительности
		const i3 = i * 3;
		const twinkle = 0.6 + Math.sin(elapsedTime * 3 + i) * 0.4;

		colorArray[i3] = bgBaseColors[i3] * twinkle;
		colorArray[i3 + 1] = bgBaseColors[i3 + 1] * twinkle;
		colorArray[i3 + 2] = bgBaseColors[i3 + 2] * twinkle;
	}
	colorAttr.needsUpdate = true;

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
