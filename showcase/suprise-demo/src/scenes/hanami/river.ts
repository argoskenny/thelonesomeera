import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { texture } from './promenade-geometry';

export function addRiver(parent: THREE.Object3D, zMin: number, zMax: number) {
  const water = new Reflector(new THREE.PlaneGeometry(42,zMax-zMin), {
    textureWidth: 640, textureHeight: 384, clipBias: .0004, multisample: 0,
    shader: {
      name: 'Shallow river',
      uniforms: {
        tDiffuse:{value:null}, textureMatrix:{value:new THREE.Matrix4()}, color:{value:new THREE.Color()},
        time:{value:0}, ripples:{value:null}, riverbed:{value:null},
      },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 reflection;
        varying vec3 world;
        void main(){
          world=(modelMatrix*vec4(position,1.)).xyz;
          reflection=textureMatrix*vec4(position,1.);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
        }`,
      fragmentShader: `
        uniform sampler2D tDiffuse,ripples,riverbed;
        uniform float time;
        varying vec4 reflection;
        varying vec3 world;
        void main(){
          vec2 p=world.xz;
          vec2 w0=texture2D(ripples,p*vec2(.17,.32)+vec2(time*.009,time*.027)).rg-.5;
          vec2 w1=texture2D(ripples,p.yx*vec2(.42,.53)-vec2(time*.034,time*.013)).gr-.5;
          vec2 waves=w0*.66+w1*.34;
          vec3 normal=normalize(vec3(waves.x*.24,1.,waves.y*.29));
          vec3 viewDir=normalize(cameraPosition-world);
          float angle=clamp(dot(normal,viewDir),0.,1.);
          float fresnel=.045+.92*pow(1.-angle,3.);
          float farBank=-24.3+sin(p.y*.06+2.)*1.7+sin(p.y*.13)*.65;
          float nearBank=-10.5+sin(p.y*.089)*.9+sin(p.y*.23)*.35;
          float depth=smoothstep(.0,4.,min(nearBank-p.x,p.x-farBank));
          vec3 gravel=texture2D(riverbed,p*.57+waves*.10).rgb;
          vec3 bottom=mix(gravel*vec3(.81,.89,.77),vec3(.055,.108,.106),depth*.87);
          vec2 mirrorUV=reflection.xy/reflection.w;
          vec3 bank=texture2D(tDiffuse,clamp(mirrorUV+waves*(.022+.06/(.25+angle)),.002,.998)).rgb;
          gl_FragColor=vec4(mix(bottom,bank,fresnel),1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    },
  });
  water.name='River with reflected banks';
  water.rotation.x=-Math.PI/2;
  water.position.set(-17,-2.40,(zMax+zMin)*.5);
  const material=water.material as THREE.ShaderMaterial;
  material.uniforms.ripples.value=texture('shared/water-normal.jpg',false);
  material.uniforms.riverbed.value=texture('hanami/promenade-rock.webp');
  const renderReflection=water.onBeforeRender.bind(water);
  const lastView=new THREE.Matrix4(), lastProjection=new THREE.Matrix4();
  let lastCapture=-Infinity;
  water.onBeforeRender=(renderer,scene,camera,geometry,mat,group)=>{
    // The banks and sky are static. The water normals can flow independently of
    // the reflection capture, including when the visitor stands still to look.
    if(lastView.equals(camera.matrixWorld) && lastProjection.equals(camera.projectionMatrix)) return;
    const now=performance.now();
    if(now-lastCapture<75) return;
    renderReflection(renderer,scene,camera,geometry,mat,group);
    lastView.copy(camera.matrixWorld);lastProjection.copy(camera.projectionMatrix);lastCapture=now;
  };
  parent.add(water);
  return (time:number)=>{material.uniforms.time.value=time;};
}
