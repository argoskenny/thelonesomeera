import * as T from 'three';
/** The photographic horizon fades into a uniform zenith to avoid polar pinching
 * when freely looking straight up during ascent. */
export function createSky(scene:T.Scene,texture:T.Texture){
  const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{map:{value:texture},uIntensity:{value:.85},uYaw:{value:1.7},uZenith:{value:new T.Color(0x315172)}},
    vertexShader:'varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D map;uniform float uIntensity,uYaw;uniform vec3 uZenith;varying vec3 vDirection;
    void main(){vec3 d=normalize(vDirection);vec2 uv=vec2(fract(atan(d.z,d.x)/6.283185+.5+uYaw/6.283185),clamp(asin(clamp(d.y,-1.,1.))/3.141593*2.2+.5,.005,.995));vec3 c=texture2D(map,uv).rgb;float zenith=smoothstep(.38,.88,d.y);c=mix(c,uZenith,zenith);float seam=1.-smoothstep(0.,.035,min(uv.x,1.-uv.x));c=mix(c,uZenith,seam*smoothstep(.05,.6,d.y));gl_FragColor=vec4(c*uIntensity,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`});
  const mesh=new T.Mesh(new T.SphereGeometry(7000,48,32),material);mesh.renderOrder=-100;mesh.frustumCulled=false;scene.add(mesh);return mesh;
}
