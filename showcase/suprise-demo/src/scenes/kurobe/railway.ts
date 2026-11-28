import * as THREE from 'three';
import { GeometryBatch, vec, seededRandom } from '../../shared/geometry';

const railLevel = 18;
const trackZ = 8;
const axisZ = new THREE.Euler(Math.PI / 2, 0, 0);
const axisX = new THREE.Euler(0, 0, Math.PI / 2);
const material = (color: THREE.ColorRepresentation, roughness = .72, metalness = .12) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function finishes() {
  const loader = new THREE.TextureLoader();
  function surface(file: string, roughness: number, metalness: number, tile = true) {
    const url = new URL(`../assets/kurobe/railway/${file}.webp`, document.baseURI);
    const map = loader.load(url.href);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 6;
    if (tile) map.wrapS = map.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({ map, roughness, metalness });
  }
  const concrete = material('#97968a', .96, .02);
  concrete.map = loader.load(new URL('../assets/shared/concrete-color.jpg', document.baseURI).href);
  concrete.map.colorSpace = THREE.SRGBColorSpace;
  concrete.map.wrapS = concrete.map.wrapT = THREE.RepeatWrapping;
  concrete.map.anisotropy = 4;
  const glass = material('#243031', .16, .34);
  glass.transparent = true;
  glass.opacity = .71;
  glass.depthWrite = false;
  glass.side = THREE.DoubleSide;
  return {
    orange: surface('paint', .43, .27), roof: surface('roof', .52, .35),
    louverTop: material('#676473', .43, .4), louverEdge: material('#24252a', .75, .2),
    polished: material('#d0d3ce', .21, .76), lampGlass: material('#f4f2dc', .15, .44),
    side32: surface('loco-32', .45, .24, false), side31: surface('loco-31', .45, .24, false),
    paintBlue: surface('blue', .8, .2), gantry: surface('gantry', .89, .27),
    ballast: surface('ballast', .99, .02), wood: surface('timber', .95, .03), concrete,
    destination: surface('destination', .52, .15, false),
    platform: surface('platform', .97, .02),
    steel: material('#677072', .46, .65), zinc: material('#aeb4b0', .37, .61),
    soot: material('#272b2b', .78, .2), rubber: material('#242727', .95, .04),
    charcoal: material('#414447', .67, .27), rust: material('#765341', .88, .24),
    porcelain: material('#b8b9a2', .38, .08), green: material('#505a4f', .74, .16),
    white: material('#deded3', .53, .23), red: material('#b12d32', .57, .22),
    greyRoof: material('#9b9d9c', .69, .26), cushion: material('#626f6c', .95, 0),
    seatBack: material('#606661', .75), interior: material('#a4a894', .87, .04),
    cabGlass: glass, amber: material('#e6d6a6', .27, .18),
    oxide: material('#4d4740', .88, .17), warning: material('#d5b969', .83, .06),
  };
}

type Paints = ReturnType<typeof finishes>;
type Point = [number, number, number];

function rod(batch: GeometryBatch, from: Point, to: Point, gauge: number, mat: THREE.Material) {
  const a = vec(...from), b = vec(...to), delta = b.sub(a);
  const orientation = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(vec(0, 1, 0), delta.clone().normalize())
  );
  a.addScaledVector(delta, .5);
  batch.cylinder(gauge, gauge, delta.length(), a.x, a.y, a.z, mat, 7, orientation);
}

// A gently crowned sheet-metal extrusion. Its folded edges cast the drip-rail shadow.
function roofShell(batch: GeometryBatch, length: number, width: number, eave: number, arch: number, mat: THREE.Material) {
  const profile = new THREE.Shape();
  const half = width / 2;
  profile.moveTo(-half, 0);
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    profile.lineTo(-half + width * t, .046 + arch * Math.sin(Math.PI * t) ** .72);
  }
  profile.lineTo(half, 0);
  profile.closePath();
  const g = new THREE.ExtrudeGeometry(profile, { depth: length, bevelEnabled: false });
  g.translate(0, 0, -length / 2);
  g.rotateY(Math.PI / 2);
  batch.add(g, mat, 0, eave, 0);
}

