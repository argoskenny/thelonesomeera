import * as T from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// A depth-only contact pass preserves the gaps between utensil handles,
// serving trays and the counter without drawing the market a second time.
export class ContactShadows extends ShaderPass {
  constructor(private camera:T.PerspectiveCamera){
    super({
      uniforms:{tDiffuse:{value:null},depthMap:{value:null},inverseProjection:{value:new T.Matrix4()},projectionScale:{value:new T.Vector2()}},
      vertexShader:`varying vec2 st;void main(){st=uv;gl_Position=vec4(position.xy,0.,1.);}`,
      fragmentShader:`
        uniform sampler2D tDiffuse,depthMap;
        uniform mat4 inverseProjection;uniform vec2 projectionScale;varying vec2 st;
        vec3 reconstruct(vec2 uv,float depth){
          vec4 h=inverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);
          return h.xyz/h.w;
        }
        void main(){
          vec3 radiance=texture2D(tDiffuse,st).rgb;
          vec3 center=reconstruct(st,texture2D(depthMap,st).x);
          vec3 tangentX=dFdx(center),tangentY=dFdy(center);
          vec3 normal=normalize(cross(tangentX,tangentY));
          float occ=0.;
          if(-center.z<39.){
            vec2 spiral=vec2(.985,.172);
            for(int i=0;i<12;i++){
              float scale=.08+.40*(float(i)+.5)/12.;
              vec2 uv=clamp(st+spiral*scale*projectionScale/max(.45,-center.z),.0001,.9999);
              vec3 delta=reconstruct(uv,texture2D(depthMap,uv).r)-center;
              float d=length(delta);
              float above=max(dot(normal,delta)-.0115,0.)/max(d,.003);
              occ+=above*(1.-smoothstep(.095,.53,d));
              spiral=mat2(-.737,.676,-.676,-.737)*spiral;
            }
          }
          float shadow=clamp(1.-occ*.155,.54,1.);
          float luma=dot(radiance,vec3(.2126,.7152,.0722));
          gl_FragColor=vec4(radiance*mix(shadow,1.,smoothstep(.48,1.7,luma)),1.);
        }`,
    });
  }
  override render(renderer:T.WebGLRenderer,write:T.WebGLRenderTarget,read:T.WebGLRenderTarget,dt:number,mask:boolean){
    this.uniforms.depthMap.value=read.depthTexture;
    this.uniforms.inverseProjection.value.copy(this.camera.projectionMatrixInverse);
    const p=this.camera.projectionMatrix.elements;
    this.uniforms.projectionScale.value.set(p[0]*.5,p[5]*.5);
    super.render(renderer,write,read,dt,mask);
  }
}
