import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { SCENE_CONFIG } from "../../config/sceneConfig";
import type { MaterialLibrary } from "../shared/MaterialLibrary";

export function buildLighting(materials: MaterialLibrary): THREE.Group {
  RectAreaLightUniformsLib.init();
  const root = new THREE.Group();
  root.name = "Lighting";

  const hemisphere = new THREE.HemisphereLight(0xe8ece8, 0x9a8777, 1.28);
  root.add(hemisphere);

  const ambient = new THREE.AmbientLight(0xfffbf5, 0.22);
  root.add(ambient);

  const daylight = new THREE.DirectionalLight(0xfff4e5, 0.92);
  daylight.name = "window-daylight-shadow";
  daylight.position.set(-0.8, 3.2, -2.7);
  daylight.target.position.set(0.25, 0.7, 0.65);
  daylight.castShadow = true;
  daylight.shadow.mapSize.set(1536, 1536);
  daylight.shadow.camera.left = -3;
  daylight.shadow.camera.right = 3;
  daylight.shadow.camera.top = 3.5;
  daylight.shadow.camera.bottom = -1.5;
  daylight.shadow.camera.near = 0.1;
  daylight.shadow.camera.far = 8;
  daylight.shadow.bias = -0.0003;
  daylight.shadow.normalBias = 0.025;
  daylight.shadow.radius = 4;
  daylight.shadow.intensity = 0.4;
  root.add(daylight, daylight.target);

  const windowFill = new THREE.RectAreaLight(0xf3f5ee, 6.6, 1.45, 1.3);
  windowFill.name = "window-soft-fill";
  windowFill.position.set(0, 1.56, -1.43);
  windowFill.lookAt(0, 1.2, 1);
  root.add(windowFill);

  const shadeMaterial = materials.trim.clone();
  shadeMaterial.name = "ceiling-light-emissive";
  shadeMaterial.emissive.set(0xfff4e5);
  shadeMaterial.emissiveIntensity = 0.68;
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.065, 32), shadeMaterial);
  shade.name = "ceiling-light-fixture";
  shade.position.set(0, SCENE_CONFIG.room.height - 0.055, 0.15);
  shade.castShadow = false;
  root.add(shade);

  const ceilingLight = new THREE.PointLight(0xffe7cf, 1.3, 4.2, 2);
  ceilingLight.name = "ceiling-fill";
  ceilingLight.position.set(0, SCENE_CONFIG.room.height - 0.16, 0.15);
  ceilingLight.castShadow = false;
  root.add(ceilingLight);
  return root;
}
