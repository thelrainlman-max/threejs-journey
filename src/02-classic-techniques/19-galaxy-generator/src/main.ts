import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

import "./style.css";

/**
 * Base
 */
// Debug
const gui = new dat.GUI({ width: 400 });

// Canvas
const canvas: HTMLElement = document.querySelector("canvas.webgl")!;

// Scene
const scene = new THREE.Scene();

const params = {
	count: 700000,
	size: 0.01,
	radius: 6,
	branches: 3,
	spin: 2,
	randomness: 0.2,
	randomnessPower: 3,
	inColor: "#ff6030",
	outColor: "#1b3984",
};

let geometry: THREE.BufferGeometry | null = null;
let material: THREE.PointsMaterial | null = null;
let points: THREE.Points | null = null;

const generateGalaxy = () => {
	/**
	 * Destroy old galaxy
	 */
	if (points !== null) {
		geometry?.dispose();
		material?.dispose();
		scene.remove(points);
	}

	/**
	 * Galaxy
	 */
	geometry = new THREE.BufferGeometry();
	const positions = new Float32Array(params.count * 3);
	const colors = new Float32Array(params.count * 3);

	const inColor = new THREE.Color(params.inColor);
	const outColor = new THREE.Color(params.outColor);

	for (let i = 0; i < params.count; i++) {
		const i3 = i * 3;

		/**
		 * Position
		 */
		const radius = Math.random() * params.radius;
		const spinAngle = radius * params.spin;
		const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

		const randomX =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness;
		const randomY =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness;
		const randomZ =
			Math.pow(Math.random(), params.randomnessPower) *
			(Math.random() < 0.5 ? 1 : -1) *
			params.randomness;

		positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
		positions[i3 + 1] = randomY;
		positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

		/**
		 * Color
		 */
		const mixedColor = inColor.clone();
		mixedColor.lerp(outColor, radius / params.radius);

		colors[i3 + 0] = mixedColor.r;
		colors[i3 + 1] = mixedColor.g;
		colors[i3 + 2] = mixedColor.b;
	}

	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

	/**
	 * Material
	 */
	material = new THREE.PointsMaterial({
		size: params.size,
		sizeAttenuation: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		vertexColors: true,
	});

	/**
	 * Points
	 */
	points = new THREE.Points(geometry, material);
	scene.add(points);
};

generateGalaxy();

/**
 * GUI Controls
 */
gui.add(params, "count", 100, 1000000, 100).onFinishChange(generateGalaxy);
gui.add(params, "size", 0.001, 0.1, 0.001).onFinishChange(generateGalaxy);
gui.add(params, "radius", 0.01, 20, 0.01).onFinishChange(generateGalaxy);
gui.add(params, "branches", 2, 20, 1).onFinishChange(generateGalaxy);
gui.add(params, "spin", -5, 5, 0.001).onFinishChange(generateGalaxy);
gui.add(params, "randomness", 0, 2, 0.001).onFinishChange(generateGalaxy);
gui.add(params, "randomnessPower", 1, 10, 0.001).onFinishChange(generateGalaxy);
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
	75,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Background Space (Фоновый космос из 5000 звёзд)
 */
const bgStarsCount = 5000;
const bgPositions = new Float32Array(bgStarsCount * 3);
const bgColors = new Float32Array(bgStarsCount * 3);

for (let i = 0; i < bgStarsCount; i++) {
	const i3 = i * 3;
	bgPositions[i3] = (Math.random() - 0.5) * 100;
	bgPositions[i3 + 1] = (Math.random() - 0.5) * 100;
	bgPositions[i3 + 2] = (Math.random() - 0.5) * 100;

	bgColors[i3] = 0.5 + Math.random() * 0.5;
	bgColors[i3 + 1] = 0.6 + Math.random() * 0.4;
	bgColors[i3 + 2] = 0.8 + Math.random() * 0.2;
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
bgGeometry.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

const bgMaterial = new THREE.PointsMaterial({
	size: 0.08,
	sizeAttenuation: true,
	depthWrite: false,
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

	// Вращение фонового космоса
	bgStars.rotation.y = elapsedTime * 0.02;

	// Вращение главной галактики
	if (points) {
		points.rotation.y = elapsedTime * 0.05;
	}

	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