function underframe(b: GeometryBatch, p: Paints, length: number) {
  b.box(length - .15, .29, 1.77, 0, .77, 0, p.charcoal);
  b.box(length * .4, .38, 1.26, -.15, .54, 0, p.soot);
  for (const end of [-1, 1]) {
    const truck = end * (length / 2 - 1.64);
    b.box(1.58, .25, .93, truck, .44, 0, p.soot);
    for (const s of [-1, 1]) {
      b.box(1.76, .17, .11, truck, .4, s * .61, p.charcoal);
      b.box(1, .075, .15, truck, .53, s * .62, p.soot);
      for (const offset of [-.59, .59]) {
        const x = truck + offset;
        b.cylinder(.345, .345, .105, x, .326, s * .4, p.oxide, 18, axisZ);
        b.cylinder(.325, .325, .105, x, .326, s * .445, p.steel, 18, axisZ);
        b.cylinder(.102, .102, .13, x, .326, s * .535, p.charcoal, 10, axisZ);
        b.box(.25, .18, .16, x, .34, s * .655, p.oxide, .035);
      }
      for (let j = 0; j < 4; j++)
        b.box(.88 - j * .12, .032, .104, truck, .18 + j * .039, s * .66, p.oxide);
    }
    b.box(.47, .17, .17, end * length / 2, .64, 0, p.charcoal);
    b.box(.19, .22, .27, end * (length / 2 + .18), .65, .04, p.oxide, .035);
    for (const s of [-1, 1])
      b.tube([vec(end * length * .48, .7, s * .49), vec(end * (length * .5 + .04), .28, s * .47), vec(end * length * .51, .32, s * .2)], .029, p.rubber, 7);
  }
  for (const s of [-1, 1]) {
    b.cylinder(.145, .145, 1.05, .65, .52, s * .71, p.soot, 12, axisX);
    b.box(.82, .35, .27, -.62, .52, s * .76, p.charcoal, .025);
    b.box(length * .78, .045, .034, 0, .69, s * .9, p.rust);
  }
}

function insulator(b: GeometryBatch, p: Paints, x: number, y: number, z: number) {
  b.cylinder(.048, .057, .23, x, y + .105, z, p.steel, 8);
  for (let level = 0; level < 3; level++)
    b.cylinder(.086, .055, .045, x, y + level * .065, z, p.porcelain, 9);
}

function pantograph(b: GeometryBatch, p: Paints, x: number, foot: number, up: boolean) {
  const y0 = foot + .22, mid = y0 + (up ? .72 : .13), top = y0 + (up ? 1.43 : .29);
  for (const s of [-1, 1]) {
    for (const dx of [-.62, .62]) insulator(b, p, x + dx, foot, s * .41);
    b.box(1.62, .105, .09, x, y0, s * .42, p.charcoal);
    rod(b, [x - .45, y0, s * .35], [x + .84, mid, s * .31], .028, p.charcoal);
    rod(b, [x + .84, mid, s * .31], [x - .34, top, s * .28], .022, p.steel);
    rod(b, [x + .45, y0, s * .35], [x - .8, mid, s * .31], .025, p.charcoal);
    rod(b, [x - .8, mid, s * .31], [x - .34, top, s * .28], .022, p.steel);
  }
  b.box(.2, .045, 1.46, x - .34, top, 0, p.soot);
  for (const s of [-1, 1])
    rod(b, [x - .34, top, s * .71], [x - .34, top - .11, s * .88], .021, p.steel);
}

