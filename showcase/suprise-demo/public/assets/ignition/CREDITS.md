# IGNITION assets

- `sunset.png`: original environment panorama generated with the built-in OpenAI Image Gen tool for this scene. Brief: a seamless 360-degree coastal sunset panorama, blue sky, amber cloud undersides, small low sun and open ocean; no rockets, structures, people or UI. It is used as sky and reflection lighting, with a softened zenith for free-flight viewing.
- Rocket, tower, retractable arms, tanks, piping, ground console, terrain and all base props are authored as real Three.js geometry in `src/scenes/ignition/`. The supplied launch-site photograph is a visual reference only and is not displayed as the environment.
- Launch motion, procedural flame/smoke shaders and synthesized audio are original project code. This is an artistic interactive environment, not an engineering simulator.
- Shared concrete maps and water normal map retain the licenses documented in `../shared/CREDITS.md`.
- Ocean reflection uses Three.js Water (MIT).
- `preview.png`: captured from the actual browser-rendered 3D scene.
