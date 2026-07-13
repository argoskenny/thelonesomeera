import * as THREE from "three";

export class MaterialLibrary {
  readonly wall = this.standard("wall", 0xd8d1c8, 0.94);
  readonly ceiling = this.standard("ceiling", 0xe3ded7, 0.95);
  readonly trim = this.standard("trim", 0xe6e1da, 0.82);
  readonly floor = new THREE.MeshStandardMaterial({
    name: "floor",
    color: 0xffffff,
    roughness: 0.68,
    metalness: 0,
    vertexColors: true,
    emissive: 0xb49a7d,
    emissiveIntensity: 0.62,
  });
  readonly wood = this.standard("warm-wood", 0x967052, 0.62);
  readonly woodLight = this.standard("light-wood", 0xa17d5c, 0.65);
  readonly woodDark = this.standard("dark-wood", 0x6f5039, 0.58);
  readonly desktop = this.standard("desktop", 0x956b49, 0.54);
  readonly cabinetWhite = this.standard("cabinet-white", 0xd6cec4, 0.78);
  readonly blackMetal = new THREE.MeshStandardMaterial({
    name: "black-metal",
    color: 0x171819,
    metalness: 0.72,
    roughness: 0.39,
  });
  readonly darkFrame = new THREE.MeshStandardMaterial({
    name: "window-frame",
    color: 0x555b5e,
    metalness: 0.34,
    roughness: 0.46,
  });
  readonly blackFabric = this.standard("black-fabric", 0x151617, 0.9);
  readonly chairMesh = new THREE.MeshStandardMaterial({
    name: "chair-mesh",
    color: 0x222525,
    roughness: 0.92,
    metalness: 0,
    transparent: true,
    opacity: 0.74,
    side: THREE.DoubleSide,
  });
  readonly blackPlastic = this.standard("black-plastic", 0x111214, 0.52);
  readonly blind = this.standard("blind", 0xcbc3b9, 0.91);
  readonly paper = this.standard("paper", 0xe7e3dc, 0.88);
  readonly pot = this.standard("ceramic-pot", 0xbcb4aa, 0.76);
  readonly soil = this.standard("soil", 0x30261e, 1);
  readonly screen = new THREE.MeshStandardMaterial({
    name: "laptop-screen",
    color: 0x26343a,
    emissive: 0x9eb4b6,
    emissiveIntensity: 0.17,
    roughness: 0.32,
    metalness: 0.08,
  });
  readonly glass = new THREE.MeshPhysicalMaterial({
    name: "window-glass",
    color: 0xdbe5e5,
    transmission: 0.82,
    opacity: 0.42,
    transparent: true,
    roughness: 0.08,
    metalness: 0,
    ior: 1.45,
    depthWrite: false,
  });
  readonly foliage = new THREE.MeshStandardMaterial({
    name: "foliage",
    color: 0xffffff,
    roughness: 0.88,
    vertexColors: true,
    emissive: 0x45602f,
    emissiveIntensity: 0.46,
  });
  readonly foliageExterior = new THREE.MeshStandardMaterial({
    name: "foliage-exterior",
    color: 0xffffff,
    roughness: 0.9,
    vertexColors: true,
    emissive: 0xa8b99a,
    emissiveIntensity: 0.68,
  });
  readonly exteriorBackdrop = new THREE.MeshBasicMaterial({
    name: "exterior-backdrop",
    color: 0xe9eee5,
    toneMapped: false,
  });
  readonly contactShadow = new THREE.MeshBasicMaterial({
    name: "contact-shadow",
    color: 0x382a21,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  readonly book = new THREE.MeshStandardMaterial({
    name: "books",
    color: 0xffffff,
    roughness: 0.8,
    vertexColors: true,
  });

  readonly all: readonly THREE.Material[] = [
    this.wall,
    this.ceiling,
    this.trim,
    this.floor,
    this.wood,
    this.woodLight,
    this.woodDark,
    this.desktop,
    this.cabinetWhite,
    this.blackMetal,
    this.darkFrame,
    this.blackFabric,
    this.chairMesh,
    this.blackPlastic,
    this.blind,
    this.paper,
    this.pot,
    this.soil,
    this.screen,
    this.glass,
    this.foliage,
    this.foliageExterior,
    this.exteriorBackdrop,
    this.contactShadow,
    this.book,
  ];

  dispose(): void {
    for (const material of this.all) material.dispose();
  }

  private standard(name: string, color: number, roughness: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0 });
  }
}
