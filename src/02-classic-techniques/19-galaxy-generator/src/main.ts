import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

import "./style.css";

/**
 * Base Setup
 */
const gui = new dat.GUI({ width: 340 });
const canvas: HTMLElement = document.querySelector("canvas.webgl")!;
const scene = new THREE.Scene();

/**
 * Canvas Texture generator for round glow stars
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

	return new THREE.CanvasTexture(canvas);
};

const particleTexture = createParticleTexture();

/**
 * Main Golden Galaxy Parameters
 */
const params = {
	count: 350000,
	size: 0.022,
	radius: 6,
	branches: 2,
	spin: 1.1,
	randomness: 0.75,
	randomnessPower: 3.2,
	inColor: "#fff0a0",  // Светлое искрящееся золото в центре
	outColor: "#ff9d00", // Глубокий золотисто-янтарный цвет на краях
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

		const radius = Math.pow(Math.random(), 2) * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.2);
		const randomY =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.2);
		const randomZ =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.2);

		positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
		positions[i3 + 1] = randomY * 0.4;
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

		const mixedColor = inColor.clone();
		mixedColor.lerp(outColor, radius / params.radius);

		colors[i3 + 0] = mixedColor.r;
		colors[i3 + 1] = mixedColor.g;
		colors[i3 + 2] = mixedColor.b;
	}

	mainGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	mainGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

	mainMaterial = new THREE.PointsMaterial({
		size: params.size,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: particleTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
	});

	mainGalaxy = new THREE.Points(mainGeometry, mainMaterial);
	scene.add(mainGalaxy);
};

generateMainGalaxy();

/**
 * Distant Gray/White Background Galaxies (Очень далекие и тусклые)
 */
const distantGalaxiesGroup = new THREE.Group();

const createDistantGalaxy = (
	x: number, y: number, z: number,
	scale: number,
	count = 15000
) => {
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	const c1 = new THREE.Color("#ffffff");
	const c2 = new THREE.Color("#666666");

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		const r = Math.pow(Math.random(), 2) * scale;
		const angle = r * 1.8 + ((i % 2) * Math.PI);

		const rx = (Math.random() - 0.5) * r * 0.4;
		const ry = (Math.random() - 0.5) * r * 0.2;
		const rz = (Math.random() - 0.5) * r * 0.4;

		pos[i3] = Math.cos(angle) * r + rx;
		pos[i3 + 1] = ry;
		pos[i3 + 2] = Math.sin(angle) * r + rz;

		const mixed = c1.clone().lerp(c2, r / scale);
		col[i3] = mixed.r * 0.4; // Делаем тусклыми
		col[i3 + 1] = mixed.g * 0.4;
		col[i3 + 2] = mixed.b * 0.4;
	}

	geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

	const mat = new THREE.PointsMaterial({
		size: 0.04,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: particleTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.position.set(x, y, z);
	mesh.rotation.x = Math.random() * Math.PI;
	mesh.rotation.z = Math.random() * Math.PI;

	distantGalaxiesGroup.add(mesh);
};

// 3 тусклые беловато-серые галактики очень далеко на заднем плане
createDistantGalaxy(-60, 25, -70, 5);
createDistantGalaxy(70, -30, -90, 6);
createDistantGalaxy(-50, -40, -60, 4);

scene.add(distantGalaxiesGroup);

/**
 * Background Starfield (Далекие нейтральные белые звезды)
 */
const bgStarsCount = 12000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	bgPositions[i3] = (Math.random() - 0.5) * 200;
	bgPositions[i3 + 1] = (Math.random() - 0.5) * 200;
	bgPositions[i3 + 2] = (Math.random() - 0.5) * 200;

	const val = 0.2 + Math.random() * 0.5;
	bgColors[i3] = val;
	bgColors[i3 + 1] = val;
	bgColors[i3 + 2] = val;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.05,
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
 * GUI Controls
 */
gui.add(params, "count", 10000, 500000, 10000).onFinishChange(generateMainGalaxy);
gui.add(params, "size", 0.005, 0.06, 0.001).onFinishChange(generateMainGalaxy);
gui.add(params, "radius", 2, 15, 0.1).onFinishChange(generateMainGalaxy);
gui.add(params, "branches", 2, 8, 1).onFinishChange(generateMainGalaxy);
gui.add(params, "spin", -3, 3, 0.01).onFinishChange(generateMainGalaxy);
gui.add(params, "randomness", 0, 2, 0.01).onFinishChange(generateMainGalaxy);
gui.add(params, "randomnessPower", 1, 10, 0.01).onFinishChange(generateMainGalaxy);
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

const camera = new THREE.PerspectiveCamera(55, sizes.width / sizes.height, 0.1, 300);
camera.position.set(2.5, 4, 6.5);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

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

	bgStars.rotation.y = elapsedTime * 0.003;
	distantGalaxiesGroup.rotation.y = elapsedTime * 0.005;

	if (mainGalaxy) {
		mainGalaxy.rotation.y = elapsedTime * 0.03;
	}

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
