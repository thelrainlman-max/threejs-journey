import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

import "./style.css";

/**
 * Base Setup
 */
const gui = new dat.GUI({ width: 320 });
gui.hide(); // Это полностью уберет панель с экрана при загрузке
const canvas: HTMLElement = document.querySelector("canvas.webgl")!;
const scene = new THREE.Scene();

/**
 * Cinematic Soft Star Texture Generator
 */
const createStarTexture = () => {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d')!;

	const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
	gradient.addColorStop(0.12, 'rgba(255, 230, 170, 0.85)');
	gradient.addColorStop(0.35, 'rgba(255, 160, 50, 0.15)');
	gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 64, 64);

	return new THREE.CanvasTexture(canvas);
};

const starTexture = createStarTexture();

/**
 * 1. МИРИАДЫ МЕРЦАЮЩИХ ЗВЁЗД (Фон)
 */
const bgStarsCount = 55000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	const radius = 20 + Math.random() * 110;
	const theta = Math.random() * Math.PI * 2;
	const phi = Math.acos((Math.random() * 2) - 1);

	bgPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
	bgPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
	bgPositions[i3 + 2] = radius * Math.cos(phi);

	const isCold = Math.random() > 0.45;
	bgColors[i3] = isCold ? 0.65 : 1.0;
	bgColors[i3 + 1] = isCold ? 0.8 : 0.9;
	bgColors[i3 + 2] = isCold ? 1.0 : 0.65;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.065,
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
 * 2. ГЛАВНАЯ ЗОЛОТАЯ ГАЛАКТИКА
 */
const params = {
	count: 400000,
	size: 0.016,
	radius: 8.5,
	branches: 2,
	spin: 1.2,
	randomness: 0.55,
	randomnessPower: 3.8,
	inColor: "#fff2d1",
	outColor: "#c25e00",
};

let mainGeometry: THREE.BufferGeometry | null = null;
let mainMaterial: THREE.PointsMaterial | null = null;
let mainGalaxy: THREE.Points | null = null;
let lensRing: THREE.Points | null = null;

const generateMainGalaxy = () => {
	if (mainGalaxy !== null) {
		mainGeometry?.dispose();
		mainMaterial?.dispose();
		scene.remove(mainGalaxy);
	}
	if (lensRing !== null) {
		scene.remove(lensRing);
	}

	mainGeometry = new THREE.BufferGeometry();
	const positions = new Float32Array(params.count * 3);
	const colors = new Float32Array(params.count * 3);

	const inColor = new THREE.Color(params.inColor);
	const outColor = new THREE.Color(params.outColor);

	for (let i = 0; i < params.count; i++) {
		const i3 = i * 3;

		const radius = Math.pow(Math.random(), 2.4) * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.3);
		
		const heightFactor = Math.max(0.04, 1.1 - (radius / params.radius) * 0.9);
		const randomY = (Math.random() - 0.5) * params.randomness * heightFactor * 1.2;

		const randomZ =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness *
			(radius + 0.3);

		positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
		positions[i3 + 1] = randomY;
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

		const coreDamp = Math.min(1.0, 0.4 + (radius / params.radius) * 0.7);

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
		opacity: 0.88
	});

	mainGalaxy = new THREE.Points(mainGeometry, mainMaterial);
	scene.add(mainGalaxy);

	// Фотонное кольцо
	const ringCount = 30000;
	const ringGeo = new THREE.BufferGeometry();
	const ringPos = new Float32Array(ringCount * 3);
	const ringCol = new Float32Array(ringCount * 3);

	for (let i = 0; i < ringCount; i++) {
		const i3 = i * 3;
		const r = 1.1 + Math.random() * 1.6;
		const angle = Math.random() * Math.PI * 2;

		ringPos[i3] = Math.cos(angle) * r + (Math.random() - 0.5) * 0.08;
		ringPos[i3 + 1] = Math.sin(angle) * r + (Math.random() - 0.5) * 0.08;
		ringPos[i3 + 2] = (Math.random() - 0.5) * 0.15;

		ringCol[i3] = 1.0;
		ringCol[i3 + 1] = 0.82;
		ringCol[i3 + 2] = 0.45;
	}

	ringGeo.setAttribute("position", new THREE.BufferAttribute(ringPos, 3));
	ringGeo.setAttribute("color", new THREE.BufferAttribute(ringCol, 3));

	const ringMat = new THREE.PointsMaterial({
		size: 0.016,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: starTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.55
	});

	lensRing = new THREE.Points(ringGeo, ringMat);
	lensRing.rotation.x = Math.PI * 0.22;
	scene.add(lensRing);
};

generateMainGalaxy();

/**
 * 3. ДАЛЁКИЕ ГАЛАКТИКИ РАЗНЫХ ФОРМ
 */
const distantGalaxiesGroup = new THREE.Group();

type GalaxyForm = 'elliptical' | 'ring' | 'spiral_extended';