function locomotive(b: GeometryBatch, p: Paints, number: number, raised: boolean) {
  const length = 8.45, half = length / 2, side = 1.062, eave = 3.08;
  underframe(b, p, length);
  b.box(length, .16, 2.16, 0, .91, 0, p.charcoal, .025);
  b.box(length - .26, 1.02, side * 2, 0, 1.48, 0, p.orange, .087);
  b.box(5.17, 1.22, 2.095, 0, 2.48, 0, p.orange, .02);
  for (const s of [-1, 1]) {
    b.plane(5.17, 1.95, 0, 2.006, s * (side + .004), number === 32 ? p.side32 : p.side31, s === 1 ? 0 : Math.PI);
    b.box(length - .16, .1, .026, 0, 1.005, s * (side + .013), p.orange);
    b.box(length, .105, .088, 0, 3.035, s * side, p.orange);
    b.box(length + .12, .058, .068, 0, 3.118, s * (side + .034), p.charcoal);
    for (const end of [-1, 1]) {
      const x = end * 3.39;
      b.box(1.51, .086, .057, x, 2.009, s * side, p.orange);
      // Recessed strip seals separate the glazing from the enamel pillars.
      b.box(1.40, .055, .061, x, 2.082, s * side, p.rubber);
      b.box(1.40, .048, .061, x, 2.964, s * side, p.rubber);
      for (const dx of [-.674, .075, .674])
        b.box(.052, .89, .058, x + dx, 2.527, s * side, p.rubber);
      b.box(1.35, .868, .022, x, 2.526, s * (side - .014), p.cabGlass);
      b.box(.71, .018, .07, x - .292, 2.067, s * (side + .014), p.zinc);
      for (const dx of [-.72, .08, .72])
        b.box(dx === .08 ? .057 : .103, 1.03, .081, x + dx, 2.51, s * side, p.orange);
      b.box(.7, .022, .045, x - .29, 2.085, s * side, p.rubber);
      b.box(.64, .025, .025, x + .39, 2.32, s * side, p.zinc);
      b.box(.023, .87, .018, x + .15, 1.49, s * (side + .015), p.oxide);
      b.box(.56, .027, .038, x - .17, 1.064, s * (side + .023), p.oxide);
      b.box(.11, .028, .045, x + .033, 1.84, s * (side + .03), p.steel);
      b.box(.35, .092, .014, x - .20, 1.17, s * (side + .014), p.rubber, .014);
      for(const dy of [-.018, .018])
        b.box(.32, .012, .022, x - .2, 1.17 + dy, s * (side + .025), p.charcoal);
      for (let i = 0; i < 2; i++) b.box(.57, .054, .23, x - .18, .58 + i * .205, s * (side + .035), p.charcoal);
      rod(b, [x + .57, 1.13, s * (side + .07)], [x + .57, 1.89, s * (side + .07)], .018, p.zinc);
    }
  }
  for (const end of [-1, 1]) {
    const x = end * (half - .046);
    // Stepped end shell with a slightly protruding lamp panel and rolled corners.
    b.box(.39, .945, 2.105, x - end * .115, 1.501, 0, p.orange, .101);
    b.box(.29, .218, 2.053, x - end * .045, 1.086, 0, p.orange, .058);
    b.box(.16, .08, 2.035, x + end * .006, 1.957, 0, p.orange, .036);
    b.box(.187, .104, 2.047, x, 3.018, 0, p.charcoal, .034);
    b.box(.13, .085, 2.015, x, 2.01, 0, p.rubber, .026);
    b.box(.052, .028, 2.003, x + end * .062, 1.984, 0, p.polished);
    b.box(.075, .05, 1.91, x + end * .012, 2.952, 0, p.rubber);
    for (const s of [-1, 1]) {
      b.box(.095, 1.00, .105, x - end * .013, 2.5, s * .986, p.rubber, .021);
      b.box(.087, 1.02, .054, x - end * .03, 2.51, s * 1.029, p.orange, .021);
      b.box(.032, .88, .921, x - .009 * end, 2.506, s * .51, p.cabGlass);
      b.box(.052, .041, .91, x + end * .025, 2.065, s * .508, p.rubber);
      rod(b, [x + end * .053, 2.11, s * .41], [x + end * .053, 2.65, s * .66], .012, p.rubber);
      b.box(.105, .41, .39, x + end * .079, 1.64, s * .773, p.orange, .058);
      b.cylinder(.159, .166, .117, x + end * .145, 1.662, s * .768, p.charcoal, 18, axisX);
      b.cylinder(.145, .151, .059, x + end * .214, 1.662, s * .768, p.polished, 18, axisX);
      b.cylinder(.113, .119, .026, x + end * .249, 1.662, s * .768, p.amber, 18, axisX);
      b.sphere(.099, x + end * .263, 1.662, s * .768, p.lampGlass, vec(.35, 1, 1));
      rod(b, [x + end * .126, 1.095, s * .97], [x + end * .126, 1.53, s * .97], .015, p.polished);
      b.box(.135, .067, .155, x + end * .078, 1.163, s * .936, p.oxide);
      b.box(.205, .052, .29, x + end * .104, .915, s * .77, p.steel);
      for (const dx of [-.81,-.26,.26,.81])
        b.cylinder(.022, .024, .039, x + end * .099, 1.063, dx, p.oxide, 6, axisX);
      b.cylinder(.058, .066, .05, x + end * .095, 1.24, s * .8, p.red, 12, axisX);
      b.box(.38, .16, .42, x - end * .65, 1.93, s * .5, p.cushion, .035);
      b.box(.09, .45, .41, x - end * .85, 2.13, s * .5, p.cushion, .035);
    }
    b.box(.076, .962, .068, x + end * .009, 2.494, 0, p.rubber);
    b.box(.056, .929, .035, x + end * .041, 2.497, 0, p.zinc);
    b.box(.155, .395, .91, x + end * .081, 1.433, 0, p.orange, .053);
    b.box(.07, .19, .61, x + end * .146, 1.408, 0, p.charcoal, .032);
    b.cylinder(.096, .097, .412, x + end * .169, 1.391, 0, p.steel, 11, axisZ);
    b.box(.37, .2, 1.83, x - end * .22, 1.97, 0, p.green);
  }
  roofShell(b, length + .22, 2.23, eave, .11, p.roof);
  for (const z of [-.68, 0, .68]) {
    // Open, shadowed air gap below the bent cover of each resistor bank.
    b.box(4.17, .023, .49, .13, 3.232, z, p.louverEdge);
    b.box(4.13, .185, .262, .13, 3.321, z, p.louverEdge, .014);
    for (const x of [-1.74, -.52, .73, 2.01])
      b.box(.046, .095, .468, x, 3.277, z, p.oxide);
    b.box(4.43, .07, .49, .13, 3.432, z, p.louverTop, .025);
    for (const s of [-1,1])
      b.box(4.41, .052, .028, .13, 3.402, z + s * .23, p.charcoal);
  }
  for (const x of [-3.05, 3.02])
    b.box(1.48, .046, 1.54, x, 3.218, 0, p.charcoal, .023);
  pantograph(b, p, -3.0, 3.25, raised);
  b.cylinder(.115,.115,.65,-3.1,3.51,0,p.green,14,axisZ);
  for (const z of [-.34,-.26,-.18,-.1,0,.1,.18,.26,.34])
    b.cylinder(.126,.126,.025,-3.1,3.51,z,p.charcoal,14,axisZ);
  for (const s of [-1,1]) {
    rod(b,[-3.72,3.46,s*.44],[-2.23,3.46,s*.44],.027,p.zinc);
    b.tube([vec(-2.73,3.44,s*.39),vec(-2.48,3.51,s*.55),vec(-2.29,3.39,s*.91)],.021,p.steel,9);
  }
  for (const s of [-1, 1]) insulator(b, p, 2.63, 3.22, s * .4);
  b.box(1.1, .13, .67, 3.1, 3.25, 0, p.green, .045);
  b.tube([vec(2.52, 3.49, -.4), vec(2.82, 3.59, -.4), vec(3.31, 3.49, .3)], .024, p.oxide, 7);
}

