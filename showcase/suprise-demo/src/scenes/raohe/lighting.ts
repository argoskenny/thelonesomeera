import * as T from 'three';

// Each shaded point sees its two adjacent counters on either side, so the whole
// street receives local light without a separate draw or uniform per lamp.
const counterLighting=/* glsl */ `
  for(int side=0;side<2;side++) {
    float s=side==0?-1.:1.;
    float spacing=3.5;
    float offset=side==0?.9:.2;
    float cell=floor((streetWorld.z-offset)/spacing);
    for(int j=0;j<2;j++) {
      float z=(cell+float(j))*spacing+offset;
      vec3 delta=vec3(s*3.08,2.08,z)-streetWorld;
      float len2=dot(delta,delta);
      float shield=mix(1.,.20,smoothstep(2.40,3.5,streetWorld.y));
      shield*=mix(.58,1.,smoothstep(.12,.70,streetWorld.y));
      float reach=1.-smoothstep(10.,14.,z);
      reach*=smoothstep(-77.,-73.,z);
      float amber=fract(sin((cell+float(j))*1.9+s)*645.3);
      vec3 colour=mix(vec3(1.,.54,.24),vec3(1.,.81,.57),amber);
      directLight.color=colour*(8.5*shield*reach/(.72+len2));
      directLight.direction=normalize(mat3(viewMatrix)*delta);
      directLight.visible=true;
      RE_Direct(directLight,geometryPosition,geometryNormal,geometryViewDir,geometryClearcoatNormal,material,reflectedLight);
    }
  }
  // Small incandescent lamps run along both faces of the entrance marquee.
  if(abs(streetWorld.z+9.)<6. && streetWorld.y>2.5 && abs(streetWorld.x)<6.){
    float face=streetWorld.z>-9.?1.:-1.;
    vec3 source=vec3(clamp(streetWorld.x,-3.85,3.85),6.96,-9.+face*.80);
    vec3 ray=source-streetWorld;
    directLight.color=vec3(1.,.49,.13)*1.75/(.27+dot(ray,ray));
    directLight.direction=normalize(mat3(viewMatrix)*ray);
    directLight.visible=true;
    RE_Direct(directLight,geometryPosition,geometryNormal,geometryViewDir,geometryClearcoatNormal,material,reflectedLight);
  }
`;
export function lightMarket(scene:T.Scene){
  const patched=new Set<T.Material>();
  scene.traverse(object=>{
    const mesh=object as T.Mesh;
    if(!mesh.isMesh) return;
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    for(const mat of materials){
      if(!(mat instanceof T.MeshStandardMaterial)||patched.has(mat)) continue;
      patched.add(mat);
      const previous=mat.onBeforeCompile, previousKey=mat.customProgramCacheKey();
      mat.onBeforeCompile=(shader,renderer)=>{
        previous.call(mat,shader,renderer);
        shader.vertexShader='varying vec3 streetWorld;\n'+shader.vertexShader.replace('#include <project_vertex>',`
          #include <project_vertex>
          vec4 streetPoint=vec4(transformed,1.);
          #ifdef USE_BATCHING
            streetPoint=batchingMatrix*streetPoint;
          #endif
          #ifdef USE_INSTANCING
            streetPoint=instanceMatrix*streetPoint;
          #endif
          streetWorld=(modelMatrix*streetPoint).xyz;
        `);
        shader.fragmentShader='varying vec3 streetWorld;\n'+shader.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n'+counterLighting);
      };
      mat.customProgramCacheKey=()=>previousKey+'/raohe-counter-v1';
      mat.needsUpdate=true;
    }
  });
  scene.add(new T.HemisphereLight(0xc2c9dc,0x907566,.69));
  const warm=new T.DirectionalLight(0xffc495,1.45);
  warm.position.set(-12,24,3);
  warm.target.position.set(0,0,-18);
  warm.castShadow=true;
  Object.assign(warm.shadow.camera,{left:-36,right:36,top:26,bottom:-26,near:.1,far:110});
  warm.shadow.mapSize.set(2048,2048);warm.shadow.bias=-.00018;warm.shadow.normalBias=.018;
  scene.add(warm,warm.target);
  scene.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    if(materials.some(m=>m.transparent||m instanceof T.ShaderMaterial))return;
    object.castShadow=true;
    object.receiveShadow=true;
  });
  const cool=new T.DirectionalLight(0xb2c9f8,.48);cool.position.set(13,16,-28);scene.add(cool);
}

export function captureStreetLight(renderer:T.WebGLRenderer,scene:T.Scene,ground:T.Object3D){
  const target=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType});
  const probe=new T.CubeCamera(.12,240,target);
  probe.position.set(.6,1.48,2.4);
  ground.visible=false;
  try {
    probe.update(renderer,scene);
    const filter=new T.PMREMGenerator(renderer);
    scene.environment=filter.fromCubemap(target.texture).texture;
    scene.environmentIntensity=.68;
    filter.dispose();
  } finally {ground.visible=true;target.dispose();}
}
