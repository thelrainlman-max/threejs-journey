/**
 * 3. ДАЛЁКИЕ ВСЕЛЕННЫЕ РАЗНЫХ ФОРМ
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
		let normRadius = 0; // Для расчёта градиента цвета

		if (form === 'elliptical') {
			// 1. Эллиптическая галактика-облако (3D-сфера/эллипсоид)
			const u = Math.random();
			const v = Math.random();
			const theta = u * 2.0 * Math.PI;
			const phi = Math.acos(2.0 * v - 1.0);
			normRadius = Math.cbrt(Math.random());

			rawX = normRadius * Math.sin(phi) * Math.cos(theta);
			rawY = normRadius * Math.sin(phi) * Math.sin(theta) * 0.5;
			rawZ = normRadius * Math.cos(phi);

		} else if (form === 'ring') {
			// 2. Кольцевая галактика (Ring Galaxy)
			normRadius = Math.random();
			const ringRadius = 0.5 + normRadius * 0.5; // Смещение от центра к кольцу
			const angle = Math.random() * Math.PI * 2;

			const spread = (Math.random() - 0.5) * 0.15;
			rawX = Math.cos(angle) * ringRadius + spread;
			rawY = (Math.random() - 0.5) * 0.1;
			rawZ = Math.sin(angle) * ringRadius + spread;

		} else {
			// 3. Вытянутая спираль (Spiral Extended)
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

		// Масштабирование по осям для приданию вытянутой формы
		pos[i3 + 0] = rawX * scaleX;
		pos[i3 + 1] = rawY * scaleY;
		pos[i3 + 2] = rawZ * scaleZ;

		const mixedColor = inColor.clone().lerp(outColor, normRadius);
		const factor = 0.2 + (1 - normRadius) * 0.45; // Мягкое свечение

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

// --- Расставляем 3 разные по форме и цвету Вселенные вдали ---

// 1. Кольцевая фиолетово-перламутровая галактика (Ring)
createDistantVariedGalaxy(
	-48, 25, -55, 
	12, 12, 12, 
	0.8, 0.3, -0.4, 
	"#e1bee7", "#4a148c", 
	'ring'
);

// 2. Вытянутая сине-ультрамариновая спираль (Spiral Extended)
createDistantVariedGalaxy(
	52, -30, -60, 
	16, 3, 5, 
	-0.5, 0.7, 0.3, 
	"#bbdefb", "#0d47a1", 
	'spiral_extended'
);

// 3. Эллиптическое небесно-голубое туманное облако (Elliptical)
createDistantVariedGalaxy(
	-40, -38, 45, 
	10, 6, 10, 
	1.1, -0.4, 0.6, 
	"#e0f7fa", "#006064", 
	'elliptical'
);

scene.add(distantGalaxiesGroup);