function coach(b: GeometryBatch, p: Paints) {
  const len = 10, half = len / 2, side = 1.126, roofY = 3.24;
  underframe(b, p, len);
  b.box(len - .08, .2, 2.17, 0, .91, 0, p.charcoal);
  b.box(len - .13, .14, 2.18, 0, 1.035, 0, p.interior);
  for (const s of [-1, 1]) {
    b.box(len, .94, .099, 0, 1.52, s * side, p.white, .025);
    b.box(len - .018, .34, .009, 0, 1.33, s * (side + .052), p.red);
    b.box(len - .018, .095, .01, 0, 1.636, s * (side + .052), p.red);
    b.box(len, .195, .1, 0, 3.16, s * side, p.white, .018);
    b.box(len, .045, .052, 0, 3.237, s * (side + .047), p.zinc);
    const centers = [-4.48, -3.29, -1.97, -.65, .65, 1.97, 3.29, 4.48];
    for (const x of centers) {
      const door = Math.abs(x) > 4;
      const pane = door ? .57 : 1.105;
      b.box(pane + .074, .044, .072, x, 2.007, s * side, p.rubber);
      b.box(pane + .074, .045, .072, x, 3.027, s * side, p.rubber);
      b.box(pane, .99, .017, x, 2.515, s * (side - .027), p.cabGlass);
      for (const edge of [-1, 1]) {
        b.box(.03, 1.02, .072, x + edge * (pane / 2 + .012), 2.516, s * side, p.rubber);
        b.box(.084, 1.11, .093, x + edge * (pane / 2 + .066), 2.516, s * side, p.white);
      }
      if (door) {
        for (const edge of [-1, 1])
          b.box(.023, 1.94, .012, x + edge * .431, 2.014, s * (side + .051), p.oxide);
        b.box(.56, .065, .183, x, .93, s * (side + .051), p.steel);
        rod(b, [x + .32, 1.69, s * (side + .076)], [x + .32, 1.94, s * (side + .076)], .014, p.zinc);
      } else {
        b.box(.021, 1.007, .032, x + .12, 2.516, s * side, p.zinc);
        b.box(.99, .07, .385, x, 1.49, s * .68, p.cushion, .033);
        b.box(.982, .35, .101, x, 1.673, s * .859, p.seatBack, .025);
      }
    }
    for (const x of [-4.95, -3.93, 3.93, 4.95])
      b.box(.114, 1.17, .094, x, 2.51, s * side, p.white);
    b.plane(.62, .18, 3.25, 1.824, s * (side + .052), p.destination, s === 1 ? 0 : Math.PI);
  }
  for (const e of [-1, 1]) {
    const x = e * (half - .034);
    b.box(.084, .97, 2.18, x, 1.54, 0, p.white, .025);
    b.box(.015, .34, 2.16, e * (half + .015), 1.33, 0, p.red);
    b.box(.015, .095, 2.16, e * (half + .015), 1.636, 0, p.red);
    b.box(.085, .16, 2.19, x, 3.15, 0, p.white);
    for (const s of [-1, 1]) {
      b.box(.08, 1.08, .14, x, 2.52, s * .99, p.white);
      b.box(.04, .98, .46, x, 2.53, s * .68, p.cabGlass);
      b.box(.11, 1.14, .079, x, 2.52, s * .39, p.white);
    }
    b.box(.12, 1.77, .67, x, 1.95, 0, p.charcoal, .04);
    b.box(.068, .53, .467, x + e * .055, 2.58, 0, p.cabGlass);
    b.box(.39, .07, .62, x + e * .1, .986, 0, p.steel);
  }
  roofShell(b, len + .12, 2.39, roofY, .21, p.greyRoof);
  for (const x of [-3.55, -1.19, 1.19, 3.55]) {
    const points = Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      return vec(x, roofY + .05 + .21 * Math.sin(Math.PI * t) ** .72, -1.182 + t * 2.364);
    });
    b.tube(points, .009, p.steel, 12);
  }
}

