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

// Глубокий космический фон с легким туманом
scene.fog = new THREE.FogExp2("#020205", 0.003);

/**
 * HD Canvas Texture Generator for Sharp & Glowing Stars
 */
const createSharpGlowTexture = () => {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      // Четкое яркое ядро
	gradient.addColorStop(0.12, 'rgba(255, 255, 255, 0.9)');
	gradient.addColorStop(0.3, 'rgba(255, 220, 150, 0.35)'); // Мягкий ореол
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);

	return new THREE.CanvasTexture(canvas);
};

const sharpGlowTexture = createSharpGlowTexture();

/**
 * Main Golden Galaxy: "ЭЛИС" (Масштабная & Объёмная)
 */
const params = {
	count: 320000,
	size: 0.024,
	radius: 8.5,
	branches: 2,
	spin: 1.0,
	randomness: 0.7,
	randomnessPower: 3.8,
	inColor: "#fff5c2",  // Искрящееся кремовое золото в центре
	outColor: "#d97700", // Глубокий богатый янтарь на краях
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

		// Экспоненциальный радиус (очень плотное ядро и длинные рукава)
		const radius = Math.pow(Math.random(), 2.2) * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		// Объёмная форма: пышный балдж в центре + изогнутый диск (s-warp)
		const warp = Math.sin(radius * 0.5) * 0.3;
		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.4);
		const randomY =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(Math.max(0.1, 2.0 - radius * 0.2)); // Сферa в центре, плоский диск на краях
		const randomZ =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.4);

		positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
		positions[i3 + 1] = randomY + warp;
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

		// Цветовой градиент
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
		alphaMap: sharpGlowTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.9
	});

	mainGalaxy = new THREE.Points(mainGeometry, mainMaterial);
	scene.add(mainGalaxy);
};

generateMainGalaxy();

/**
 * Distant Deep Space Galaxies (Разнообразные формы с синевато-фиолетовыми оттенками)
 */
const distantUniverseGroup = new THREE.Group();

const createDistantGalaxy = (
	x: number, y: number, z: number,
	scale: number,
	rotX: number, rotY: number, rotZ: number,
	type: 'spiral' | 'elliptical' | 'ring'
) => {
	const count = type === 'elliptical' ? 10000 : 16000;
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	// Холодная космическая палитра: сине-фиолетовые и ультрамариновые тона
	const colorCore = new THREE.Color("#d1b3ff"); // Фиолетово-перламутровый центр
	const colorEdge = new THREE.Color("#2a55ff"); // Глубокий синий ультрамарин

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		const r = Math.pow(Math.random(), 2) * scale;

		let px = 0, py = 0, pz = 0;

		if (type === 'elliptical') {
			// 1. Сферическая эллиптическая галактика
			const u = Math.random();
			const v = Math.random();
			const theta = u * 2.0 * Math.PI;
			const phi = Math.acos(2.0 * v - 1.0);
			const rSph = Math.cbrt(Math.random()) * scale;

			px = rSph * Math.sin(phi) * Math.cos(theta);
			py = rSph * Math.sin(phi) * Math.sin(theta) * 0.6;
			pz = rSph * Math.cos(phi);
		} else if (type === 'ring') {
			// 2. Кольцевая (линзовидная) галактика
			const ringRadius = scale * 0.5 + Math.random() * scale * 0.5;
			const angle = Math.random() * Math.PI * 2;
			px = Math.cos(angle) * ringRadius + (Math.random() - 0.5) * 0.5;
			py = (Math.random() - 0.5) * 0.3;
			pz = Math.sin(angle) * ringRadius + (Math.random() - 0.5) * 0.5;
		} else {
			// 3. Спиральная далёкая галактика
			const angle = r * 1.8 + ((i % 2) * Math.PI);
			px = Math.cos(angle) * r + (Math.random() - 0.5) * r * 0.3;
			py = (Math.random() - 0.5) * r * 0.15;
			pz = Math.sin(angle) * r + (Math.random() - 0.5) * r * 0.3;
		}

		pos[i3] = px;
		pos[i3 + 1] = py;
		pos[i3 + 2] = pz;

		// Смешивание фиолетового и синего
		const mixed = colorCore.clone().lerp(colorEdge, r / scale);
		const factor = 0.3 + (1 - r / scale) * 0.5;
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
		alphaMap: sharpGlowTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.5
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.position.set(x, y, z);
	mesh.rotation.set(rotX, rotY, rotZ);

	distantUniverseGroup.add(mesh);
};

// Генерация 9 далеких галактик разного типа по сферической орбите
const types: ('spiral' | 'elliptical' | 'ring')[] = ['spiral', 'elliptical', 'ring'];
for (let i = 0; i < 9; i++) {
	const distance = 90 + Math.random() * 110;
	const theta = Math.random() * Math.PI * 2;
	const phi = Math.acos((Math.random() * 2) - 1);

	const x = distance * Math.sin(phi) * Math.cos(theta);
	const y = distance * Math.sin(phi) * Math.sin(theta);
	const z = distance * Math.cos(phi);

	const scale = 4 + Math.random() * 5;
	const currentType = types[i % 3];

	createDistantGalaxy(
		x, y, z,
		scale,
		Math.random() * Math.PI,
		Math.random() * Math.PI,
		Math.random() * Math.PI,
		currentType
	);
}

scene.add(distantUniverseGroup);

/**
 * Spherical Deep Starfield (Чёткие выразительные звёзды)
 */
const bgStarsCount = 22000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	const radius = 90 + Math.random() * 160;
	const u = Math.random();
	const v = Math.random();
	const theta = u * 2.0 * Math.PI;
	const phi = Math.acos(2.0 * v - 1.0);

	bgPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
	bgPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
	bgPositions[i3 + 2] = radius * Math.cos(phi);

	// Звёзды разной яркости с легким синевато-белым отливом
	const isBlueStar = Math.random() > 0.7;
	bgColors[i3] = isBlueStar ? 0.6 : 0.85;
	bgColors[i3 + 1] = isBlueStar ? 0.75 : 0.85;
	bgColors[i3 + 2] = isBlueStar ? 1.0 : 0.9;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.075,
	sizeAttenuation: true,
	depthWrite: false,
	transparent: true,
	alphaMap: sharpGlowTexture,
	blending: THREE.AdditiveBlending,
	vertexColors: true,
	opacity: 0.75
});

const bgStars = new THREE.Points(bgGeometry, bgMaterial);
scene.add(bgStars);

/**
 * GUI Controls
 */
gui.add(params, "count", 10000, 500000, 10000).onFinishChange(generateMainGalaxy);
gui.add(params, "size", 0.005, 0.06, 0.001).onFinishChange(generateMainGalaxy);
gui.add(params, "radius", 2, 15, 0.1).onFinishChange(generateMainGalaxy);
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

// Угол съемки с кинематографичным обзором
const camera = new THREE.PerspectiveCamera(48, sizes.width / sizes.height, 0.1, 400);
camera.position.set(4, 3.5, 9);
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

	// Плавные вращения элементов на разных скоростях
	bgStars.rotation.y = elapsedTime * 0.001;
	distantUniverseGroup.rotation.y = elapsedTime * 0.0025;

	if (mainGalaxy) {
		mainGalaxy.rotation.y = elapsedTime * 0.022;
	}

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
