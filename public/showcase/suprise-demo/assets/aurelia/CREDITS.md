# AURELIA / 曦光城塞

Art direction: the user's supplied image `夕照下的魔法文藝復興城塞.png`, interpreted as an original explorable environment without characters. The supplied image is not used as the world background.

Generated with the built-in Image Gen tool; originals remain in the tool output directory, JPEG runtime derivatives live here:

- `heraldry.jpg`: flat 2:3 burgundy velvet with gold embroidered phoenix, laurel wreath and ornamental border; orthographic diffuse illumination, no folds or words. Mapped onto real, animated cloth and a draped tabletop.
- `terracotta.jpg`: seamless orthographic scan of aged Italian terracotta barrel roof tiles, natural clay color, chipped edges and subtle weathering, diffuse light. Used as color and bump data on 3D roofs and the octagonal cathedral dome.
- `cliff.jpg`: seamless photorealistic alpine limestone cliff face, fractured grey-brown vertical rock, horizontal strata, irregular crevices and sparse moss; diffuse orthographic illumination, no landscape. Used as color and bump data on deformed, spatial cliff meshes.
- `sky.jpg`: photographic 2:1 alpine panorama, golden afternoon cumulus clouds, blue sky, far snowy mountains confined to the horizon and pale valley mist below; no architecture or close terrain. Used only for the sky and distant mountains beyond the navigable area. The cliffs, rock outcrops, nearby mist, waterfalls, buildings and bridges are geometry/shaders.
- `preview.png`: actual WebGL canvas capture of the finished scene, not concept art.

Reused local assets:

- Limestone and alpha-masked leaf: [AERIE credits](../aerie/CREDITS.md).
- Concrete / rock normals and HDR environment lighting: [shared credits](../shared/CREDITS.md) and [AFTERLIGHT credits](../afterlight/CREDITS.md).

Architecture, furniture, lanterns, armillary spheres, ivy, flowers, stairs, railings, bridges, floating observatory and magical rings are authored Three.js geometry. The waterfall sheets, spray, cloud billows and banner motion are procedural shaders. Audio is synthesized wind, water noise and quiet tuned tones; it begins only after the sound control is pressed.

`design/aurelia/concept.png` is a generated composition study: a shaded wisteria loggia in the foreground, terracotta cathedral dome and city piazza, arched valley bridge, waterfall citadel and luminous blue spire at golden hour. It is not displayed inside the 3D world.