function trackAndPlatform(b: GeometryBatch, p: Paints) {
  const random = seededRandom(8803);
  // Layered chair, rail web and polished running face have independent widths.
  const lo = -110, hi = 114, width = hi - lo, center = (lo + hi) / 2;
  b.box(width, 1.52, 5.87, center, 16.49, trackZ - .26, p.concrete);
  b.box(width, .41, 4.62, center, 17.42, trackZ, p.ballast);
  for (let x = lo + .35; x < hi; x += .63) {
    b.box(.174, .12, 1.76, x, 17.65, trackZ + .035 * (random() - .5), p.wood, 0,
      new THREE.Euler(0, (random() - .5) * .028, 0));
    for (const s of [-1, 1])
      b.box(.191, .038, .235, x, 17.725, trackZ + s * .398, p.oxide);
  }
  for (const s of [-1, 1]) {
    const z = trackZ + s * .398;
    b.box(width, .038, .148, center, 17.763, z, p.rust);
    b.box(width, .169, .042, center, 17.863, z, p.rust);
    b.box(width, .054, .065, center, 17.974, z, p.steel);
  }
  // Lineside drainage and concrete parapet on the gorge side.
  b.box(width, .75, .265, center, 17.81, 5.13, p.concrete);
  b.box(width, .086, .33, center, 18.229, 5.13, p.concrete);
  for (let x = lo + 1; x < hi; x += 3.4) {
    b.cylinder(.029, .038, .82, x, 18.65, 5.14, p.gantry, 8);
    b.box(.12, .042, .135, x, 18.28, 5.14, p.steel);
  }
  for (const y of [18.5, 19.02])
    rod(b, [lo, y, 5.14], [hi, y, 5.14], .019, p.steel);
  for (let i = 0; i < 3; i++)
    b.box(width, .037, .047, center, 17.68, 5.97 + i * .1, p.rust);

  const platformCenter = 11.5;
  b.box(133, 2.89, 10.75, platformCenter, 17.37, 14.925, p.platform);
  b.box(133, .11, 10.75, platformCenter, 18.865, 14.925, p.platform);
  for (let x = -54.5; x < 78; x += 1.05) {
    b.box(1.039, .125, .59, x, 18.871, 9.847, p.platform);
    b.box(.93, .009, .116, x, 18.939, 10.047, p.warning);
  }
  for (let x = -52; x < 78; x += 5.32) {
    b.box(.44, .015, .21, x, 18.929, 10.417, p.charcoal);
    for (let j=0; j<7; j++) b.box(.023, .012, .184, x-.184+j*.061, 18.938, 10.417, p.steel);
    b.box(.06, 2.74, .12, x, 17.409, 20.31, p.platform);
  }
  for (let x = -52; x < 76; x += 5.32)
    b.box(.017, .011, 9.84, x, 18.924, 15.31, p.oxide);
}

