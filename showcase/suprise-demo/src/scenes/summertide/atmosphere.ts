import * as T from 'three';
export function createAtmosphere(scene:T.Scene,panorama:T.Texture){
  panorama.colorSpace=T.SRGBColorSpace;panorama.wrapS=T.RepeatWrapping;panorama.minFilter=T.LinearFilter;panorama.generateMipmaps=false;
  const sky=new T.Mesh(new T.SphereGeometry(2800,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{panorama:{value:panorama},mood:{value:0}},vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
  varying vec3 vDir;uniform sampler2D panorama;uniform float mood;
  void main(){vec3 d=normalize(vDir);vec2 uv=vec2(atan(d.z,d.x)/6.2831853+.65,asin(clamp(d.y,-1.,1.))/3.14159265+.5);
  vec3 c=texture2D(panorama,uv).rgb;float w=fract(uv.x);float seam=(1.-smoothstep(0.,.06,min(w,1.-w)))*.5;c=mix(c,texture2D(panorama,vec2(1.-uv.x,uv.y)).rgb,seam);
  c=mix(c,c*vec3(1.12,1.,.86),mood*.5);gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  }`}));sky.renderOrder=-100;scene.add(sky);
  return {sky,update(mood:number,camera:T.Camera){sky.position.copy(camera.position);sky.material.uniforms.mood.value=mood;}};
}
