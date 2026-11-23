// الحلقة الرئيسية: التحميل، الحركة، الكاميرا، التفاعل، الحفظ
(function(){
  var L=G.Layout,W=G.World3D,I=G.Input,UI=G.UI,A=G.Audio,S=G.Save,$=G.$,T=THREE;
  var WALK=2.5,RUN=5.2,RAD=0.38;
  var state='boot',clock=0,introT=0,menuT=0,saveT=0,lastS=0,region=-1,regionF=0;
  var me,bana,P={x:0,y:0,z:0,vx:0,vz:0,yaw:Math.PI,speed:0,run:false},C={x:0,y:0,z:0,vx:0,vz:0,yaw:Math.PI,speed:0};
  var cam={yaw:Math.PI,elev:0.36,dist:5.6,tx:0,ty:1.5,tz:0,cx:0,cy:3,cz:6,dragT:0,dd:5.6,init:false};
  var sit=null,near=null,errShown=false,fps={t:0,n:0,low:0},perf={pr:1,shadows:true,adapt:true};
  var ready=false;

  function ground(x,z,y,m){return L.groundAt(x,z,y,m);}
  function startPoint(){var a=L.pointAt(4),b=L.pointAt(7);return {x:a.x,y:a.y,z:a.z,yaw:Math.atan2(b.x-a.x,b.z-a.z)};}

  // ===== بدء التشغيل =====
  G.start=function(){
    S.load(); UI.init(); UI.bindSettings();
    UI.onSettings=applySettings;
    var canvas=$('gl');
    try{ W.init(canvas,S.data.settings.quality); }
    catch(e){ console.error(e); UI.error('متصفحك أو جهازك لا يدعم العرض ثلاثي الأبعاد (WebGL2). جرّبي متصفحًا حديثًا مثل Chrome أو Safari.'); return; }
    perf.pr=W.renderer.getPixelRatio(); perf.shadows=W.Q.shadows; perf.adapt=S.data.settings.quality==='auto';
    I.init(canvas);
    W.renderer.onLost=function(){ UI.toast('انقطع العرض مؤقتًا… جارٍ الاستعادة'); };
    W.renderer.onRestored=function(){ UI.toast('عاد العالم'); };
    UI.setProgress(0.04,'جارٍ تجهيز العالم…');
    var fontsP=Promise.race([ (document.fonts&&document.fonts.load)?Promise.all([document.fonts.load('700 40px Amiri'),document.fonts.load('400 40px Amiri'),document.fonts.load('400 20px Tajawal')]).catch(function(){}):Promise.resolve(), new Promise(function(r){setTimeout(r,2200);}) ]);
    fontsP.then(function(){ UI.setProgress(0.1); return W.loadTextures(function(p){UI.setProgress(0.1+p*0.5);}); })
    .then(function(){ UI.setProgress(0.62,'جارٍ بناء العالم…'); return new Promise(function(r){setTimeout(r,30);}); })
    .then(buildWorld)
    .catch(function(e){ console.error(e); UI.error('حدث خطأ أثناء تجهيز العالم: '+(e&&e.message?e.message:e)); });
  };

  function buildWorld(){
    G.Regions.build(); G.Act.build();
    W.buildPathDots(); W.flushInst(); W.flushGlows(); W.flushMarkers(); W.buildClouds(); W.initParticles();
    W.applySeen(S.data.seen);
    UI.setProgress(0.88,'جارٍ تجهيز الشخصيتين…');
    me=G.makeHuman('me'); bana=G.makeHuman('bana');
    W.scene.add(me.root); W.scene.add(bana.root);
    me.state.onStep=function(r){A.step(r);}; bana.state.onStep=function(r){A.step(r);};
    me.root.name=G.NAMES.companion; bana.root.name=G.NAMES.player;
    G.Act.bind({P:P,C:C,me:me,bana:bana,cam:cam,I:I,region:function(){return region;},placeP:function(x,y,z,yaw){P.x=x;P.y=y;P.z=z;P.yaw=yaw;P.vx=P.vz=0;},camYaw:function(y){cam.yaw=y;}});
    var sp=startPoint(); placeAll(sp.x,sp.y,sp.z,sp.yaw);
    cam.yaw=sp.yaw; setMenuCamera(0); W.renderer.render(W.scene,W.camera);
    bind();
    UI.setProgress(1);
    if(W.missing.length) console.warn('[365] صور لم تُحمَّل:',W.missing);
    ready=true; state='menu'; UI.ready(S.hasJourney());
    requestAnimationFrame(frame);
  }

  function placeAll(x,y,z,yaw){
    P.x=x;P.y=y;P.z=z;P.yaw=yaw;P.vx=P.vz=0;
    C.x=x+Math.cos(yaw)*1.0-Math.sin(yaw)*0.7; C.z=z-Math.sin(yaw)*1.0-Math.cos(yaw)*0.7; C.y=y; C.yaw=yaw; C.vx=C.vz=0;
    var g=ground(C.x,C.z,y,0.2); if(g===null){C.x=x;C.z=z-0.5;C.y=y;}
    sit=null; poseChars(0);
  }

  // ===== الربط =====
  function bind(){
    $('btnStart').onclick=function(){ A.init(); S.resetJourney(); S.data.started=true; beginPlay(false); };
    $('btnContinue').onclick=function(){ A.init(); beginPlay(true); };
    $('btnNew').onclick=function(){ UI.confirm('بدء رحلة جديدة سيمسح التقدّم والذكريات المستكشفة. هل أنتِ متأكدة؟',function(){ S.resetJourney(); W.applySeen({}); $('btnContinue').classList.add('hidden');$('btnNew').classList.add('hidden');$('btnStart').classList.remove('hidden'); }); };
    UI.onExplore=doExplore;
    UI.onResume=function(){ A.resume(); I.enabled=true; };
    UI.onSeen=function(id,first){ if(first) W.setSeen(id); };
    UI.onRestart=function(){ G.Act.cancel(true); S.resetJourney(); G.Act.refresh(); S.data.started=true; W.applySeen({}); G.fx.finale=0; toStart(); UI.toast(L.regionNames[0]); };
    UI.onStartOver=function(){ G.Act.cancel(true); toStart(); };
    UI.onViewerClose=function(){ I.reset(); };
    I.onEsc=function(){ if(state!=='play'&&state!=='intro')return; if(UI.viewerOpen)return; if(UI.menuOpen){UI.closeMenus();I.enabled=true;} else UI.openPause(); };
    I.onUnlock=function(){ if((state==='play')&&!UI.viewerOpen&&!UI.menuOpen) UI.openPause(); };
    document.addEventListener('visibilitychange',function(){ if(document.hidden){ saveNow(); A.suspend(); } else if(state==='play'||state==='intro'||state==='menu'){ A.resume(); } });
    window.addEventListener('pagehide',saveNow);
    window.addEventListener('resize',function(){ if(ready) W.resize(); });
    applySettings();
  }
  function applySettings(){
    var q=S.data.settings.quality;
    if(!W.renderer)return;
    perf.adapt=(q==='auto');
    var base=q==='low'?1.0:(q==='high'?Math.min(window.devicePixelRatio||1,2):Math.min(window.devicePixelRatio||1,G.isMobile?1.5:2));
    perf.pr=base; W.Q.pr=base; W.renderer.setPixelRatio(base); W.resize();
    perf.shadows=(q!=='low'); W.renderer.shadowMap.enabled=perf.shadows&&W.Q.shadows;
  }
  function toStart(){ var sp=startPoint(); placeAll(sp.x,sp.y,sp.z,sp.yaw); cam.yaw=sp.yaw; cam.init=false; region=-1; lastS=0; saveNow(); }

  function beginPlay(resume){
    UI.hideStart(); UI.showHud(true); UI.fade(true);
    var sp=startPoint();
    if(resume&&S.data.pos&&ground(S.data.pos.x,S.data.pos.z,S.data.pos.y,0.2)!==null){ placeAll(S.data.pos.x,S.data.pos.y,S.data.pos.z,S.data.yaw||sp.yaw); }
    else placeAll(sp.x,sp.y,sp.z,sp.yaw);
    cam.yaw=P.yaw; cam.elev=0.36; cam.dist=G.isMobile?6.2:5.6; cam.init=false; region=-1; lastS=L.project(P.x,P.z).s;
    state='intro'; introT=0; I.reset(); I.enabled=false;
    setTimeout(function(){UI.fade(false);},350);
    S.data.started=true; S.save();
  }

  // ===== المنطق =====
  var seatBack=null;
  function doExplore(){
    if(UI.viewerOpen||UI.menuOpen||state!=='play')return;
    if(sit){ standUp(); return; }
    var o=near; if(!o)return; A.init();
    if(o.kind==='mem'){ UI.openMemory(o.key); }
    else if(o.kind==='set'){ UI.openSet(o.set,o.index); }
    else if(o.kind==='voice'){ UI.openAudio(G.AUDIO[o.audio]); }
    else if(o.kind==='sit'){ sitDown(o); }
    else if(o.kind==='act'){ G.Act.start(o.id); }
    I.reset();
  }
  function sitDown(o){
    var s=o.seat; if(!s)return;
    seatBack={x:P.x,y:P.y,z:P.z}; sit={seat:s,t:0,key:o.key,opened:false};
    A.chime(false);
  }
  function standUp(){
    if(!sit)return; var b=seatBack||{x:P.x,y:P.y,z:P.z};
    P.x=b.x;P.y=b.y;P.z=b.z; C.x=b.x+1.2;C.z=b.z+0.2;C.y=b.y; var g=ground(C.x,C.z,b.y,0.2); if(g===null){C.x=b.x;C.z=b.z-0.6;} sit=null;
  }
  function poseChars(dt){
    var rs=sit?1:0;
    if(sit){
      var s=sit.seat; sit.t+=dt;
      var k=Math.min(1,sit.t*1.6);
      P.x=G.lerp(P.x,s.bana.x,k*0.25+0.0);P.z=G.lerp(P.z,s.bana.z,k*0.25);P.y=G.lerp(P.y,s.y-0.05,k*0.25);P.yaw=G.dampAngle(P.yaw,s.yaw,6,dt||0.016);
      C.x=G.lerp(C.x,s.me.x,k*0.25);C.z=G.lerp(C.z,s.me.z,k*0.25);C.y=G.lerp(C.y,s.y-0.05,k*0.25);C.yaw=G.dampAngle(C.yaw,s.yaw,6,dt||0.016);
    }
    bana.root.position.set(P.x,P.y,P.z); bana.root.rotation.y=P.yaw;
    var pl=G.Act&&G.Act.place;
    if(pl){ me.root.position.set(pl.x,pl.y,pl.z); me.root.rotation.y=pl.yaw; C.x=pl.x;C.y=pl.gy!==undefined?pl.gy:pl.y;C.z=pl.z;C.yaw=pl.yaw; me.update(dt||0.0001,0,false,!!pl.sit); }
    else { me.root.position.set(C.x,C.y,C.z); me.root.rotation.y=C.yaw; me.update(dt||0.0001,sit?0:C.speed,P.run&&C.speed>3.5,!!sit); }
    bana.update(dt||0.0001,sit?0:P.speed,P.run,!!sit||(G.Act&&G.Act.banaSit&&G.Act.banaSit()));
    // الأقدام أثناء الجلوس تُرفع قليلًا ويُستوي الجذع
    if(sit&&sit.t>0.8&&!sit.opened){ sit.opened=true; if(sit.key){ setTimeout(function(){ if(sit&&state==='play') UI.openMemory(sit.key); },500); } }
  }

  function updateMove(dt){
    var actLock=G.Act&&G.Act.locked(); var allowed=(state==='play')&&!UI.viewerOpen&&!UI.menuOpen&&!sit&&!actLock;
    var ax=allowed?I.axes():[0,0],mag=Math.min(1,Math.hypot(ax[0],ax[1]));
    if(sit&&state==='play'&&!UI.viewerOpen&&!UI.menuOpen){ var a2=I.axes(); if(Math.hypot(a2[0],a2[1])>0.35){ standUp(); } }
    var run=allowed&&I.run&&mag>0.15; P.run=run;
    var f=Math.sin(cam.yaw),g=Math.cos(cam.yaw),rx=-Math.cos(cam.yaw),rz=Math.sin(cam.yaw);
    var dx=f*ax[1]+rx*ax[0],dz=g*ax[1]+rz*ax[0],sp=(run?RUN:WALK)*mag;
    var tvx=mag>0.01?dx/Math.max(0.0001,Math.hypot(dx,dz))*sp:0,tvz=mag>0.01?dz/Math.max(0.0001,Math.hypot(dx,dz))*sp:0;
    P.vx=G.damp(P.vx,tvx,10,dt);P.vz=G.damp(P.vz,tvz,10,dt);
    if(sit){P.speed=0;return;}
    if(actLock){P.vx=P.vz=0;P.speed=G.damp(P.speed,0,14,dt);var fy=G.Act.faceYaw();if(fy!==null)P.yaw=G.dampAngle(P.yaw,fy,10,dt);return;}
    var nx=P.x+P.vx*dt,nz=P.z+P.vz*dt,gy=ground(nx,nz,P.y,0.28);
    if(gy===null){ gy=ground(nx,P.z,P.y,0.28); if(gy!==null){nz=P.z;P.vz=0;} else { gy=ground(P.x,nz,P.y,0.28); if(gy!==null){nx=P.x;P.vx=0;} else {nx=P.x;nz=P.z;P.vx=P.vz=0;gy=P.y;} } }
    var tmp={x:nx,z:nz}; L.resolve(tmp,RAD,P.y);
    var g2=ground(tmp.x,tmp.z,P.y,0.18); if(g2!==null){nx=tmp.x;nz=tmp.z;gy=g2;}
    var moved=Math.hypot(nx-P.x,nz-P.z); P.x=nx;P.z=nz;
    P.y=Math.abs(gy-P.y)>1.2?gy:G.damp(P.y,gy,18,dt);
    P.speed=G.damp(P.speed,moved/Math.max(dt,1e-4),14,dt);
    if(mag>0.12&&moved>0.0005) P.yaw=G.dampAngle(P.yaw,Math.atan2(P.vx,P.vz),13,dt);
  }
  function updateCompanion(dt){
    if(sit||(G.Act&&G.Act.place))return;
    var ov=G.Act&&G.Act.comp,yaw=P.yaw,fx=Math.sin(yaw),fz=Math.cos(yaw),rx=-Math.cos(yaw),rz=Math.sin(yaw);
    // يقف على يسار بانا وخلفها قليلًا ويتأخر عندما تتحرك
    var tx=P.x+rx*-1.0-fx*0.7,tz=P.z+rz*-1.0-fz*0.7; if(ov){tx=ov.x;tz=ov.z;} var dx=tx-C.x,dz=tz-C.z,d=Math.hypot(dx,dz);
    if(d>14&&!ov){ C.x=P.x-fx*1.2;C.z=P.z-fz*1.2;C.y=P.y;d=0;dx=dz=0; }
    var maxS=ov?(ov.speed||2.6):Math.max(2,P.speed*1.2+1.5),want=Math.min(maxS,d*2.4),vx=0,vz=0;
    if(d>0.12){vx=dx/d*want;vz=dz/d*want;}
    C.vx=G.damp(C.vx,vx,9,dt);C.vz=G.damp(C.vz,vz,9,dt);
    var nx=C.x+C.vx*dt,nz=C.z+C.vz*dt,gy=ground(nx,nz,C.y,0.2);
    if(gy===null){ gy=ground(nx,C.z,C.y,0.2); if(gy!==null){nz=C.z;} else { gy=ground(C.x,nz,C.y,0.2); if(gy!==null){nx=C.x;} else {nx=C.x;nz=C.z;gy=C.y;} } }
    var tmp={x:nx,z:nz}; L.resolve(tmp,0.34,C.y); var g2=ground(tmp.x,tmp.z,C.y,0.1); if(g2!==null){nx=tmp.x;nz=tmp.z;gy=g2;}
    var moved=Math.hypot(nx-C.x,nz-C.z); C.x=nx;C.z=nz; C.y=Math.abs(gy-C.y)>1.2?gy:G.damp(C.y,gy,16,dt);
    C.speed=G.damp(C.speed,moved/Math.max(dt,1e-4),12,dt);
    if(C.speed>0.5) C.yaw=G.dampAngle(C.yaw,Math.atan2(C.vx,C.vz),11,dt);
    else C.yaw=G.dampAngle(C.yaw,(ov&&ov.yaw!==undefined)?ov.yaw:P.yaw,3,dt);
    if(ov&&d<0.2)ov.arrived=true; else if(ov)ov.arrived=false;
  }

  function updateCamera(dt,force){
    var drag=I.yawD||I.pitchD;
    cam.yaw-=I.yawD; cam.elev=G.clamp(cam.elev+I.pitchD,0.05,1.2); cam.dist=G.clamp(cam.dist+I.zoomD*0.5,3.4,9); I.yawD=0;I.pitchD=0;I.zoomD=0;
    if(drag)cam.dragT=0.0; else cam.dragT+=dt;
    var ax=I.axes();
    if(state==='play'&&!UI.viewerOpen&&!sit&&cam.dragT>1.2&&ax[1]>0.55&&Math.abs(ax[0])<0.45) cam.yaw=G.dampAngle(cam.yaw,P.yaw,0.9,dt);
    if(sit){ cam.yaw=G.dampAngle(cam.yaw,sit.seat.yaw+Math.PI+0.35,1.6,dt); cam.elev=G.damp(cam.elev,0.22,1.5,dt); }
    var ty=P.y+(sit?1.0:1.45),fo=G.Act&&G.Act.focus,FX=fo?fo.x:P.x,FZ=fo?fo.z:P.z; if(fo){ ty=fo.y; if(!drag)cam.elev=G.damp(cam.elev,fo.elev,2.5,dt); }
    if(!cam.init||force){cam.tx=FX;cam.ty=ty;cam.tz=FZ;cam.init=true;}
    cam.tx=G.damp(cam.tx,FX,sit?4:(fo?5:13),dt);cam.ty=G.damp(cam.ty,ty,6,dt);cam.tz=G.damp(cam.tz,FZ,sit?4:(fo?5:13),dt);
    var fx=Math.sin(cam.yaw),fz=Math.cos(cam.yaw),ce=Math.cos(cam.elev),se=Math.sin(cam.elev);
    var want=(fo?fo.dist:cam.dist)*(W.camera.aspect<0.8?1.25:1),d=want;
    // منع اختراق المجسمات: قرّب الكاميرا حتى يزول الحاجز
    for(var tries=0;tries<14;tries++){
      var px=cam.tx-fx*ce*d,py=cam.ty+se*d,pz=cam.tz-fz*ce*d;
      var g=ground(px,pz,P.y,0); var low=(g!==null&&py<g+0.8);
      if(!low&&!L.camBlocked(px,py,pz,1.7))break; d-=0.45; if(d<1.6)break;
    }
    cam.dd=(d<cam.dd)?G.damp(cam.dd,d,14,dt):G.damp(cam.dd,d,2.2,dt);
    var dd=Math.min(cam.dd,want);
    var cx=cam.tx-fx*ce*dd,cy=cam.ty+se*dd,cz=cam.tz-fz*ce*dd,gg=ground(cx,cz,P.y,0);
    if(gg!==null&&cy<gg+0.7)cy=gg+0.7;
    cam.cx=cx;cam.cy=cy;cam.cz=cz;
    W.camera.position.set(cx,cy,cz); W.camera.lookAt(cam.tx,cam.ty+0.15,cam.tz);
  }
  function setMenuCamera(t){
    var a=t*0.05+0.4,c=L.pointAt(18),R=34;
    W.camera.position.set(c.x+Math.sin(a)*R,c.y+11+Math.sin(t*0.13)*1.2,c.z+Math.cos(a)*R*0.75+8);
    W.camera.lookAt(c.x,c.y+3,c.z-8); cam.cx=W.camera.position.x;cam.cy=W.camera.position.y;cam.cz=W.camera.position.z;
  }

  function updateRegion(dt){
    var pr=L.project(P.x,P.z,lastS); lastS=pr.s;
    var st=L.regionStarts,n=st.length,i=L.regionAt(lastS),a=st[i],b=i+1<n?st[i+1]:L.total;
    regionF=i+G.clamp((lastS-a)/Math.max(1,b-a),0,0.999);
    if(i!==region){ region=i; S.data.region=i; S.data.maxRegion=Math.max(S.data.maxRegion||0,i); UI.toast(L.regionNames[i]); A.setRegion(i,W.env.night); }
    return regionF;
  }
  function waterLevel(){
    var w=0,k;
    for(k=0;k<L.ponds.length;k++){var p=L.ponds[k],d=Math.hypot(P.x-p.x,P.z-p.z)-p.r;if(Math.abs(p.y-P.y)<12)w=Math.max(w,1-d/16);}
    for(k=0;k<L.falls.length;k++){var f=L.falls[k],d2=Math.hypot(P.x-f.x,P.z-f.z);if(Math.abs(f.y-P.y)<40)w=Math.max(w,1-d2/34);}
    return G.clamp(w,0,1);
  }
  function saveNow(){
    if(state!=='play'&&state!=='intro')return;
    var sp0=(G.Act&&G.Act.safePos())||P; S.data.pos={x:sp0.x,y:sp0.y,z:sp0.z}; S.data.yaw=P.yaw; S.data.started=true; S.save();
  }

  // ===== الإطار =====
  var last=0,hudNear=null;
  function frame(ts){
    requestAnimationFrame(frame);
    var dt=Math.min(0.05,Math.max(0.001,(ts-last)/1000)); if(!last)dt=0.016; last=ts;
    try{ step(dt); W.renderer.render(W.scene,W.camera); }
    catch(e){ if(!errShown){errShown=true;console.error('[365] خطأ في الإطار',e);} }
    perfWatch(dt);
  }
  function step(dt){
    clock+=dt; G.timeUniform.value=clock;
    if(state==='menu'){
      menuT+=dt; setMenuCamera(menuT);
      var rf0=0; W.updateEnv(dt,rf0,P.x,P.y,P.z,W.camera.position); W.updateParticles(clock,dt,P.x,P.y,P.z,0,W.env.night); W.animate(clock,dt,P.x,P.y,P.z);
      poseChars(dt); return;
    }
    if(state==='intro'){
      introT+=dt; var k=G.smooth(0,1,introT/3.4);
      updateMove(dt); updateCompanion(dt);
      var d0=cam.dist,e0=cam.elev,y0=cam.yaw; cam.dist=G.lerp(15,d0,k);cam.elev=G.lerp(0.62,e0,k);cam.yaw=y0+G.lerp(0.9,0,k);
      updateCamera(dt,introT<0.05); cam.dist=d0;cam.elev=e0;cam.yaw=y0;
      var sc=G.smooth(0.35,1.2,introT/1.6); bana.root.scale.set(sc,sc,sc); me.root.scale.set(sc,sc,sc);
      var rf=updateRegion(dt); W.updateEnv(dt,rf,P.x,P.y,P.z,W.camera.position);
      var fk=G.lerp(0.16,1,G.smooth(0,1,introT/3.2)); W.scene.fog.near*=fk;W.scene.fog.far*=fk;
      W.updateParticles(clock,dt,P.x,P.y,P.z,rf,W.env.night); W.animate(clock,dt,P.x,P.y,P.z);
      poseChars(dt);
      if(introT>=3.4){ state='play'; I.enabled=true; bana.root.scale.set(1,1,1); me.root.scale.set(1,1,1); }
      return;
    }
    // ===== اللعب =====
    var blocked=UI.viewerOpen||UI.menuOpen; I.enabled=!blocked;
    updateMove(dt); updateCompanion(dt);
    if(!blocked&&I.consumeInteract()){ if(G.Act.cur)G.Act.press(); else if(near||sit)doExplore(); } else if(blocked) I.consumeInteract();
    if(!blocked) G.Act.update(dt);
    updateCamera(dt);
    var rf2=updateRegion(dt);
    W.updateEnv(dt,rf2,P.x,P.y,P.z,W.camera.position);
    W.updateParticles(clock,dt,cam.tx,cam.ty,cam.tz,rf2,W.env.night); W.animate(clock,dt,P.x,P.y,P.z);
    poseChars(dt);
    A.update(dt,{night:W.env.night,water:waterLevel(),wind:0.3+G.clamp((P.y-0)/120,0,0.4)});
    // زر الاستكشاف
    if(!blocked){
      near=G.Act.cur?null:L.nearestInteract(P.x,P.y,P.z);
      var lbl=G.Act.cur?G.Act.btn():(sit?'قيام':(near?near.label:null)); UI.setExplore(lbl);
    } else UI.setExplore(null);
    saveT+=dt; if(saveT>3){saveT=0;saveNow();}
  }
  function perfWatch(dt){
    if(!perf.adapt||state==='boot'||document.hidden)return;
    fps.t+=dt;fps.n++;
    if(fps.t>2.5){ var f=fps.n/fps.t; fps.t=0;fps.n=0;
      if(f<27){ fps.low++; if(fps.low>=2){ fps.low=0;
        if(perf.pr>0.85){ perf.pr=Math.max(0.8,perf.pr*0.8); W.Q.pr=perf.pr; W.renderer.setPixelRatio(perf.pr); W.resize(); }
        else if(W.renderer.shadowMap.enabled){ W.renderer.shadowMap.enabled=false; } } }
      else fps.low=0; }
  }

  // ===== أدوات للاختبار والتشخيص =====
  G.debug={
    gotoRegion:function(i,off){ var s=L.regionStarts[i]+(off===undefined?14:off),p=L.pointAt(s),q=L.pointAt(s+4); placeAll(p.x,p.y,p.z,Math.atan2(q.x-p.x,q.z-p.z)); cam.yaw=P.yaw; cam.init=false; lastS=s; },
    gotoS:function(s){ var p=L.pointAt(s),q=L.pointAt(s+4); placeAll(p.x,p.y,p.z,Math.atan2(q.x-p.x,q.z-p.z)); cam.yaw=P.yaw; cam.init=false; lastS=s; },
    place:function(x,y,z,yaw){ placeAll(x,y,z,yaw); cam.yaw=yaw; cam.init=false; },
    state:function(){ return {state:state,P:P,C:C,cam:cam,region:region,regionF:regionF,near:near&&near.id,sit:!!sit,total:L.total,regions:L.regionStarts,fps:fps}; },
    skipIntro:function(){ introT=99; },
    comp:function(){ return {C:C}; },
    stats:function(){ return W.renderer.stats; }
  };
})();