function overhead(b: GeometryBatch, p: Paints) {
  const posts = [-108, -84, -60, -39, -21, -4, 18, 40, 62, 84, 108];
  let previous: number | undefined;
  for (const [index, x] of posts.entries()) {
    const high = 24.83;
    // Alternate lattice portals and the original concrete cantilever masts.
    if (index % 3 === 2) {
      const z1 = 4.71, z2 = 10.75;
      for (const z of [z1, z2]) {
        const bottom = z === z2 ? 18.92 : 17.14;
        const spread = .22;
        for (const dx of [-spread, spread])
          b.box(.063, high - bottom, .102, x + dx, (high + bottom) / 2, z, p.gantry);
        for (let y = bottom + .12; y < high - .12; y += .89) {
          const a = Math.round((y - bottom) / .89) % 2 === 1 ? spread : -spread;
          b.beam(vec(x + a, y, z), vec(x - a, Math.min(y + .88, high), z), .049, .047, p.rust);
        }
        b.box(.62, .13, .43, x, bottom + .06, z, p.concrete);
      }
      for (const y of [high, high - .49]) {
        b.box(.13, .068, z2 - z1 + .28, x, y, (z1 + z2) / 2, p.gantry);
      }
      for (let z = z1; z < z2; z += .78)
        b.beam(vec(x, high, z), vec(x, high - .49, z + .78), .042, .05, p.rust);
      insulator(b, p, x, high - 1.04, 7.97);
      rod(b, [x, high - .92, 7.97], [x, high - .46, 7.97], .026, p.steel);
      rod(b, [x, high - .12, z1], [x, 23.35, 7.4], .033, p.steel);
    } else {
      const z = 4.65, base = 17.12;
      b.cylinder(.088, .164, high - base, x, (base + high) / 2, z, p.gantry, 10);
      b.cylinder(.19, .209, .32, x, base + .09, z, p.concrete, 10);
      b.box(.18, .13, 3.95, x, high - .41, z + 1.62, p.gantry);
      b.beam(vec(x, high - 2.04, z), vec(x, high - .46, 7.87), .057, .062, p.gantry);
      b.box(.248, .156, .234, x, high - 2.04, z, p.rust);
      insulator(b, p, x, high - 1.03, 7.96);
      rod(b, [x, high - .91, 7.96], [x, high - .42, 7.96], .023, p.steel);
      b.cylinder(.142, .102, .145, x, high - 1.31, z - .18, p.porcelain, 9);
    }
    const stagger = index % 2 ? .085 : -.085;
    rod(b, [x, 23.78, 7.98], [x - .3, 22.896, trackZ + stagger], .015, p.steel);
    if (previous !== undefined) {
      const a = previous, span = x - a;
      const messenger = (t: number) => 23.83 - .39 * Math.sin(Math.PI * t);
      const contactZ = (t: number) => trackZ + (2 * t - 1) * stagger;
      b.tube(Array.from({ length: 7 }, (_, i) => vec(a + span * i / 6, messenger(i / 6), trackZ)), .017, p.oxide, 6);
      rod(b, [a, 22.896, contactZ(0)], [x, 22.896, contactZ(1)], .018, p.oxide);
      for (const t of [.24, .49, .74])
        rod(b, [a + span * t, 22.896, contactZ(t)], [a + span * t, messenger(t), trackZ], .009, p.steel);
      b.tube([vec(a, 23.85, 4.48), vec(a + span / 2, 23.14, 4.48), vec(x, 23.85, 4.48)], .012, p.soot, 6);
    }
    previous = x;
  }
}

