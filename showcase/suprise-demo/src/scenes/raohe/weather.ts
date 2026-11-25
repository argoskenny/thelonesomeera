import * as T from 'three';

export function buildWeather(scene:T.Scene,reduced:boolean){
  const panorama=new T.TextureLoader().load(new URL('../assets/raohe/horizon.webp',document.baseURI).href);
  panorama.colorSpace=T.SRGBColorSpace;
  panorama.wrapS=T.RepeatWrapping;
  const sky=new T.Mesh(new T.SphereGeometry(370,32,20),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,uniforms:{panorama:{value:panorama}},
    vertexShader:`varying vec3 dir; void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`
      varying vec3 dir;uniform sampler2D panorama;
      float h(vec2 p){return fract(sin(dot(p,vec2(41.3,239.1)))*43758.54);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
      void main(){
        vec3 d=normalize(dir);float elevation=max(d.y,0.);
        vec2 cloud=d.xz/(elevation+.16)*1.5;
        float v=n(cloud)*.6+n(cloud*2.2+8.)*.3+n(cloud*5.3)*.1;
        vec3 c=mix(vec3(.018,.023,.039),vec3(.0022,.0033,.0075),smoothstep(0.,.72,elevation));
        c+=vec3(.022,.017,.020)*smoothstep(.41,.81,v)*exp(-elevation*4.);
        vec2 uv=vec2(.5+atan(d.z,d.x)/6.283185,.5+asin(clamp(d.y,-1.,1.))/3.141593);
        vec3 skyline=texture2D(panorama,uv).rgb*vec3(.72,.78,.88);
        c=mix(skyline,c,smoothstep(.035,.65,elevation)*.94);
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  sky.position.set(0,13,-34);sky.renderOrder=-2;scene.add(sky);

  const steamGeometry=new T.PlaneGeometry(1,1);
  const steam=new T.InstancedMesh(steamGeometry,new T.ShaderMaterial({
    uniforms:{clock:{value:0}},transparent:true,depthWrite:false,side:T.DoubleSide,
    vertexShader:`
      uniform float clock;varying vec2 st;varying float seed;
      void main(){
        vec4 center=instanceMatrix*vec4(0.,0.,0.,1.);
        seed=fract(sin(center.z*84.142)*951.2)*12.; st=uv;
        vec4 eye=modelViewMatrix*center;
        eye.x+=position.x*.69+sin(uv.y*3.+seed+clock*.6)*.07*uv.y;
        eye.y+=position.y*1.29;
        gl_Position=projectionMatrix*eye;
      }`,
    fragmentShader:`
      uniform float clock;varying vec2 st;varying float seed;
      float hash(vec2 p){return fract(sin(dot(p,vec2(107.7,319.9)))*43758.54);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
      void main(){
        vec2 p=vec2(st.x*4.+seed,st.y*3.-clock*.5);
        float f=noise(p)*.55+noise(p*2.+vec2(clock*.13,0.))*.3+noise(p*4.)*.15;
        float x=(st.x-.46)*2.+sin(st.y*5.+seed+clock*.5)*.15;
        float body=1.-smoothstep(.04,.13+st.y*.83,abs(x)+(f-.47)*.28);
        float a=body*smoothstep(0.,.13,st.y)*(1.-smoothstep(.32,1.,st.y))*smoothstep(.28,.73,f);
        gl_FragColor=vec4(.81,.70,.63,a*.37);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }),12);
  const matrix=new T.Matrix4();
  [-1.85,3.8,-13.5,-21.,-28.6,-37.,-48.,-62.,-68.6,-31.5,-18.8,-55.].forEach((z,i)=>{
    matrix.makeTranslation(i%3===0?3.24:-3.32,1.64,z);steam.setMatrixAt(i,matrix);
  });
  steam.frustumCulled=false;scene.add(steam);
  const count=530,coords=new Float32Array(count*6),phases=new Float32Array(count*2), tips=new Float32Array(count*2);
  for(let i=0;i<count;i++){
    const r=(s:number)=>T.MathUtils.euclideanModulo(Math.sin(i*78.233+s*37.719)*43758.5453,1);
    const x=(r(1)-.5)*12,z=(r(2)-.5)*22,y=r(3)*9;
    coords.set([x,y,z,x,y,z],i*6);tips[i*2+1]=.062+r(4)*.049;
    phases.set([r(5),r(5)],i*2);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(coords,3));geo.setAttribute('phase',new T.BufferAttribute(phases,1));geo.setAttribute('tip',new T.BufferAttribute(tips,1));
  const rainMaterial=new T.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:{clock:{value:0},around:{value:new T.Vector3()}},
    vertexShader:`
      uniform float clock;uniform vec3 around;attribute float phase,tip;varying float visibility;
      void main(){
        vec3 p=position;
        float travel=mod(clock*(3.9+phase*1.7)+phase*7.,9.);
        p.y-=travel;p.y+=9.*step(p.y,0.);
        p.x=mod(p.x+.82*travel-around.x,12.)-6.+around.x;
        p.z=mod(p.z-around.z,22.)-11.+around.z;
        p.y+=max(0.,around.y-3.);
        p+=vec3(-.17*tip,tip,.056*tip);
        float underRoof=step(2.70,abs(p.x))*(1.-smoothstep(2.7,3.4,p.y));
        visibility=(1.-underRoof)*smoothstep(.13,.8,p.y)*(1.-smoothstep(7.5,9.,p.y-max(0.,around.y-3.)));
        gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);
      }`,
    fragmentShader:`varying float visibility;void main(){gl_FragColor=vec4(.66,.66,.71,.077*visibility);}`,
  });
  const rain=new T.LineSegments(geo,rainMaterial);rain.frustumCulled=false;scene.add(rain);
  rain.visible=!reduced;
  return {update(t:number,camera:T.Camera){
    (steam.material as T.ShaderMaterial).uniforms.clock.value=reduced?0:t;
    rainMaterial.uniforms.clock.value=t;rainMaterial.uniforms.around.value.copy(camera.position);
  }};
}
