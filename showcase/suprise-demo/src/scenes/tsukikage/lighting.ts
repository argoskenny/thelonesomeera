import * as T from 'three';
import type { HallOcclusion } from './occlusion';

type XYZ=[number,number,number];
export function lightHall(scene:T.Scene,small:boolean,field:ReturnType<HallOcclusion['bake']>){
  // Local pools of light preserve the falloff between floors. All shadow
  // sources sit under the roof, so the roof casts no spurious exterior shadow.
  scene.add(new T.HemisphereLight(0xffddad,0xe5b681,.51));
  function spot(from:XYZ,to:XYZ,color:number,power:number,angle:number,shadow=false){
    const l=new T.SpotLight(color,power,45,angle,.79,2);
    l.position.set(...from);l.target.position.set(...to);
    if(shadow){l.castShadow=true;l.shadow.mapSize.setScalar(small?1024:2048);l.shadow.bias=-.00012;l.shadow.normalBias=.013;l.shadow.focus=.96;l.shadow.radius=3.1;}
    scene.add(l,l.target);
  }
  spot([.7,10.8,4.3],[-1,2.3,1.5],0xffd09a,368,.68,true);
  spot([-4.3,8.5,2.2],[-7,2.3,-4.3],0xffcc85,185,.9,true);
  spot([5.8,11.9,.3],[1.5,4.2,-7],0xffce92,204,1.12,true);
  spot([12.1,12.9,-5.7],[6.4,4.2,-.7],0xffdda8,199,.77,true);
  function bulb(p:XYZ,color:number,power:number,range:number){
    const light=new T.PointLight(color,power,range,2);light.position.set(...p);scene.add(light);
  }
  bulb([-7.35,1.04,6.05],0xffb75b,9,7);
  bulb([-7.4,3.65,-1.14],0xffac46,24,10);
  bulb([-.55,1.35,2.42],0xffb561,29,8);
  bulb([1.05,4.26,-5.9],0xffce85,23,9);
  bulb([8.15,6.6,-3.6],0xffc576,31,9);
  spot([-9.58,.36,2.0],[-9.32,3.4,1.61],0xffcc86,44,.70);
  // Broad bounced light from the surrounding galleries. This diffuse term is
  // deliberately warmest at deck height, including the underside of the eaves.
  const patched=new Set<T.Material>();
  scene.traverse(obj=>{
    if(!(obj instanceof T.Mesh))return;
    const mat=obj.material;
    if(!(mat instanceof T.MeshStandardMaterial)||patched.has(mat))return;
    patched.add(mat);
    const previous=mat.onBeforeCompile,key=mat.customProgramCacheKey();
    mat.onBeforeCompile=function(shader,renderer){
      previous.call(this,shader,renderer);
      shader.uniforms.hallVisibility={value:field.texture};shader.uniforms.hallOrigin={value:field.origin};shader.uniforms.hallSize={value:field.extent};
      shader.vertexShader='varying vec3 hallPoint;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nhallPoint=(modelMatrix*vec4(transformed,1.)).xyz;');
      shader.fragmentShader='varying vec3 hallPoint; uniform highp sampler3D hallVisibility; uniform vec3 hallOrigin,hallSize;\n'+shader.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
        {
          vec3 direction=inverseTransformDirection(geometryNormal,viewMatrix);
          vec3 uvw=(hallPoint+.32*direction-hallOrigin)/hallSize;
          float visibility=texture(hallVisibility,uvw).r;
          float accessibility=smoothstep(.14,.91,visibility);
          reflectedLight.indirectDiffuse*=mix(.29,1.,accessibility);
          reflectedLight.indirectSpecular*=mix(.46,1.,accessibility);
        }
      `).replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
        {
        float rim=max(smoothstep(6.,13.,abs(hallPoint.x)),smoothstep(5.,11.,abs(hallPoint.z)));
        float level=.23+.77*pow(.5+.5*cos((hallPoint.y-8.85)*1.51),2.);
        irradiance+=vec3(.56,.33,.16)*(.26+rim*level);
        vec2 start=vec2(4.7,2.8),run=vec2(5.3,-11.);
        float t=clamp(dot(hallPoint.xz-start,run)/dot(run,run),0.,1.);
        float dist=distance(hallPoint.xz,start+t*run);
        float stairLight=exp(-1.8*abs(dist-1.35)-1.6*abs(hallPoint.y-(2.56+5.4*t)));
        irradiance+=vec3(2.5,1.25,.28)*stairLight;
        float baseWash=exp(-1.65*abs(hallPoint.y-2.68)-1.2*abs(hallPoint.z+1.72));
        irradiance+=vec3(3.0,1.65,.44)*baseWash*(1.-smoothstep(3.1,4.1,abs(hallPoint.x+8.5)));
        vec2 deckDelta=hallPoint.xz-vec2(-1.,1.5);
        vec2 border=abs(mat2(.5592,.8290,-.8290,.5592)*deckDelta)-vec2(2.49,2.12);
        float edgeWash=exp(-1.45*abs(max(border.x,border.y))-1.1*abs(hallPoint.y-1.93));
        irradiance+=vec3(2.5,1.34,.38)*edgeWash;
        }
      `);
    };
    mat.customProgramCacheKey=()=>key+'/tsukikage-hall';
  });
}

export function captureHall(renderer:T.WebGLRenderer,scene:T.Scene){
  const water=scene.getObjectByName('riverSurface');
  if(water)water.visible=false;
  const target=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType});
  const probe=new T.CubeCamera(.09,65,target);
  probe.position.set(-3.75,1.47,3.55);
  const filter=new T.PMREMGenerator(renderer);
  try{
    probe.update(renderer,scene);
    scene.environment=filter.fromCubemap(target.texture).texture;
    scene.environmentIntensity=.45;
  }finally{if(water)water.visible=true;filter.dispose();target.dispose();}
}