function stationStairs(b: GeometryBatch, p: Paints) {
  const upper = 23.32, base = 18.92, start = -3.8, end = 3.8, z0 = 16.4, z1 = 18.75;
  b.box(3.3, .17, 2.42, -5.45, upper - .085, (z0 + z1) / 2, p.paintBlue);
  for (const z of [z0, z1]) {
    for (const x of [-6.92, -4.02]) {
      b.box(.19, upper - base, .16, x, (upper + base) / 2, z, p.paintBlue);
      b.box(.32, .08, .3, x, base + .04, z, p.gantry);
    }
    for (const [x0, x1] of [[-6.97, -4.05], [-4.05, -6.97]])
      b.beam(vec(x0, base + .25, z), vec(x1, upper - .23, z), .085, .071, p.paintBlue);
    b.beam(vec(start, upper - .14, z), vec(end, base - .11, z), .264, .12, p.paintBlue);
    b.box(3.37, .258, .147, -5.48, upper - .165, z, p.paintBlue);
  }
  for (let i = 0; i < 28; i++) {
    const tread = (end - start) / 28, rise = (upper - base) / 28;
    const x = start + (i + .5) * tread;
    const y = upper - (i + 1) * rise;
    b.box(tread + .03, .062, 2.25, x, y - .031, (z0 + z1) / 2, p.steel);
    b.box(.028, rise, 2.25, x + tread * .45, y - rise / 2, (z0 + z1) / 2, p.charcoal);
    b.box(.048, .019, 2.26, x + tread * .43, y + .004, (z0 + z1) / 2, p.zinc);
  }
  for (const z of [z0, z1]) {
    for (let i = 0; i <= 5; i++) {
      const t = i / 5, x = start + t * (end - start), y = upper - t * (upper - base);
      b.box(.107, 1.13, .104, x, y + .48, z, p.paintBlue);
      b.box(.135, .096, .126, x, y + .928, z, p.rust);
    }
    for (const h of [.34, .6, 1.02]) {
      b.beam(vec(start, upper + h, z), vec(end, base + h, z), h > 1 ? .124 : .055, h > 1 ? .094 : .055, p.paintBlue);
      b.box(3.29, h > 1 ? .127 : .054, .087, -5.45, upper + h, z, p.paintBlue);
    }
    for (const x of [-7.01, -5.44])
      b.box(.115, 1.13, .107, x, upper + .5, z, p.paintBlue);
  }
  // The landing returns away from the viewing corridor.
  for (const h of [.34, .6, 1.02])
    b.box(.089, h > 1 ? .128 : .054, z1 - z0, -7.03, upper + h, (z1 + z0) / 2, p.paintBlue);
}

export function buildRailway(scene: THREE.Scene): void {
  const p = finishes();
  const infrastructure = new GeometryBatch();
  trackAndPlatform(infrastructure, p);
  overhead(infrastructure, p);
  infrastructure.at(-17, -2, 0, () => stationStairs(infrastructure, p));
  const group = new THREE.Group();
  group.name = '欅平・狭軌電気鉄道';
  infrastructure.flush(group);
  const train = new GeometryBatch();
  train.at(-16.05, trackZ, 0, () => locomotive(train, p, 32, true), railLevel);
  train.at(-24.85, trackZ, 0, () => locomotive(train, p, 31, false), railLevel);
  for (let i = 0; i < 5; i++)
    train.at(-6.56 + i * 10.39, trackZ, 0, () => coach(train, p), railLevel);
  train.flush(group);
  const contact = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(new URL('../assets/kurobe/railway/contact.webp', document.baseURI).href),
    transparent: true, depthWrite: false, opacity: .81, polygonOffset: true, polygonOffsetFactor: -1,
  });
  const shadowBatch = new GeometryBatch();
  for (const [x, len] of [[-16.05, 8.45], [-24.85, 8.45], ...Array.from({length: 5}, (_, i) => [-6.56+i*10.39, 10])])
    shadowBatch.add(new THREE.PlaneGeometry(len + .72, 3.02), contact, x, 17.717, trackZ, new THREE.Euler(-Math.PI / 2, 0, 0));
  shadowBatch.flush(group);
  scene.add(group);
}
