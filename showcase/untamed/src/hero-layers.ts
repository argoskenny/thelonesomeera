/** Registration-space mattes. Paths use the ORIGINAL 1536 × 1024 photograph.
 * Soft edges follow naturally shadowed / defocused transitions, not rectangular crops.
 * The same masks remove foreground pixels from the reconstructed background plate.
 */
export const jungleLayers = [
  {
    name: "left-canopy",
    depth: 7.8,
    feather: 11,
    sway: 0.0012,
    path: "M-60 -60H730L693 16L617 61L669 116L711 181L727 283L698 396L670 356L644 259L604 237L572 194L540 269L515 225L493 306L457 291L436 359L412 351L390 418L347 429L320 492L304 575L372 703L428 806L452 1060H-60Z",
  },
  {
    name: "right-canopy",
    depth: 8.8,
    feather: 12,
    sway: -0.0009,
    path: "M1278 -60H1596V1060H1266L1281 811L1249 715L1280 624L1332 537L1379 474L1350 414L1303 388L1264 332L1318 317L1342 205L1312 178L1269 224L1209 287L1136 299L1150 256L1200 158L1229 123L1233 65Z",
  },
  {
    name: "left-foreground",
    depth: 4.8,
    feather: 13,
    sway: -0.0007,
    path: "M-60 563L62 578L130 598L206 612L271 662L309 699L347 755L382 806L427 865L457 922L516 950L576 971L712 1010L778 1060H-60Z",
  },
  {
    name: "right-foreground",
    depth: 5.5,
    feather: 15,
    sway: 0.0008,
    path: "M1596 620L1495 648L1419 669L1360 696L1278 712L1226 756L1172 794L1140 824L1065 849L1005 900L947 935L909 968L845 1001L817 1060H1596Z",
  },
] as const;

export function maskSVG(path: string, feather: number, expansion = 0) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024"><defs><filter id="f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${feather}"/></filter></defs><path d="${path}" fill="white" stroke="white" stroke-width="${expansion}" stroke-linejoin="round" filter="url(#f)"/></svg>`;
}
export const svgURL = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
