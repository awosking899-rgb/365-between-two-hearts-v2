// أدوات بناء العالم: جزر، ممرات، جسور، أشجار، فوانيس، أطر الصور، ماء، سحب، جزيئات
(function(){
  var T=THREE,L=G.Layout,W=G.World3D,PAL=W.PAL;
  W.theme=0;
  W.setTheme=function(i){W.theme=i;};
  function P(){return PAL[W.theme];}
  function hash(i,s){var x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x);}
  var mats={};
  function std(color,o){var k=color+'|'+JSON.stringify(o||{});if(!mats[k]){mats[k]=new T.MeshStandardMaterial(Object.assign({color:color,roughness:0.85,metalness:0},o||{}));}return mats[k];}
  W.std=std;
  var rr=G.rng(2024);
  W.rand=rr;

  // ===== مواد خاصة =====
  function addSway(m,amp,freq){
    m.onBeforeCompile=function(sh){
      sh.uniforms.uTime=G.timeUniform;
      sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat sp=instanceMatrix[3].x*0.37+instanceMatrix[3].z*0.53;\n#else\nfloat sp=0.0;\n#endif\n'+
        'float sw=sin(uTime*'+freq.toFixed(2)+'+sp)*'+amp.toFixed(3)+'*max(position.y+0.6,0.0);\ntransformed.x+=sw;transformed.z+=cos(uTime*'+(freq*0.83).toFixed(2)+'+sp)*'+amp.toFixed(3)+'*0.7*max(position.y+0.6,0.0);');
    };
    return m;
  }
  W.lampMat=new T.MeshBasicMaterial({color:0xffd9a0});
  W.partMat=null;

  // ===== التجميع بالنسخ (Instancing) =====
  var CATS={
    trunk:function(){var g=new T.CylinderGeometry(0.13,0.2,1,6);g.translate(0,0.5,0);return [g,std(0xffffff,{roughness:1})];},
    round:function(){return [new T.IcosahedronGeometry(1,1),addSway(new T.MeshStandardMaterial({color:0xffffff,roughness:0.9,flatShading:true}),0.012,1.1)];},
    cone:function(){var g=new T.ConeGeometry(1,2,7);g.translate(0,1,0);return [g,addSway(new T.MeshStandardMaterial({color:0xffffff,roughness:0.9,flatShading:true}),0.02,1.3)];},
    grass:function(){var g=new T.ConeGeometry(0.1,0.62,4);g.translate(0,0.31,0);return [g,addSway(new T.MeshStandardMaterial({color:0xffffff,roughness:1}),0.2,2.2)];},
    stem:function(){var g=new T.CylinderGeometry(0.012,0.016,0.5,4);g.translate(0,0.25,0);return [g,addSway(new T.MeshStandardMaterial({color:0x4f9a5a,roughness:1}),0.12,1.8)];},
    bloom:function(){var g=new T.SphereGeometry(0.11,6,5);return [g,addSway(new T.MeshStandardMaterial({color:0xffffff,roughness:0.7,emissive:0x221122}),0.12,1.8)];},
    rock:function(){return [new T.DodecahedronGeometry(1,0),std(0xffffff,{roughness:1,flatShading:true})];},
    bulb:function(){return [new T.SphereGeometry(0.2,8,6),W.lampMat];},
    post:function(){var g=new T.CylinderGeometry(0.05,0.07,1,6);g.translate(0,0.5,0);return [g,std(0xffffff,{roughness:0.8})];},
    dot:function(){var g=new T.CircleGeometry(0.3,8);g.rotateX(-Math.PI/2);return [g,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.85,fog:true})];},
    cube:function(){return [new T.BoxGeometry(1,1,1),std(0xffffff,{roughness:0.85})];},
    cubeY:function(){var g=new T.BoxGeometry(1,1,1);g.translate(0,0.5,0);return [g,std(0xffffff,{roughness:0.85})];},
    ball:function(){return [new T.SphereGeometry(1,14,10),std(0xffffff,{roughness:0.8})];},
    cyl:function(){var g=new T.CylinderGeometry(1,1,1,16);g.translate(0,0.5,0);return [g,std(0xffffff,{roughness:0.85})];},
    cone2:function(){var g=new T.ConeGeometry(1,1,16);g.translate(0,0.5,0);return [g,std(0xffffff,{roughness:0.85})];},
    lit:function(){return [new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0xffffff})];},
    litBall:function(){return [new T.SphereGeometry(1,12,8),new T.MeshBasicMaterial({color:0xffffff})];}
  };
  var shadowCats={trunk:1,round:1,cone:1,rock:1,post:1,cube:1,cubeY:1,ball:1,cyl:1,cone2:1};
  var dummy=new T.Object3D(),tmpc=new T.Color();
  W.addInst=function(cat,x,y,z,sx,sy,sz,ry,color,rx,rz){
    var c=W.inst[cat];if(!c){var d=CATS[cat]();c=W.inst[cat]={geo:d[0],mat:d[1],items:[]};}
    c.items.push([x,y,z,sx,sy,sz,ry||0,color,rx||0,rz||0]);
  };
  function flushInst(){
    Object.keys(W.inst).forEach(function(k){
      var c=W.inst[k],n=c.items.length;if(!n)return;
      var m=new T.InstancedMesh(c.geo,c.mat,n);
      for(var i=0;i<n;i++){var it=c.items[i];dummy.position.set(it[0],it[1],it[2]);dummy.scale.set(it[3],it[4],it[5]);dummy.rotation.set(it[8],it[6],it[9]);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);tmpc.set(it[7]);m.setColorAt(i,tmpc);}
      m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
      m.castShadow=!!shadowCats[k]&&W.Q.shadows;m.receiveShadow=!!shadowCats[k]&&W.Q.shadows;m.frustumCulled=false;W.scene.add(m);
    });
  }
  W.flushInst=flushInst;

  // ===== بُنى بدائية مع تصادم اختياري =====
  W.cube=function(x,y,z,sx,sy,sz,color,ry,o){W.addInst('cubeY',x,y,z,sx,sy,sz,ry,color);if(o&&o.solid)L.addObstacle(x,y,z,Math.max(sx,sz)*0.55,sy);};
  W.cyl=function(x,y,z,r,h,color,o){W.addInst('cyl',x,y,z,r,h,r,0,color);if(o&&o.solid)L.addObstacle(x,y,z,r,h);};
  W.ball=function(x,y,z,r,color){W.addInst('ball',x,y,z,r,r,r,0,color);};
  W.cone=function(x,y,z,r,h,color){W.addInst('cone2',x,y,z,r,h,r,0,color);};
  W.lit=function(x,y,z,sx,sy,sz,color,ry){W.addInst('lit',x,y,z,sx,sy,sz,ry,color);};
  W.litBall=function(x,y,z,r,color){W.addInst('litBall',x,y,z,r,r,r,0,color);};

  // ===== الجزر =====
  var terrainMat=new T.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:1,side:T.DoubleSide});
  W.disc=function(x,y,z,r,o){
    o=o||{};var seed=o.seed!==undefined?o.seed:L.shapes.length*1.37+0.5;var sh=L.addDisc(x,y,z,r,seed);
    var N=o.sides||44,pal=P(),cg=new T.Color(o.grass||pal.grass),cg2=new T.Color(o.grass2||pal.grass2),cr=new T.Color(o.rock||pal.rock);
    var dirt=new T.Color(0x7a5c4c).lerp(cr,0.3),rockD=cr.clone().multiplyScalar(0.62),edge=cg.clone().multiplyScalar(0.9);
    var pos=[],col=[],idx=[];
    function V(px,py,pz,c){pos.push(px,py,pz);col.push(c.r,c.g,c.b);return pos.length/3-1;}
    var c0=V(x,y,z,cg2);
    var M=[],A=[],B=[],Cc=[],D=[];
    var mixc=new T.Color();
    for(var i=0;i<N;i++){
      var th=i/N*Math.PI*2,R=r*L.radial(th,seed),ct=Math.cos(th),st=Math.sin(th);
      M.push(V(x+ct*R*0.55,y,z+st*R*0.55,mixc.copy(cg).lerp(cg2,0.5+0.5*hash(i,seed)).clone()));
      A.push(V(x+ct*R,y,z+st*R,mixc.copy(edge).lerp(cg,hash(i+7,seed)*0.5).clone()));
      B.push(V(x+ct*R*0.992,y-0.85,z+st*R*0.992,dirt));
      var jc=0.8*(0.88+0.24*hash(i+3,seed));Cc.push(V(x+ct*R*jc,y-r*0.3*(0.85+0.3*hash(i+5,seed)),z+st*R*jc,cr));
      var jd=0.46*(0.8+0.4*hash(i+9,seed));D.push(V(x+ct*R*jd,y-r*0.62*(0.85+0.3*hash(i+11,seed)),z+st*R*jd,rockD));
    }
    var tip=V(x,y-r*(0.9+0.2*hash(1,seed)),z,rockD.clone().multiplyScalar(0.8));
    for(var i2=0;i2<N;i2++){
      var j=(i2+1)%N;
      idx.push(c0,M[j],M[i2]);
      idx.push(M[i2],M[j],A[i2], M[j],A[j],A[i2]);
      function band(u,l){idx.push(u[i2],u[j],l[i2], u[j],l[j],l[i2]);}
      band(A,B);band(B,Cc);band(Cc,D);
      idx.push(D[i2],D[j],tip);
    }
    var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
    var m=new T.Mesh(g,terrainMat);m.receiveShadow=true;m.castShadow=false;W.scene.add(m);
    return sh;
  };
  // ===== ممرات وجسور =====
  var cobble=null,planks=null;
  function cobbleTex(){
    if(cobble)return cobble;var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d');x.fillStyle='#cfc6d6';x.fillRect(0,0,128,128);
    var r=G.rng(9);for(var i=0;i<6;i++)for(var j=0;j<6;j++){var ox=(j%2)*10,w=18+r()*4;x.fillStyle='hsl('+(250+r()*40)+','+(8+r()*10)+'%,'+(74+r()*14)+'%)';
      var px=i*21.3+ox,py=j*21.3;x.beginPath();x.roundRect?x.roundRect(px+1.5,py+1.5,w,18,5):x.rect(px+1.5,py+1.5,w,18);x.fill();}
    cobble=new T.CanvasTexture(c);cobble.wrapS=cobble.wrapT=T.RepeatWrapping;cobble.encoding=T.sRGBEncoding;return cobble;
  }
  function planksTex(){
    if(planks)return planks;var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d');x.fillStyle='#a8764f';x.fillRect(0,0,128,128);
    var r=G.rng(4);for(var i=0;i<8;i++){x.fillStyle='hsl(25,'+(35+r()*15)+'%,'+(38+r()*14)+'%)';x.fillRect(0,i*16+1,128,14);}
    planks=new T.CanvasTexture(c);planks.wrapS=planks.wrapT=T.RepeatWrapping;planks.encoding=T.sRGBEncoding;return planks;
  }
  function segMesh(x1,y1,z1,x2,y2,z2,w,thick,mat){
    var dx=x2-x1,dy=y2-y1,dz=z2-z1,h=Math.hypot(dx,dz),len=Math.hypot(h,dy);
    var g=new T.BoxGeometry(w,thick,len+0.02);var m=new T.Mesh(g,mat);
    m.position.set((x1+x2)/2,(y1+y2)/2-thick/2+0.01,(z1+z2)/2);m.rotation.order='YXZ';m.rotation.y=Math.atan2(dx,dz);m.rotation.x=-Math.atan2(dy,h);
    m.receiveShadow=true;m.castShadow=true;W.scene.add(m);return {m:m,len:len};
  }
  // نقاط: [[x,y,z],...]  kind: path|bridge
  W.walk=function(pts,w,kind,o){
    o=o||{};w=w||4.4;
    for(var i=0;i<pts.length-1;i++){
      var a=pts[i],b=pts[i+1];
      if(i===0) L.spinePush(a[0],a[1],a[2]);
      L.addSeg(a[0],a[1],a[2],b[0],b[1],b[2],w);L.spinePush(b[0],b[1],b[2]);
      var len=Math.hypot(b[0]-a[0],b[2]-a[2]);
      if(kind==='bridge'){
        var tx=planksTex().clone();tx.needsUpdate=true;tx.repeat.set(Math.max(1,w/2),len/1.6);
        segMesh(a[0],a[1],a[2],b[0],b[1],b[2],w,0.25,new T.MeshStandardMaterial({map:tx,roughness:0.9}));
        // دعامات سلكية + سكك
        var dx=b[0]-a[0],dz=b[2]-a[2],nx=dz/len,nz=-dx/len,n=Math.max(2,Math.round(len/3.2)),hw=w/2-0.08;
        for(var s=-1;s<=1;s+=2){
          for(var k=0;k<=n;k++){var t=k/n,px=a[0]+dx*t+nx*hw*s,pz=a[2]+dz*t+nz*hw*s,py=a[1]+(b[1]-a[1])*t;
            W.addInst('post',px,py,pz,1,1.05,1,0,0x8a5a3c);
            if(k%4===2&&o.lamps!==false&&(i+k)%2===0) W.lantern(px,py+1.05,pz,0.0,0xffc880,{small:true,noObs:true});}
          var rail=segMesh(a[0]+nx*hw*s,a[1]+1.0,a[2]+nz*hw*s,b[0]+nx*hw*s,b[1]+1.0,b[2]+nz*hw*s,0.1,0.1,std(0x7a4c32));
        }
      } else {
        var tx2=cobbleTex().clone();tx2.needsUpdate=true;tx2.repeat.set(w/3,len/3);
        segMesh(a[0],a[1],a[2],b[0],b[1],b[2],w,0.3,new T.MeshStandardMaterial({map:tx2,roughness:0.95,color:0xffffff}));
      }
    }
  };
  // ===== أشجار ونباتات =====
  W.tree=function(x,y,z,s,kind,o){
    var pal=P(),r=W.rand;s=s||1;kind=kind||'round';
    var trunkC=kind==='cherry'?0x6a4a52:0x6b4a3a;
    var gc=new T.Color(pal.grass).multiplyScalar(0.72+r()*0.25);
    if(kind==='round'){
      W.addInst('trunk',x,y,z,s,2.8*s,s,0,trunkC);
      W.addInst('round',x,y+3.5*s,z,2.1*s,1.8*s,2.1*s,r()*3,gc.getHex());
      W.addInst('round',x+0.9*s,y+2.9*s,z+0.4*s,1.3*s,1.1*s,1.3*s,r()*3,gc.clone().multiplyScalar(1.12).getHex());
    } else if(kind==='cherry'){
      var pk=[0xffb9d2,0xffa6c6,0xffcfe0][Math.floor(r()*3)];
      W.addInst('trunk',x,y,z,s*1.1,2.6*s,s*1.1,0,trunkC);
      W.addInst('round',x,y+3.4*s,z,2.3*s,1.6*s,2.3*s,r()*3,pk);
      W.addInst('round',x-1.1*s,y+2.9*s,z+0.5*s,1.4*s,1.1*s,1.4*s,r()*3,0xffc4da);
      W.addInst('round',x+1.0*s,y+3.0*s,z-0.5*s,1.3*s,1.0*s,1.3*s,r()*3,0xffb0cb);
    } else if(kind==='pine'){
      W.addInst('trunk',x,y,z,0.9*s,1.8*s,0.9*s,0,trunkC);
      W.addInst('cone',x,y+1.3*s,z,1.8*s,2.2*s,1.8*s,0,gc.getHex());
      W.addInst('cone',x,y+2.8*s,z,1.4*s,2.0*s,1.4*s,0,gc.clone().multiplyScalar(1.1).getHex());
      W.addInst('cone',x,y+4.2*s,z,0.95*s,1.7*s,0.95*s,0,gc.clone().multiplyScalar(1.2).getHex());
    } else { // tall
      W.addInst('trunk',x,y,z,1.3*s,5*s,1.3*s,0,trunkC);
      W.addInst('round',x,y+6.2*s,z,2.6*s,2.2*s,2.6*s,r()*3,gc.getHex());
    }
    if(!(o&&o.noObs)) L.addObstacle(x,y,z,0.55*s,9*s);
  };
  W.bush=function(x,y,z,s){var gc=new T.Color(P().grass).multiplyScalar(0.8+W.rand()*0.3);W.addInst('round',x,y+0.3*s,z,0.8*s,0.55*s,0.8*s,W.rand()*3,gc.getHex());L.addObstacle(x,y,z,0.6*s,1);};
  W.rock=function(x,y,z,s,solid){var c=new T.Color(P().rock).lerp(new T.Color(0xcfcfe0),0.35);W.addInst('rock',x,y+0.15*s,z,s,s*0.6,s*0.85,W.rand()*6,c.getHex(),W.rand()*0.4,W.rand()*0.4);if(solid!==false)L.addObstacle(x,y,z,s*0.8,s);};
  W.flowers=function(x,y,z,r,n,pal2){
    var rg=W.rand,cols=pal2||P().flower;
    for(var i=0;i<n;i++){var a=rg()*6.28,d=Math.sqrt(rg())*r,px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d,h=0.7+rg()*0.7;
      W.addInst('stem',px,y,pz,1,h,1,0,0x5fae6a);W.addInst('bloom',px,y+0.5*h,pz,0.9+rg()*0.5,0.9+rg()*0.5,0.9+rg()*0.5,rg()*3,cols[Math.floor(rg()*cols.length)]);}
  };
  // انثر عناصر على جزيرة بعيدًا عن المسار
  W.scatter=function(d,o){
    o=o||{};var rg=W.rand,pal=P(),R=d.r,placed=[];
    function ok(x,z,m,self){
      if(L.groundAt(x,z,d.y,self)===null) return false; if(L.nearSpine(x,z,m)) return false;
      if(o.keep){for(var k=0;k<o.keep.length;k++){var kp=o.keep[k];if(Math.hypot(x-kp[0],z-kp[1])<kp[2])return false;}}
      return true;
    }
    function pick(f0,f1){var a=rg()*6.283,rd=R*(f0+(f1-f0)*Math.sqrt(rg()));return [d.x+Math.cos(a)*rd,d.z+Math.sin(a)*rd];}
    var kinds=o.kinds||['round','round','pine'];
    for(var i=0,t=0;i<(o.trees||0)&&t<(o.trees||0)*14;t++){
      var p=pick(o.tMin||0.35,o.tMax||0.93);if(!ok(p[0],p[1],4.0,2.2))continue;
      var close=false;for(var q=0;q<placed.length;q++){if(Math.hypot(placed[q][0]-p[0],placed[q][1]-p[1])<3.4){close=true;break;}}if(close)continue;
      placed.push(p);W.tree(p[0],d.y,p[1],0.85+rg()*0.7,kinds[Math.floor(rg()*kinds.length)]);i++;
    }
    for(var b=0,t2=0;b<(o.bushes||0)&&t2<60;t2++){var pb=pick(0.3,0.95);if(!ok(pb[0],pb[1],2.8,1.2))continue;W.bush(pb[0],d.y,pb[1],0.8+rg()*0.8);b++;}
    for(var f=0,t3=0;f<(o.flowers||0)&&t3<(o.flowers||0)*8;t3++){var pf=pick(0.15,0.95);if(!ok(pf[0],pf[1],2.7,1.0))continue;W.flowers(pf[0],d.y,pf[1],1.3,5+Math.floor(rg()*6),o.fpal);f++;}
    var gn=Math.floor((o.grass||0)*W.Q.grass);
    for(var g=0,t4=0;g<gn&&t4<gn*4;t4++){var pg=pick(0.05,0.97);if(!ok(pg[0],pg[1],2.55,0.8))continue;
      var gc=new T.Color(pal.grass).lerp(new T.Color(pal.grass2),rg()).multiplyScalar(0.85+rg()*0.3);W.addInst('grass',pg[0],d.y,pg[1],0.8+rg()*0.8,0.6+rg()*0.9,0.8+rg()*0.8,rg()*6,gc.getHex());g++;}
    for(var k2=0,t5=0;k2<(o.rocks||0)&&t5<40;t5++){var pr=pick(0.4,0.95);if(!ok(pr[0],pr[1],3.2,1.4))continue;W.rock(pr[0],d.y,pr[1],0.5+rg()*0.9);k2++;}
  };
  // ===== إضاءة =====
  W.lantern=function(x,y,z,h,color,o){
    o=o||{};var s=o.small?0.7:1;
    if(h>0){W.addInst('post',x,y,z,s,h,s,0,0x4a3a46);if(!o.noObs)L.addObstacle(x,y,z,0.22,h);}
    var by=y+h+0.05;W.addInst('bulb',x,by,z,s,s*1.15,s,0,color||0xffc880);
    W.glow(x,by,z,color||0xffc880,(o.small?2.6:4.2)*(o.glow||1));
    W.lamps.push({x:x,y:by,z:z});
  };
  W.lamp=function(x,y,z,h,color,side){ // عمود شارع بذراع
    W.addInst('post',x,y,z,1.5,h,1.5,0,0x2e2a3a);L.addObstacle(x,y,z,0.28,h);
    W.addInst('cubeY',x+side*0.5,y+h,z,1.0,0.1,0.1,0,0x2e2a3a);
    W.addInst('bulb',x+side*0.9,y+h-0.12,z,1.4,1.0,1.4,0,color||0xffd49a);W.glow(x+side*0.9,y+h-0.12,z,color||0xffd49a,6);W.lamps.push({x:x+side*0.9,y:y+h-0.12,z:z});
  };
  W.stringLights=function(a,b,n,sag,color,cols){
    var pts=[];
    for(var i=0;i<=n;i++){var t=i/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t-Math.sin(t*Math.PI)*sag,z=a[2]+(b[2]-a[2])*t;pts.push(new T.Vector3(x,y,z));
      if(i>0&&i<n){var c=cols?cols[i%cols.length]:color;W.addInst('bulb',x,y-0.1,z,0.45,0.5,0.45,0,c);W.glow(x,y-0.1,z,c,1.8);}}
    var g=new T.BufferGeometry().setFromPoints(pts);var ln=new T.Line(g,new T.LineBasicMaterial({color:0x3a2c3c}));W.scene.add(ln);
  };
  // ===== نصوص معلّقة =====
  W.label=function(text,x,y,z,h,o){
    o=o||{};var c=document.createElement('canvas'),px=96,font=(o.weight||'700')+' '+px+'px '+(o.font||'Amiri, Tajawal, serif');var cx=c.getContext('2d');cx.font=font;
    var w=Math.ceil(cx.measureText(text).width)+60;c.width=w;c.height=px*1.7;cx=c.getContext('2d');cx.font=font;cx.textAlign='center';cx.textBaseline='middle';
    cx.shadowColor=o.glow||'rgba(255,200,230,0.9)';cx.shadowBlur=26;cx.fillStyle=o.color||'#fff';cx.fillText(text,w/2,c.height/2);cx.fillText(text,w/2,c.height/2);
    var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;
    var sp=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false,opacity:o.opacity||1}));sp.position.set(x,y,z);sp.scale.set(h*c.width/c.height,h,1);W.scene.add(sp);return sp;
  };
  // ===== أطر الصور =====
  W.frame=function(id,x,y,z,yaw,h,o){
    o=o||{};var t=W.tex[id],asp=t?t.userData.aspect:0.75,w=h*asp,g=new T.Group();
    var fr=new T.Mesh(new T.BoxGeometry(w+0.2,h+0.2,0.1),std(o.frame||0xe6c283,{roughness:0.4,metalness:0.3}));fr.castShadow=true;g.add(fr);
    var pic=new T.Mesh(new T.PlaneGeometry(w,h),t?new T.MeshBasicMaterial({map:t}):new T.MeshBasicMaterial({color:0x555566}));pic.position.z=0.056;g.add(pic);
    if(o.double){var pic2=new T.Mesh(new T.PlaneGeometry(w,h),t?new T.MeshBasicMaterial({map:t}):new T.MeshBasicMaterial({color:0x555566}));pic2.position.z=-0.056;pic2.rotation.y=Math.PI;g.add(pic2);}
    g.position.set(x,y,z);g.rotation.y=yaw||0;W.scene.add(g);g.userData={w:w,h:h};if(o.sway){W.frames.push({g:g,base:g.rotation.z,ph:W.rand()*6});}return g;
  };
  // ===== ماء =====
  W.pond=function(x,y,z,r,o){
    o=o||{};var m=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:G.timeUniform,uA:{value:new T.Color(o.a||0x3b7fd0)},uB:{value:new T.Color(o.b||0x9fe0ff)},uNight:{value:0}},
      vertexShader:'varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
      fragmentShader:'uniform float uTime;uniform vec3 uA;uniform vec3 uB;varying vec2 vUv;varying vec3 vW;'+
        'float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}'+
        'void main(){float r=length(vUv-0.5)*2.0;float rip=sin(r*22.0-uTime*1.5)*0.5+0.5;float n=sin(vW.x*1.4+uTime*0.9)*sin(vW.z*1.2-uTime*0.7);'+
        'vec3 c=mix(uA,uB,0.5+0.3*n+0.12*rip);float sp=step(0.992,h(floor(vW.xz*6.0)+floor(uTime*1.5)))*0.8;c+=sp;float e=smoothstep(1.0,0.86,r);gl_FragColor=vec4(c,0.88*e);}'});
    var mesh=new T.Mesh(new T.CircleGeometry(r,36),m);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y+0.09,z);mesh.renderOrder=2;W.scene.add(mesh);
    var n=Math.max(8,Math.round(r*3.2));for(var i=0;i<n;i++){var a=i/n*6.283+W.rand()*0.3;W.rock(x+Math.cos(a)*(r+0.2),y,z+Math.sin(a)*(r+0.2),0.35+W.rand()*0.35,false);}
    L.addObstacle(x,y,z,r+0.35,0.4,{noCam:true});L.ponds.push({x:x,y:y,z:z,r:r});
  };
  W.fall=function(x,y,z,yaw,w,h){
    var m=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uTime:G.timeUniform},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform float uTime;varying vec2 vUv;void main(){float s=sin(vUv.x*34.0+sin(vUv.y*5.0)*2.0)*0.5+0.5;float f=fract(vUv.y*4.0-uTime*1.1+s*0.4);float a=(0.35+0.4*f)*smoothstep(0.0,0.06,vUv.x)*smoothstep(1.0,0.94,vUv.x)*smoothstep(0.0,0.2,vUv.y);gl_FragColor=vec4(vec3(0.75,0.9,1.0)+0.2*f,a*0.75);}'});
    var mesh=new T.Mesh(new T.PlaneGeometry(w,h),m);mesh.position.set(x,y-h/2,z);mesh.rotation.y=yaw;W.scene.add(mesh);
    for(var i=0;i<4;i++){var sp=new T.Sprite(new T.SpriteMaterial({map:W.cloudTex,transparent:true,depthWrite:false,opacity:0.6,color:0xffffff}));sp.position.set(x+(W.rand()-0.5)*w,y-h+2+W.rand()*3,z+(W.rand()-0.5)*3);sp.scale.set(14,9,1);W.scene.add(sp);}
    L.falls.push({x:x,y:y,z:z});
  };
  // ===== علامات التفاعل =====
  // o: {id,kind,x,y,z,r,color,label,... } kind: mem|set|voice|sit
  W.memory=function(o){
    var gy=o.y+(o.lift!==undefined?o.lift:1.7);
    var col=o.color||0xffe3a8;
    W.markers.push({id:o.id,x:o.x,y:gy,z:o.z,color:col,size:o.size||8,seen:false});
    // حلقة أرضية ناعمة
    var ring=new T.Mesh(new T.RingGeometry(0.75,0.9,32),new T.MeshBasicMaterial({color:col,transparent:true,opacity:0.55,side:T.DoubleSide,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.set(o.x,o.y+0.12,o.z);W.scene.add(ring);W.rings.push(ring);
    L.addInteract({id:o.id,kind:o.kind,x:o.x,y:o.y,z:o.z,r:o.r||3.6,label:o.label||'استكشاف',set:o.set,index:o.index,key:o.key,seat:o.seat,audio:o.audio});
  };
  W.rings=[];

  // ===== السحب =====
  W.buildClouds=function(){
    var N=W.Q.clouds,mat=W.cloudMat=new T.SpriteMaterial({map:W.cloudTex,transparent:true,depthWrite:false,opacity:0.62,fog:true,color:0xffffff});
    W.cloudList=[];var r=G.rng(77),total=L.total;
    for(var i=0;i<N;i++){
      var p=L.pointAt(total*(i+r())/N),side=(r()<0.5?-1:1)*(25+r()*210),layer=r();
      var sp=new T.Sprite(mat);var sc=90+r()*150;sp.scale.set(sc,sc*(0.3+r()*0.2),1);
      var y=p.y-45-layer*85;sp.position.set(p.x+side,y,p.z+(r()-0.5)*120);W.scene.add(sp);W.cloudList.push({sp:sp,x:sp.position.x,ph:r()*6.28,amp:6+r()*12});
    }
    // سحب أعلى متفرقة
    var M=Math.floor(N*0.22),mat2=new T.SpriteMaterial({map:W.cloudTex,transparent:true,depthWrite:false,opacity:0.32,fog:true,color:0xffffff});
    for(var j=0;j<M;j++){var q=L.pointAt(total*(j+r())/M);var s2=new T.Sprite(mat2);var sc2=40+r()*70;s2.scale.set(sc2,sc2*0.35,1);s2.position.set(q.x+(r()<0.5?-1:1)*(40+r()*160),q.y+10+r()*60,q.z+(r()-0.5)*80);W.scene.add(s2);W.cloudList.push({sp:s2,x:s2.position.x,ph:r()*6.28,amp:10+r()*14});}
  };
  W.buildPathDots=function(){
    var sp=L.spine;
    for(var i=0;i<sp.length-1;i++){var a=sp[i],b=sp[i+1],len=Math.hypot(b.x-a.x,b.z-a.z),n=Math.floor(len/7);
      for(var k=1;k<=n;k++){var t=k/(n+1);W.addInst('dot',a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t+0.17,a.z+(b.z-a.z)*t,1,1,1,0,0xffe2a8);}}
  };
  // ===== جزيئات (يراع + بتلات) =====
  W.initParticles=function(){
    var N=Math.floor(120*W.Q.parts),pos=new Float32Array(N*3),col=new Float32Array(N*3),sz=new Float32Array(N),ph=new Float32Array(N),r=G.rng(3);
    W.parts={n:N,pos:pos,off:[],geo:null};
    for(var i=0;i<N;i++){W.parts.off.push([r()*60-30,r()*18-3,r()*60-30,r()*6.28,0.3+r()*0.5]);col[i*3]=1;col[i*3+1]=0.9;col[i*3+2]=0.6;sz[i]=0.7+r()*0.9;ph[i]=r()*6.28;}
    var g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('aColor',new T.BufferAttribute(col,3));g.setAttribute('size',new T.BufferAttribute(sz,1));g.setAttribute('phase',new T.BufferAttribute(ph,1));
    W.parts.geo=g;W.partMat=W.makeGlowMaterial();var p=new T.Points(g,W.partMat);p.frustumCulled=false;W.scene.add(p);
    // بتلات/أوراق متساقطة
    var M=Math.floor(70*W.Q.parts),pp=new Float32Array(M*3),pc=new Float32Array(M*3),ps=new Float32Array(M),pph=new Float32Array(M);
    W.petals={n:M,pos:pp,off:[],geo:null};
    for(var k=0;k<M;k++){W.petals.off.push([r()*50-25,r()*22,r()*50-25,r()*6.28,0.5+r()*0.8]);pc[k*3]=1;pc[k*3+1]=0.75;pc[k*3+2]=0.85;ps[k]=0.6;pph[k]=r()*6.28;}
    var g2=new T.BufferGeometry();g2.setAttribute('position',new T.BufferAttribute(pp,3));g2.setAttribute('aColor',new T.BufferAttribute(pc,3));g2.setAttribute('size',new T.BufferAttribute(ps,1));g2.setAttribute('phase',new T.BufferAttribute(pph,1));
    W.petals.geo=g2;W.petalMat=W.makeGlowMaterial();W.petalMat.uniforms.uGlow.value=0.9;var p2=new T.Points(g2,W.petalMat);p2.frustumCulled=false;W.scene.add(p2);
  };
  var fin=new T.Color();
  W.updateParticles=function(t,dt,cx,cy,cz,regionF,night){
    var P0=W.parts,i,o;
    for(i=0;i<P0.n;i++){o=P0.off[i];
      o[1]+=Math.sin(t*0.4+o[3])*dt*0.1;
      var x=((o[0]+t*0.25*Math.cos(o[3]))%60+60)%60-30,z=((o[2]+t*0.2*Math.sin(o[3]))%60+60)%60-30;
      P0.pos[i*3]=cx+x+Math.sin(t*o[4]+o[3])*0.8;P0.pos[i*3+1]=cy+o[1]+Math.sin(t*0.9+o[3]*3)*0.5;P0.pos[i*3+2]=cz+z+Math.cos(t*o[4]*0.9+o[3])*0.8;}
    P0.geo.attributes.position.needsUpdate=true;
    var Q=W.petals,pal=PAL[G.clamp(Math.round(regionF),0,PAL.length-1)],pc=Q.geo.attributes.aColor;
    var warm=regionF>=5.5&&regionF<7.5; // أجواء احتفالية: ألوان متعددة
    for(i=0;i<Q.n;i++){o=Q.off[i];
      var y=((o[1]-t*o[4]*0.7)%22+22)%22,x2=((o[0]+Math.sin(t*0.5+o[3])*3+t*0.4)%50+50)%50-25,z2=((o[2]+Math.cos(t*0.4+o[3])*3)%50+50)%50-25;
      Q.pos[i*3]=cx+x2;Q.pos[i*3+1]=cy-3+y;Q.pos[i*3+2]=cz+z2;
      if(warm){var hcol=[0xffd36a,0xff8fc2,0x8fe0ff,0xc7a6ff][i%4];fin.set(hcol);}else if(night>0.55){fin.set(0xbfd0ff);}else fin.set(i%3?0xffc1dc:0xfff0b8);
      pc.setXYZ(i,fin.r,fin.g,fin.b);}
    Q.geo.attributes.position.needsUpdate=true;pc.needsUpdate=true;
  };
  W.animate=function(t,dt,px,py,pz){
    W.rings.forEach(function(r,i){var s=1+0.12*Math.sin(t*1.6+i);r.scale.set(s,s,s);r.material.opacity=0.4+0.2*Math.sin(t*1.6+i);});
    W.frames.forEach(function(f){f.g.rotation.z=f.base+Math.sin(t*0.9+f.ph)*0.03;});
    if(W.cloudList)W.cloudList.forEach(function(c){c.sp.position.x=c.x+Math.sin(t*0.03+c.ph)*c.amp;});
    if(W.bars)W.bars.forEach(function(b){b.m.scale.y=b.base*(0.55+0.45*Math.sin(t*b.sp+b.ph));});
  };
})();
