// قلب العرض ثلاثي الأبعاد: المشهد، السماء، الإضاءة، الضباب، النجوم، السحب، الجزيئات
(function(){
  var T=THREE,L=G.Layout;
  var W=G.World3D={scene:null,renderer:null,camera:null,tex:{},missing:[],Q:null,lamps:[],markers:[],inst:{},glows:[],swayMats:[],frames:[],t:0};

  // ===== لوحات الألوان على طول الرحلة =====
  function C(h){return new T.Color(h);}
  var PAL=[
    {top:0x8f8de6,bot:0xffc9d9,fog:0xf3c4dc,sun:0xffe0c0,sunI:1.0,night:0.00,grass:0x8fd19a,grass2:0xb4e3a2,rock:0x9a8fb8,flower:[0xffffff,0xffd6e6,0xe6d6ff]},
    {top:0x7d6fd8,bot:0xff9fb8,fog:0xf0a8c4,sun:0xffd4b8,sunI:0.95,night:0.05,grass:0x86c493,grass2:0xaadc9f,rock:0x9487b5,flower:[0xff7aa3,0xffb3c9,0xffffff]},
    {top:0x5f8fe0,bot:0xffd2a6,fog:0xf5d3b0,sun:0xffe2b0,sunI:1.0,night:0.10,grass:0x79c27c,grass2:0xa6dc90,rock:0x8f8aa8,flower:[0xffc2d8,0xfff0a8,0xffffff,0xd7b8ff]},
    {top:0x4a56b8,bot:0xff9a7a,fog:0xe39a8c,sun:0xffc89a,sunI:0.9,night:0.25,grass:0x6fb089,grass2:0x92cf94,rock:0x8479a6,flower:[0xffd37a,0xffffff]},
    {top:0x2f3a8f,bot:0xe0788f,fog:0xb86e90,sun:0xffb7a0,sunI:0.8,night:0.40,grass:0x65a98a,grass2:0x86c691,rock:0x7a6ea0,flower:[0xffe6a0,0xffc0d8]},
    {top:0x231a63,bot:0x6a4bc9,fog:0x5a3fb0,sun:0xc9b6ff,sunI:0.75,night:0.45,grass:0x6fe0b8,grass2:0x8ff2c8,rock:0x6a5aa8,flower:[0xff7ad9,0x7af0ff,0xffe97a]},
    {top:0x1b1450,bot:0xb85aa8,fog:0x8a4a98,sun:0xffc0e0,sunI:0.75,night:0.60,grass:0x69b58f,grass2:0x8ccf9d,rock:0x6e5f9c,flower:[0xffd0e8,0xffe9a0,0xffffff]},
    {top:0x16194f,bot:0x5b4aa0,fog:0x463b88,sun:0xc4c8ff,sunI:0.7,night:0.65,grass:0x5aa08a,grass2:0x7cbf9b,rock:0x625794,flower:[0xe8d8ff,0xffffff]},
    {top:0x2a2468,bot:0xffa56a,fog:0xc9777a,sun:0xffd0a0,sunI:0.85,night:0.50,grass:0x8fd075,grass2:0xb4e58a,rock:0x8a6d98,flower:[0xff9ad0,0xffe45c,0x7ae0ff]},
    {top:0x1d2a66,bot:0x8c6ad0,fog:0x6a56b0,sun:0xd8c0ff,sunI:0.7,night:0.65,grass:0x62aa94,grass2:0x84c8a4,rock:0x6a5ea4,flower:[0xff9ad0,0x9aaaff]},
    {top:0x0f1240,bot:0x35307a,fog:0x2a2764,sun:0xb8b8ff,sunI:0.62,night:0.80,grass:0x4f8f86,grass2:0x6fae96,rock:0x564c88,flower:[0xffd9a0,0xffffff]},
    {top:0x101a4a,bot:0x3f6aa0,fog:0x30508a,sun:0xb4d0ff,sunI:0.65,night:0.75,grass:0x5aa896,grass2:0x7cc6a6,rock:0x56709c,flower:[0xb8e8ff,0xffffff]},
    {top:0x181b52,bot:0xb36fa8,fog:0x71508c,sun:0xffc8f0,sunI:0.65,night:0.70,grass:0x6cb095,grass2:0x8fcca6,rock:0x74609e,flower:[0xffb0d8,0xffe08a,0xc8b0ff]},
    {top:0x070a2c,bot:0x2a2a70,fog:0x1d2260,sun:0xaab4ff,sunI:0.55,night:0.92,grass:0x4a8896,grass2:0x6aa8aa,rock:0x4a4a88,flower:[0xd0e0ff,0xffffff]},
    {top:0x03051c,bot:0x1b1b55,fog:0x141a52,sun:0xaab4ff,sunI:0.55,night:1.00,grass:0x4f8d95,grass2:0x72b0a8,rock:0x4a4a88,flower:[0xd8e4ff,0xffe9b0,0xffffff]}
  ];
  W.PAL=PAL;

  // ===== تهيئة =====
  W.init=function(canvas,quality){
    var mobile=G.isMobile; var q=quality==='auto'?(mobile?'mid':'high'):quality;
    var Q=W.Q={mode:q,shadows:q!=='low',shadowSize:q==='high'?2048:1024,pr:Math.min(window.devicePixelRatio||1,q==='high'?2:(q==='mid'?1.5:1.1)),
      clouds:q==='high'?150:(q==='mid'?80:40),grass:q==='high'?1:(q==='mid'?0.55:0.3),parts:q==='high'?1:(q==='mid'?0.6:0.35),stars:q==='high'?1800:1000};
    var r=W.renderer=new T.WebGLRenderer({canvas:canvas,antialias:q==='high',powerPreference:'high-performance',alpha:false});
    r.setPixelRatio(Q.pr);r.setSize(window.innerWidth,window.innerHeight,false);
    r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;
    r.shadowMap.enabled=Q.shadows;r.shadowMap.type=T.PCFSoftShadowMap;
    var s=W.scene=new T.Scene();s.fog=new T.Fog(0xf3c4dc,40,330);
    var cam=W.camera=new T.PerspectiveCamera(58,window.innerWidth/window.innerHeight,0.1,1400);
    W.hemi=new T.HemisphereLight(0xcfd8ff,0x7a6a90,0.85);s.add(W.hemi);
    W.sun=new T.DirectionalLight(0xffe0c0,1.0);W.sun.position.set(30,50,20);
    if(Q.shadows){W.sun.castShadow=true;W.sun.shadow.mapSize.set(Q.shadowSize,Q.shadowSize);var sc=W.sun.shadow.camera;sc.left=-28;sc.right=28;sc.top=28;sc.bottom=-28;sc.near=1;sc.far=140;W.sun.shadow.bias=-0.0006;W.sun.shadow.normalBias=0.04;}
    s.add(W.sun);s.add(W.sun.target);
    W.pl=[new T.PointLight(0xffc880,0,22,1.6),new T.PointLight(0xffc880,0,22,1.6)];W.pl.forEach(function(p){s.add(p);});
    buildSky();buildStars();
    W.cloudTex=cloudTexture();
    window.addEventListener('resize',W.resize);W.resize();
  };
  W.resize=function(){
    var w=window.innerWidth,h=window.innerHeight;W.renderer.setSize(w,h,false);W.camera.aspect=w/h;W.camera.updateProjectionMatrix();
    var sc=h*W.Q.pr/(2*Math.tan(W.camera.fov*Math.PI/360));W.pointScale.value=sc;
  };
  W.pointScale={value:800};
  // ===== السماء =====
  function buildSky(){
    var m=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
      uniforms:{uTop:{value:C(0x8f8de6)},uBot:{value:C(0xffc9d9)},uNight:{value:0},uTime:G.timeUniform},
      vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform vec3 uTop;uniform vec3 uBot;uniform float uNight;varying vec3 vP;'+
        'void main(){vec3 d=normalize(vP);float h=d.y;vec3 c=mix(uBot,uTop,smoothstep(-0.05,0.7,h));'+
        'c=mix(c,uBot*0.75,smoothstep(0.0,-0.5,h));'+
        'vec3 md=normalize(vec3(-0.35,0.42,-0.84));float m=dot(d,md);'+
        'vec3 sc=mix(vec3(1.0,0.93,0.8),vec3(0.9,0.93,1.0),uNight);'+
        'c+=sc*smoothstep(0.9988,0.9994,m)*(0.55+0.45*uNight);c+=sc*pow(max(m,0.0),48.0)*(0.18+0.22*uNight);c+=sc*pow(max(m,0.0),6.0)*0.06;'+
        'gl_FragColor=vec4(c,1.0);}'});
    W.sky=new T.Mesh(new T.SphereGeometry(900,32,18),m);W.sky.renderOrder=-10;W.sky.frustumCulled=false;W.scene.add(W.sky);
  }
  function buildStars(){
    var n=W.Q.stars,pos=new Float32Array(n*3),ph=new Float32Array(n),sz=new Float32Array(n),r=G.rng(5);
    for(var i=0;i<n;i++){var u=r(),v=r()*0.96+0.02,th=u*Math.PI*2,y=v,rad=Math.sqrt(1-y*y);pos[i*3]=Math.cos(th)*rad*800;pos[i*3+1]=y*800;pos[i*3+2]=Math.sin(th)*rad*800;ph[i]=r()*6.28;sz[i]=0.6+Math.pow(r(),3)*2.6;}
    var g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('phase',new T.BufferAttribute(ph,1));g.setAttribute('size',new T.BufferAttribute(sz,1));
    var m=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,
      uniforms:{uTime:G.timeUniform,uNight:{value:0},uPR:{value:W.Q.pr},uFin:{value:0}},
      vertexShader:'attribute float phase;attribute float size;uniform float uTime;uniform float uPR;uniform float uFin;varying float vA;void main(){float tw=0.65+0.35*sin(uTime*(0.8+phase*0.2)+phase*9.0);vA=tw;gl_PointSize=size*uPR*(1.0+uFin*0.5*sin(uTime*3.0+phase));gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform float uNight;varying float vA;void main(){float d=length(gl_PointCoord-0.5);float a=smoothstep(0.5,0.1,d);gl_FragColor=vec4(vec3(0.85,0.9,1.0)*a*vA*uNight,a*vA*uNight);}'});
    W.stars=new T.Points(g,m);W.stars.frustumCulled=false;W.stars.renderOrder=-9;W.scene.add(W.stars);
  }
  function cloudTexture(){
    var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d');
    var g=x.createRadialGradient(64,64,4,64,64,62);g.addColorStop(0,'rgba(255,255,255,0.95)');g.addColorStop(0.5,'rgba(255,255,255,0.45)');g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g;x.fillRect(0,0,128,128);var t=new T.CanvasTexture(c);return t;
  }
  W.glowTex=function(){ if(W._gt)return W._gt; var c=document.createElement('canvas');c.width=c.height=64;var x=c.getContext('2d');var g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.35,'rgba(255,255,255,0.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);W._gt=new T.CanvasTexture(c);return W._gt; };

  // ===== نقاط التوهج (فوانيس، علامات، جزيئات) =====
  W.makeGlowMaterial=function(){
    return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,
      uniforms:{uTime:G.timeUniform,uScale:W.pointScale,uGlow:{value:1}},
      vertexShader:'attribute float size;attribute float phase;attribute vec3 aColor;uniform float uTime;uniform float uScale;uniform float uGlow;varying vec3 vC;varying float vA;'+
        'void main(){vC=aColor;float p=0.82+0.18*sin(uTime*1.6+phase);vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=min(size*p*uScale/max(-mv.z,0.5),180.0);vA=uGlow*p;gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-0.5);float a=smoothstep(0.5,0.0,d);a=a*a;gl_FragColor=vec4(vC*a*vA,a*vA);}'});
  };
  W.glow=function(x,y,z,color,size,phase){W.glows.push({x:x,y:y,z:z,c:color,s:size,p:phase===undefined?Math.random()*6.28:phase});};
  function flushGlows(){
    var n=W.glows.length;if(!n)return;var pos=new Float32Array(n*3),col=new Float32Array(n*3),sz=new Float32Array(n),ph=new Float32Array(n),c=new T.Color();
    W.glows.forEach(function(g,i){pos[i*3]=g.x;pos[i*3+1]=g.y;pos[i*3+2]=g.z;c.set(g.c);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;sz[i]=g.s;ph[i]=g.p;});
    var geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('aColor',new T.BufferAttribute(col,3));geo.setAttribute('size',new T.BufferAttribute(sz,1));geo.setAttribute('phase',new T.BufferAttribute(ph,1));
    W.glowMat=W.makeGlowMaterial();var p=new T.Points(geo,W.glowMat);p.frustumCulled=false;W.scene.add(p);
  }
  function flushMarkers(){
    var n=W.markers.length;if(!n)return;var pos=new Float32Array(n*3),col=new Float32Array(n*3),sz=new Float32Array(n),ph=new Float32Array(n);
    W.markers.forEach(function(m,i){pos[i*3]=m.x;pos[i*3+1]=m.y;pos[i*3+2]=m.z;sz[i]=m.size;ph[i]=i*1.7;});
    var geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('aColor',new T.BufferAttribute(col,3));geo.setAttribute('size',new T.BufferAttribute(sz,1));geo.setAttribute('phase',new T.BufferAttribute(ph,1));
    W.markerGeo=geo;W.markerMat=W.makeGlowMaterial();var p=new T.Points(geo,W.markerMat);p.frustumCulled=false;W.scene.add(p);
    W.markers.forEach(function(m,i){W.paintMarker(i);});
  }
  W.paintMarker=function(i){
    var m=W.markers[i],c=new T.Color(m.seen?0xff8fb8:m.color),k=m.seen?0.55:1,a=W.markerGeo.attributes;
    a.aColor.setXYZ(i,c.r*k,c.g*k,c.b*k);a.aColor.needsUpdate=true;a.size.setX(i,m.seen?m.size*0.7:m.size);a.size.needsUpdate=true;
  };
  W.flushGlows=flushGlows;W.flushMarkers=flushMarkers;
  W.setSeen=function(id){ W.markers.forEach(function(m,i){ if(m.id===id&&!m.seen){m.seen=true;if(W.markerGeo)W.paintMarker(i);} }); };
  W.applySeen=function(seen){ W.markers.forEach(function(m,i){ var s=!!seen[m.id]; if(m.seen!==s){m.seen=s;if(W.markerGeo)W.paintMarker(i);} }); };

  // ===== تحميل الصور =====
  W.loadTextures=function(onProgress){
    var ids=G.ALL_IMAGES,done=0,loader=new T.TextureLoader();
    return new Promise(function(resolve){
      ids.forEach(function(id){
        function fin(){done++;if(onProgress)onProgress(done/ids.length);if(done===ids.length)resolve();}
        loader.load(G.imgTex(id),function(t){
          t.encoding=T.sRGBEncoding;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=false;
          t.userData.aspect=t.image.width/t.image.height;W.tex[id]=t;fin();
        },undefined,function(){W.missing.push(id);console.warn('[365] تعذّر تحميل الصورة',id);fin();});
      });
    });
  };

  // ===== تحديث البيئة لكل إطار =====
  var cTop=new T.Color(),cBot=new T.Color(),cFog=new T.Color(),cSun=new T.Color(),tmpA=new T.Color(),tmpB=new T.Color();
  function lerpPal(a,b,f){
    cTop.copy(C(a.top)).lerp(C(b.top),f);cBot.copy(C(a.bot)).lerp(C(b.bot),f);cFog.copy(C(a.fog)).lerp(C(b.fog),f);cSun.copy(C(a.sun)).lerp(C(b.sun),f);
    return {night:G.lerp(a.night,b.night,f),sunI:G.lerp(a.sunI,b.sunI,f)};
  }
  W.env={night:0,wind:0.3};
  W.updateEnv=function(dt,regionF,px,py,pz,camPos){
    var i=Math.floor(regionF),f=regionF-i;i=G.clamp(i,0,PAL.length-1);var j=Math.min(i+1,PAL.length-1);
    var blend=G.smooth(0.55,1.0,f); var r=lerpPal(PAL[i],PAL[j],blend);
    var night=r.night;W.env.night=night;
    W.sky.material.uniforms.uTop.value.copy(cTop);W.sky.material.uniforms.uBot.value.copy(cBot);W.sky.material.uniforms.uNight.value=night;
    W.scene.fog.color.copy(cFog);W.scene.fog.near=G.lerp(45,28,night);W.scene.fog.far=G.lerp(340,260,night);
    W.sky.position.copy(camPos);W.stars.position.copy(camPos);
    W.stars.material.uniforms.uNight.value=G.smooth(0.25,0.85,night);W.stars.material.uniforms.uFin.value=G.fx.finale;
    W.hemi.color.copy(cTop).lerp(cFog,0.5);W.hemi.groundColor.copy(cFog).multiplyScalar(0.55);W.hemi.intensity=G.lerp(0.95,0.78,night);
    W.sun.color.copy(cSun);W.sun.intensity=r.sunI*G.lerp(1.05,0.8,night);
    W.sun.position.set(px-26,py+46,pz+18);W.sun.target.position.set(px,py,pz);
    if(W.glowMat){W.glowMat.uniforms.uGlow.value=G.lerp(0.55,1.25,night)+G.fx.finale*0.4;}
    if(W.lampMat){tmpA.set(0xffd9a0).multiplyScalar(G.lerp(0.55,1.15,night));W.lampMat.color.copy(tmpA);}
    if(W.cloudMat){W.cloudMat.color.copy(cFog).lerp(tmpB.set(0xffffff),G.lerp(0.55,0.15,night));}
    if(W.partMat){W.partMat.uniforms.uGlow.value=G.lerp(0.25,1.0,night);}
    // مصابيح قريبة
    var lp=W.lamps,b1=null,b2=null,d1=1e9,d2=1e9;
    for(var k=0;k<lp.length;k++){var l=lp[k],d=(l.x-px)*(l.x-px)+(l.z-pz)*(l.z-pz)+(l.y-py)*(l.y-py);if(d<d1){d2=d1;b2=b1;d1=d;b1=l;}else if(d<d2){d2=d;b2=l;}}
    var pi=G.lerp(0.5,2.2,night);
    [b1,b2].forEach(function(l,n){var p=W.pl[n];if(l&&Math.sqrt(n?d2:d1)<22){p.position.set(l.x,l.y,l.z);p.intensity=G.damp(p.intensity,pi,4,dt);}else p.intensity=G.damp(p.intensity,0,4,dt);});
  };
})();