const createDistantVariedGalaxy = (
	x: number, y: number, z: number,
	scaleX: number, scaleY: number, scaleZ: number,
	rotX: number, rotY: number, rotZ: number,
	inHex: string, outHex: string,
	form: GalaxyForm
) => {
	const count = 60000;
	const geo = new THREE.BufferGeometry();
	const pos = new Float32Array(count * 3);
	const col = new Float32Array(count * 3);

	const inColor = new THREE.Color(inHex);
	const outColor = new THREE.Color(outHex);

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		let rawX = 0, rawY = 0, rawZ = 0;
		let normRadius = 0;

		if (form === 'elliptical') {
			const u = Math.random();
			const v = Math.random();
			const theta = u * 2.0 * Math.PI;
			const phi = Math.acos(2.0 * v - 1.0);
			normRadius = Math.cbrt(Math.random());

			rawX = normRadius * Math.sin(phi) * Math.cos(theta);
			rawY = normRadius * Math.sin(phi) * Math.sin(theta) * 0.5;
			rawZ = normRadius * Math.cos(phi);
		} else if (form === 'ring') {
			normRadius = Math.random();
			const ringRadius = 0.5 + normRadius * 0.5;
			const angle = Math.random() * Math.PI * 2;
			const spread = (Math.random() - 0.5) * 0.15;

			rawX = Math.cos(angle) * ringRadius + spread;
			rawY = (Math.random() - 0.5) * 0.1;
			rawZ = Math.sin(angle) * ringRadius + spread;
		} else {
			normRadius = Math.pow(Math.random(), 2.0);
			const spin = 1.3;
			const branches = 2;
			const spinAngle = normRadius * spin;
			const branchAngle = ((i % branches) / branches) * Math.PI * 2;

			const rx = (Math.random() - 0.5) * 0.3 * normRadius;
			const ry = (Math.random() - 0.5) * 0.1;
			const rz = (Math.random() - 0.5) * 0.3 * normRadius;

			rawX = Math.cos(branchAngle + spinAngle) * normRadius + rx;
			rawY = ry;
			rawZ = Math.sin(branchAngle + spinAngle) * normRadius + rz;
		}

		pos[i3 + 0] = rawX * scaleX;
		pos[i3 + 1] = rawY * scaleY;
		pos[i3 + 2] = rawZ * scaleZ;

		const mixedColor = inColor.clone().lerp(outColor, normRadius);
		const factor = 0.2 + (1 - normRadius) * 0.45;

		col[i3 + 0] = mixedColor.r * factor;
		col[i3 + 1] = mixedColor.g * factor;
		col[i3 + 2] = mixedColor.b * factor;
	}

	geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

	const mat = new THREE.PointsMaterial({
		size: 0.02,
		sizeAttenuation: true,
		depthWrite: false,
		transparent: true,
		alphaMap: starTexture,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
		opacity: 0.42
	});

	const mesh = new THREE.Points(geo, mat);
	mesh.position.set(x, y, z);
	mesh.rotation.set(rotX, rotY, rotZ);

	distantGalaxiesGroup.add(mesh);
};

createDistantVariedGalaxy(-48, 25, -55, 12, 12, 12, 0.8, 0.3, -0.4, "#e1bee7", "#4a148c", 'ring');
createDistantVariedGalaxy(52, -30, -60, 16, 3, 5, -0.5, 0.7, 0.3, "#bbdefb", "#0d47a1", 'spiral_extended');
createDistantVariedGalaxy(-40, -38, 45, 10, 6, 10, 1.1, -0.4, 0.6, "#e0f7fa", "#006064", 'elliptical');

scene.add(distantGalaxiesGroup);

/**
 * GUI Controls
 */
gui.add(params, "count", 100000, 700000, 10000).onFinishChange(generateMainGalaxy);
gui.add(params, "size", 0.005, 0.04, 0.001).onFinishChange(generateMainGalaxy);
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

const camera = new THREE.PerspectiveCamera(48, sizes.width / sizes.height, 0.1, 400);
camera.position.set(4, 3.2, 9.5);
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
 * AUDIO SETUP (Standard HTML5 Audio Element - 100% Reliable)
 */
const audioElement = document.getElementById('bg-audio') as HTMLAudioElement;
if (audioElement) {
    audioElement.volume = 0.35;
}

const startAudio = () => {
    if (audioElement) {
        audioElement.play().then(() => {
            console.log("Музыка успешно заиграла!");
        }).catch((err) => {
            console.log("Браузер ожидает взаимодействия:", err);
        });
    }
    window.removeEventListener('click', startAudio);
    window.removeEventListener('touchstart', startAudio);
};

window.addEventListener('click', startAudio);
window.addEventListener('touchstart', startAudio);

/**
 * Animation Loop
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	bgStars.rotation.y = elapsedTime * 0.0006;
	distantGalaxiesGroup.rotation.y = elapsedTime * 0.0012;

	if (mainGalaxy) {
		mainGalaxy.rotation.y = elapsedTime * 0.018;
	}
	if (lensRing) {
		lensRing.rotation.z = elapsedTime * 0.022;
	}

	controls.update();
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
