# NIGHTFALL — sources and assets

The environment is an original Taiwan-inspired scene, not a surveyed replica of Raohe Street. No people, crowd textures, human silhouettes or character models are present.

## Visual research

- User-provided `night.jpg`: main reference for dense vertical Traditional Chinese signage, ribbed lanterns, alternating blue/red awnings, steam and older Taiwanese buildings. The photo itself is not distributed or used as a scene backdrop.
- Taipei Travel, Raohe Street Tourist Night Market: https://travel.taipei/en/attraction/details/1691
- Tourism Administration, Raohe Street: https://www.tad.gov.tw/m1.aspx?id=R177&sno=0001016
- Tourism Administration, night-market overview: https://www.taiwan.net.tw/m1.aspx?sNo=0001040
- National Cultural Memory Bank, Raohe Street entrance and gateway: https://tcmb.culture.tw/zh-tw/detail?id=291168&indexCode=Culture_Place
- Additional photo research: https://taiwaneverything.cc/2019/01/17/mrt-songshan-station/
- Additional street-level photo research: https://stworld.jp/area/palau/diary/63e9bafa-20a0-467c-96d4-cd6b98bc78f8
- Additional stall detail research: https://zanway0604.pixnet.net/blog/posts/12227052994

The external street photos are visual references only, not redistributed assets. Shop names, menus and prices in the scene are fictional set dressing.

## PBR assets

All Poly Haven assets below use CC0: https://polyhaven.com/license

- Asphalt 02: https://polyhaven.com/a/asphalt_02
- Brick Wall 001: https://polyhaven.com/a/brick_wall_001
- Metal Plate: https://polyhaven.com/a/metal_plate
- Shared Concrete Wall 007 and Kloppenheim 06 HDRI: see ../shared/CREDITS.md.
- Architecture, signs, props, lanterns, wet-surface reflection shader, tiled facades, fabric materials and synthesized ambient audio were authored for this scene.
- `design/night-market/concept.png` was generated with the built-in image generation tool from the supplied reference. Brief: empty photoreal Taiwanese night-market alley after rain, layered Traditional Chinese lightboxes, stainless stalls, lanterns, old tiled buildings and a restrained NIGHTFALL interface.

- `preview.png` is an actual screenshot of the browser-rendered environment.

## District expansion references

- Local `taiwan-gta` README, `docs/night-market-v4.md`, `docs/night-market-v5.md`, `docs/unique-building-catalog.md` and `public/data/layout.json`: reference for six-block scale, vendor mix and architectural variety. Geometry was authored in this project's modular Three.js source; its retro renderer, crowds and GLB were not imported.
- Wikimedia Commons, food carts in Taiwan: https://commons.wikimedia.org/wiki/Category:Food_carts_in_Taiwan
- Wikimedia Commons, HeySong vending-machine photo: https://commons.wikimedia.org/wiki/File:HeySong_beverage_vending_machine_20120917.jpg
- Wikimedia Commons, Mr. Brown coffee vending-machine photo: https://commons.wikimedia.org/wiki/File:Mr.Brown_Coffee_vending_machine_in_Taiwan_by_King_Car,_type_Fuji_Electric_Retail_Systems_FRE25NT-KS.jpg
- Dadaocheng storefront and vending-machine photography: https://www.dcard.tw/f/photography/p/241590574
- Shilin stall photography: https://www.flickr.com/photos/ludington/albums/72157605440929213/

These photos informed physical construction, arrangement and weathering only. No external reference photo or vendor branding is redistributed as a runtime asset. Vending-machine names and beverage labels in NIGHTFALL are fictional.

- `design/night-market/district-overview.png` and the updated `preview.png` are browser-rendered captures of the expanded district.

Scooters: user-supplied `pink-scooter/pink_scooter.glb`. Browser LODs in
`scooter/near.glb` and `scooter/far.glb` are generated with Blender using
`scripts/prepare-scooter.py`. Original source files are unchanged. Rose lacquer
and inner-edge materials receive randomized black, white, blue, red or pink paint;
all other source PBR materials are retained.
