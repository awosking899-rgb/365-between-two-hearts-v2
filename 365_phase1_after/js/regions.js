// مناطق الرحلة الخمس عشرة — عالم واحد متصل
(function(){
  var T=THREE,L=G.Layout,W=G.World3D;
  var PI=Math.PI;
  function face(x,z,tx,tz){return Math.atan2(tx-x,tz-z);}
  function rot(dx,dz,yaw){return [dx*Math.cos(yaw)+dz*Math.sin(yaw),-dx*Math.sin(yaw)+dz*Math.cos(yaw)];}
  // مسار متعدد النقاط: at(t,lat) lat>0 يسار اتجاه السير
  function mkAt(pts){
    var segs=[],tot=0;
    for(var i=0;i<pts.length-1;i++){var dx=pts[i+1][0]-pts[i][0],dz=pts[i+1][2]-pts[i][2],len=Math.hypot(dx,dz);segs.push({x:pts[i][0],z:pts[i][2],dx:dx,dz:dz,len:len,c0:tot,c1:tot+len});tot+=len;}
    return function(t,lat){
      var s=G.clamp(t,0,1)*tot,i=0;while(i<segs.length-1&&s>segs[i].c1)i++;var sg=segs[i],u=(s-sg.c0)/sg.len;
      var nx=sg.dz/sg.len,nz=-sg.dx/sg.len;lat=lat||0;
      return {x:sg.x+sg.dx*u+nx*lat,z:sg.z+sg.dz*u+nz*lat,hx:sg.dx/sg.len,hz:sg.dz/sg.len};
    };
  }
  function edge(d,th,k){var R=d.r*L.radial(th,d.seed)*(k||1);return {x:d.x+Math.cos(th)*R,z:d.z+Math.sin(th)*R};}
  function bench(x,y,z,yaw,col){
    col=col||0x8a5a3c;var a=rot(0,0,yaw);
    function put(dx,dy,dz,sx,sy,sz,c){var r=rot(dx,dz,yaw);W.addInst('cubeY',x+r[0],y+dy,z+r[1],sx,sy,sz,yaw,c);}
    put(0,0.38,0,1.9,0.12,0.62,col);put(0,0.62,-0.28,1.9,0.5,0.1,col);put(-0.8,0,0,0.12,0.4,0.5,0x4a3a46);put(0.8,0,0,0.12,0.4,0.5,0x4a3a46);
    L.addObstacle(x,y,z,0.95,1.2);
  }
  function seatInfo(x,y,z,yaw){ // لجلوس بانا وأنا جنبًا إلى جنب
    var a=rot(-0.4,0.05,yaw),b=rot(0.4,0.05,yaw);
    return {yaw:yaw,y:y+0.5,bana:{x:x+a[0],z:z+a[1]},me:{x:x+b[0],z:z+b[1]}};
  }
  function pedestal(x,y,z,col){W.cyl(x,y,z,0.55,0.8,0xcfc8dc,{});W.cyl(x,y+0.8,z,0.65,0.1,col||0xffe3a8,{});L.addObstacle(x,y,z,0.6,0.9);}
  function arch(x,y,z,yaw,w,h,col){
    var l=rot(-w/2,0,yaw),r=rot(w/2,0,yaw);
    W.cube(x+l[0],y,z+l[1],0.5,h,0.5,col,yaw,{solid:true});W.cube(x+r[0],y,z+r[1],0.5,h,0.5,col,yaw,{solid:true});
    W.cube(x,y+h,z,w+0.9,0.5,0.6,col,yaw);
  }
  function rosesArch(c,yaw,rad,col){ // قوس ورد حول الجسر
    var nx=Math.cos(yaw),nz=-Math.sin(yaw);
    for(var i=0;i<=22;i++){var a=i/22*PI,px=c.x+nx*Math.cos(a)*rad,pz=c.z+nz*Math.cos(a)*rad,py=c.y+0.4+Math.sin(a)*(rad*1.25);
      W.addInst('bloom',px,py,pz,1.7,1.7,1.7,0,i%3?0xe0315a:0xff7fa6);
      W.addInst('round',px+(W.rand()-0.5)*0.3,py-0.1,pz,0.28,0.18,0.28,W.rand()*3,0x3f9a55);
      if(i%4===0)W.glow(px,py,pz,0xff9fbf,2.2);}
  }
  var CTX=[],SKY=[];
  var BR_Y=[2,2,3,3,3,3,3,3,3,3,3,3,3];

  // ===== هيكل المنطقة =====
  function region(spec,O){
    W.setTheme(spec.theme);L.markRegion(spec.name);
    var R=spec.R,cx=O.x+spec.dx,cz=O.z-R*0.78;
    var d=W.disc(cx,O.y,cz,R,{});d.r=R;
    var E={x:cx+spec.ex,y:O.y,z:cz-R*0.78};
    var pts=[[O.x,O.y,O.z],[cx+spec.w1,O.y,cz+R*0.30],[cx+spec.w2,O.y,cz-R*0.28],[E.x,E.y,E.z]];
    W.walk(pts,spec.pw||4.4,'path');
    var ctx={d:d,O:O,E:E,cx:cx,cz:cz,y:O.y,R:R,pts:pts,at:mkAt(pts)};
    spec.build(ctx);
    var N={x:E.x+spec.bdx,y:E.y+spec.bdy,z:E.z-spec.bl};
    var mid=[(E.x+N.x)/2+(spec.bend||0),(E.y+N.y)/2,(E.z+N.z)/2];
    W.walk([[E.x,E.y,E.z],mid,[N.x,N.y,N.z]],4.0,'bridge');
    ctx.N=N;ctx.mid=mid;spec.after&&spec.after(ctx);CTX.push(ctx);
    return N;
  }
  function pathLanterns(ctx,n,t0,t1,lat,col){
    for(var i=0;i<n;i++){var t=t0+(t1-t0)*i/Math.max(1,n-1),p=ctx.at(t,(i%2?-1:1)*lat);W.lantern(p.x,ctx.y,p.z,2.5,col||0xffc880);}
  }

  var SPECS=[
  // ---------- 1 بداية الرسائل ----------
  {name:'بداية الرسائل',theme:0,R:30,dx:0,ex:-4,w1:5,w2:-6,bl:58,bdy:2,bdx:-8,bend:4,build:function(c){
    var y=c.y,g=c.at(0.1,0);arch(g.x,y,g.z,0,8,5.2,0xf2e4f0);
    W.label('365',g.x,y+7.2,g.z,2.8,{color:'#fff',glow:'rgba(255,170,220,1)'});
    W.label('بين قلبين',g.x,y+5.9,g.z,1.1,{weight:'400'});
    var pp=c.at(0.5,6.5);pedestal(pp.x,y,pp.z,0xffe3a8);
    var yaw=face(pp.x,pp.z,c.at(0.5,0).x,c.at(0.5,0).z);
    W.frame('memories_01',pp.x,y+2.6,pp.z,yaw,2.3,{sway:true});
    W.label('✉',pp.x,y+4.4,pp.z,1.1,{});
    W.memory({id:'first',kind:'mem',key:'first',x:pp.x,y:y,z:pp.z,r:4.2,color:0xffe3a8,lift:1.7});
    var b1=c.at(0.28,-7);bench(b1.x,y,b1.z,face(b1.x,b1.z,c.at(.28,0).x,c.at(.28,0).z));
    var b2=c.at(0.75,7);bench(b2.x,y,b2.z,face(b2.x,b2.z,c.at(.75,0).x,c.at(.75,0).z));
    pathLanterns(c,6,0.2,0.95,2.9);
    W.scatter(c.d,{trees:9,kinds:['cherry','round','cherry'],bushes:6,flowers:18,grass:340,rocks:3,fpal:[0xffffff,0xffd6e6,0xe6d6ff]});
  }},
  // ---------- 2 الاعتراف ----------
  {name:'الاعتراف',theme:1,R:26,dx:3,ex:2,w1:-5,w2:6,bl:72,bdy:2,bdx:2,bend:0,build:function(c){
    var y=c.y,p=c.at(0.78,0);
    // جازيبو من أعمدة وسقف
    var gx=p.x+8,gz=p.z-1;
    for(var i=0;i<6;i++){var a=i/6*PI*2;W.cube(gx+Math.cos(a)*3.4,y,gz+Math.sin(a)*3.4,0.4,3.6,0.4,0xf6e8ef,0,{solid:true});}
    W.cone(gx,y+3.6,gz,4.4,2.6,0xe0527f);W.cyl(gx,y,gz,3.1,0.18,0xf3d9e4);
    pedestal(gx,y+0.18,gz,0xff9fbf);
    W.memory({id:'confession',kind:'mem',key:'confession',x:gx,y:y+0.18,z:gz,r:4.6,color:0xff9fbf,lift:1.8});
    // كلمات متوهجة (من المحادثة الأصلية)
    var w=[['يب',-4,5.5,-2],['احبكك',4.5,6.8,3],['حتنىى!',gx-0.5,6.2,gz-4.5]];
    w.forEach(function(o,i){var x=i===2?o[1]:gx+o[1],z=i===2?o[3]:gz+o[3];W.label(o[0],x,y+o[2],z,1.5,{color:'#ffd6e6',glow:'rgba(255,90,150,1)'});});
    // ورود
    for(var k=0;k<5;k++){var rp=c.at(0.15+k*0.17,(k%2?-1:1)*3.4);W.flowers(rp.x,y,rp.z,1.2,8,[0xe0315a,0xff7fa6,0xffc2d6]);}
    var l=c.at(0.5,-6);bench(l.x,y,l.z,face(l.x,l.z,c.at(.5,0).x,c.at(.5,0).z));
    pathLanterns(c,6,0.1,0.9,2.9,0xff9fbf);
    W.scatter(c.d,{trees:8,kinds:['cherry','round'],bushes:5,flowers:12,grass:300,rocks:2,keep:[[gx,gz,6]],fpal:[0xe0315a,0xff7fa6,0xffffff]});
  },after:function(c){
    var dx=c.N.x-c.E.x,dz=c.N.z-c.E.z,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);
    [0.25,0.5,0.75].forEach(function(t){rosesArch({x:c.E.x+dx*t,y:c.E.y+(c.N.y-c.E.y)*t+1.0,z:c.E.z+dz*t},yaw,2.55);});
  }},
  // ---------- 3 حديقة الاسم ----------
  {name:'حديقة الاسم',theme:2,R:35,dx:-3,ex:3,w1:7,w2:-7,bl:60,bdy:3,bdx:6,bend:-5,build:function(c){
    var y=c.y,tp=c.at(0.5,10);
    W.tree(tp.x,y,tp.z,2.1,'cherry');
    W.label('سلام',tp.x,y+9.2,tp.z,2.6,{color:'#fff7d6',glow:'rgba(255,210,120,1)'});
    for(var i=0;i<9;i++){var a=i/9*PI*2,px=tp.x+Math.cos(a)*4.2,pz=tp.z+Math.sin(a)*4.2;W.lantern(px,y,pz,1.0+0.2*(i%3),i%2?0xffc880:0xffd9ee,{small:true,noObs:true});}
    var pp=c.at(0.5,5.2);pedestal(pp.x,y,pp.z,0xffd9a0);
    W.memory({id:'name',kind:'mem',key:'name',x:pp.x,y:y,z:pp.z,r:4.4,color:0xffd9a0,lift:1.8});
    var e=edge(c.d,PI*0.85,0.88);W.pond(e.x+2,y,e.z-1,4.2);W.fall(e.x-0.4,y,e.z+0.6,face(0,0,Math.cos(PI*0.85),Math.sin(PI*0.85))*0+PI/2+0.4,6,40);
    W.pond(c.at(0.25,-9).x,y,c.at(0.25,-9).z,3.2);
    pathLanterns(c,8,0.08,0.95,2.9);
    var b=c.at(0.78,6.5);bench(b.x,y,b.z,face(b.x,b.z,c.at(.78,0).x,c.at(.78,0).z));
    W.scatter(c.d,{trees:16,kinds:['cherry','round','cherry'],bushes:8,flowers:42,grass:480,rocks:3,keep:[[tp.x,tp.z,6.5],[pp.x,pp.z,3]]});
  }},
  // ---------- 4 شارع المكالمات ----------
  {name:'شارع المكالمات',theme:3,R:28,dx:0,ex:0,w1:0,w2:0,pw:9,bl:56,bdy:3,bdx:0,bend:0,build:function(c){
    var y=c.y;
    for(var i=0;i<6;i++){var t=0.08+i*0.17,a=c.at(t,5.6),b=c.at(t,-5.6);W.lamp(a.x,y,a.z,4.3,0xffd49a,-1);W.lamp(b.x,y,b.z,4.3,0xffd49a,1);}
    // أكشاك هاتف
    [[0.3,7.5,'calls'],[0.7,-7.5,'dummy']].forEach(function(o,i){
      var p=c.at(o[0],o[1]),yaw=face(p.x,p.z,c.at(o[0],0).x,c.at(o[0],0).z);
      var cols=0xd9425f;W.cube(p.x,y,p.z,1.8,0.2,1.8,0x40404c);
      [[-0.8,-0.8],[0.8,-0.8],[-0.8,0.8],[0.8,0.8]].forEach(function(q){var r=rot(q[0],q[1],yaw);W.cube(p.x+r[0],y,p.z+r[1],0.14,3.1,0.14,cols,yaw);});
      W.cube(p.x,y+3.1,p.z,2.0,0.2,2.0,cols,yaw);W.lit(p.x,y+1.6,p.z,1.4,2.6,1.4,0xffe7b0,yaw);L.addObstacle(p.x,y,p.z,1.2,3.2);
      W.glow(p.x,y+1.8,p.z,0xffd9a0,7);W.label('☎',p.x,y+4.0,p.z,1.0,{});
      if(i===0){var q2=rot(0,1.9,yaw);W.memory({id:'calls',kind:'mem',key:'calls',x:p.x+q2[0],y:y,z:p.z+q2[1],r:3.4,color:0xffd9a0,lift:1.9});}
    });
    // أعمدة موجات صوتية متحركة
    W.bars=W.bars||[];
    for(var k=0;k<14;k++){var side=k%2?-1:1,pp=c.at(0.1+k*0.063,side*3.2);var h=1.2+W.rand()*1.6;
      var m=new T.Mesh(new T.BoxGeometry(0.34,1,0.34),new T.MeshBasicMaterial({color:k%3===0?0xffb36b:(k%3===1?0xff8fb8:0xffe39a)}));m.position.set(pp.x,y,pp.z);m.scale.y=h;W.scene.add(m);
      m.geometry.translate(0,0.5,0);W.bars.push({m:m,base:h,sp:1.4+W.rand()*1.8,ph:W.rand()*6});W.glow(pp.x,y+h*0.8,pp.z,0xffb98a,1.6);}
    var b=c.at(0.5,-7.2);bench(b.x,y,b.z,face(b.x,b.z,c.at(.5,0).x,c.at(.5,0).z));
    var b3=c.at(0.88,7.2);bench(b3.x,y,b3.z,face(b3.x,b3.z,c.at(.88,0).x,c.at(.88,0).z));
    W.scatter(c.d,{trees:7,kinds:['round','pine'],bushes:4,flowers:10,grass:260,rocks:3,tMin:0.55});
  }},
  // ---------- 5 ركن الغناء ----------
  {name:'ركن الغناء',theme:4,R:30,dx:2,ex:-2,w1:-5,w2:5,bl:58,bdy:3,bdx:-4,bend:3,build:function(c){
    var y=c.y,s=c.at(0.55,9);
    W.cyl(s.x,y,s.z,7.2,0.55,0xb88a63);L.addDisc(s.x,y+0.55,s.z,6.9,0);W.cyl(s.x,y+0.55,s.z,6.6,0.06,0xd9aa78);
    for(var i=0;i<4;i++){var a=i/4*PI*2+PI/4,px=s.x+Math.cos(a)*6.4,pz=s.z+Math.sin(a)*6.4;W.cyl(px,y+0.55,pz,0.14,4.6,0x6a4a3a);W.lantern(px,y+5.2,pz,0,0xffc880,{noObs:true,glow:1.4});
      var a2=(i+1)/4*PI*2+PI/4;W.stringLights([px,y+5.1,pz],[s.x+Math.cos(a2)*6.4,y+5.1,s.z+Math.sin(a2)*6.4],9,0.8,0xffd9a0,[0xffd9a0,0xff9fbf,0xaee0ff]);}
    W.cyl(s.x,y+0.6,s.z-1.2,0.04,1.5,0x333340);W.ball(s.x,y+2.2,s.z-1.2,0.12,0xdddddd);
    var cols=[0xff9fbf,0xffd36a,0x9ad6ff,0xc7a6ff];
    G.AUDIO.forEach(function(a,k){
      var ang=-PI/2+(k-1.5)*0.62,px=s.x+Math.cos(ang)*0+Math.sin((k-1.5)*0.7)*4.4,pz=s.z+3.3+Math.abs(k-1.5)*0.0-1.2+(k%2?0.6:-0.2);
      W.label('♪',px,y+3.4,pz,1.2,{color:'#'+cols[k].toString(16).padStart(6,'0'),glow:'rgba(255,200,230,1)'});
      W.memory({id:a.id,kind:'voice',audio:k,x:px,y:y+0.55,z:pz,r:3.0,color:cols[k],lift:1.5,size:7});
    });
    var l=c.at(0.2,-6.5);bench(l.x,y,l.z,face(l.x,l.z,c.at(.2,0).x,c.at(.2,0).z));
    pathLanterns(c,6,0.1,0.95,2.9);
    W.scatter(c.d,{trees:9,kinds:['round','pine','cherry'],bushes:5,flowers:14,grass:300,rocks:2,keep:[[s.x,s.z,9]]});
  }},
  // ---------- 6 شارع الألعاب ----------
  {name:'شارع الألعاب',theme:5,R:32,dx:-2,ex:2,w1:6,w2:-6,bl:58,bdy:3,bdx:3,bend:-3,build:function(c){
    var y=c.y;
    // بلاط ملوّن
    for(var i=0;i<40;i++){var p=c.at(i/40,0),col=[0xff7ad9,0x7af0ff,0xffe97a,0x9aff8f][i%4];W.addInst('dot',p.x,y+0.2,p.z,2.2,1,2.2,0,col);}
    // جراني: بيت صغير
    var g=c.at(0.22,-9);W.cube(g.x,y,g.z,4.4,3.0,4.0,0xd8c8e8,0,{solid:true});W.cone(g.x,y+3.0,g.z,3.6,2.4,0xb23a5a);W.lit(g.x,y+0.2,g.z+2.05,1.0,1.8,0.1,0xffd36a);W.glow(g.x,y+1.2,g.z+2.4,0xffd36a,5);
    var gp=c.at(0.22,-4.7);W.memory({id:'granny',kind:'mem',key:'granny',x:gp.x,y:y,z:gp.z,r:3.4,color:0xff9fbf});W.label('جراني',g.x,y+6.2,g.z,1.0,{});
    // روبلوكس: طوب
    var r=c.at(0.42,9);W.cube(r.x,y,r.z,3.4,1.6,2.2,0xe0394a,0,{solid:true});for(var a=0;a<4;a++)W.cyl(r.x-1.05+(a%2)*2.1,y+1.6,r.z-0.5+Math.floor(a/2)*1.0,0.34,0.22,0xe0394a);
    W.cube(r.x+0.6,y+1.8,r.z,2.4,1.5,1.8,0x3a7be0);W.cyl(r.x+0.1,y+3.3,r.z,0.3,0.2,0x3a7be0);W.cyl(r.x+1.1,y+3.3,r.z,0.3,0.2,0x3a7be0);
    var rp=c.at(0.42,5);W.memory({id:'roblox',kind:'mem',key:'roblox',x:rp.x,y:y,z:rp.z,r:3.4,color:0x9ad6ff});W.label('روبلوكس',r.x,y+5.2,r.z,1.0,{});
    // فرقة القنبلة
    var b=c.at(0.62,-9);W.ball(b.x,y+1.5,b.z,1.5,0x22222c);W.cyl(b.x,y+2.9,b.z,0.14,0.6,0x8a6a4a);W.glow(b.x,y+3.7,b.z,0xffb36b,5);W.label('★',b.x,y+4.8,b.z,0.9,{color:'#ffd36a'});L.addObstacle(b.x,y,b.z,1.6,3);
    var bp=c.at(0.62,-5);W.memory({id:'bomb',kind:'mem',key:'bomb',x:bp.x,y:y,z:bp.z,r:3.4,color:0xffd36a});W.label('فرقة القنبلة',b.x,y+6.3,b.z,1.0,{});
    // ماينكرافت
    var m=c.at(0.82,9);[[0,0,0],[2.2,0,0],[0,0,2.2],[1.1,2.2,1.1]].forEach(function(o,i){var h=2.2;W.cube(m.x+o[0],y+o[1],m.z+o[2],h,h*0.78,h,0x7a5236,0,{solid:i<3});W.cube(m.x+o[0],y+o[1]+h*0.78,m.z+o[2],h+0.02,h*0.22,h+0.02,0x5fc24a);});
    var mp=c.at(0.82,5);W.memory({id:'minecraft',kind:'mem',key:'minecraft',x:mp.x,y:y,z:mp.z,r:3.4,color:0x9aff8f});W.label('ماينكرافت',m.x+1,y+6.0,m.z+1,1.0,{});
    for(var k=0;k<5;k++){var p1=c.at(0.1+k*0.2,-8),p2=c.at(0.1+k*0.2,8);W.stringLights([p1.x,y+4.6,p1.z],[p2.x,y+4.6,p2.z],10,1.0,0xffffff,[0xff7ad9,0x7af0ff,0xffe97a,0x9aff8f]);
      W.cyl(p1.x,y,p1.z,0.12,4.7,0x3b2c6a);W.cyl(p2.x,y,p2.z,0.12,4.7,0x3b2c6a);}
    W.scatter(c.d,{trees:6,kinds:['round','pine'],bushes:5,flowers:14,grass:200,rocks:4,keep:[[g.x,g.z,5],[r.x,r.z,5],[b.x,b.z,3],[m.x,m.z,5]],fpal:[0xff7ad9,0x7af0ff,0xffe97a]});
  }},
  // ---------- 7 عيد الميلاد ----------
  {name:'منطقة عيد الميلاد',theme:6,R:36,dx:0,ex:0,w1:0,w2:0,pw:5.2,bl:58,bdy:3,bdx:0,bend:0,build:function(c){
    var y=c.y,set=G.SETS.birthday,prev=null;
    for(var i=0;i<13;i++){
      var side=i%2?-1:1,t=0.06+(i/12)*0.84,p=c.at(t,side*5.6),m=c.at(t,0),yaw=face(p.x,p.z,m.x,m.z);
      W.cyl(p.x,y,p.z,0.13,2.0,0x6a4a5a);L.addObstacle(p.x,y,p.z,0.4,3);
      W.frame(set[i],p.x,y+3.3,p.z,yaw,2.7,{sway:false,frame:0xffd9a0});
      var q=c.at(t,side*3.0);
      W.memory({id:set[i],kind:'set',set:'birthday',index:i,x:q.x,y:y,z:q.z,r:3.2,color:0xffd9a0,lift:1.7,size:6.5});
      if(i%2===0&&i<12){var o=c.at(t,-5.6);W.stringLights([p.x,y+4.9,p.z],[o.x,y+4.9,o.z],10,1.1,0xffd9a0,[0xffd9a0,0xff9fbf,0xaee0ff,0xfff0a8]);}
    }
    // فوانيس طائرة
    var r=G.rng(21);for(var k=0;k<46;k++){var pp=c.at(r(),(r()-0.5)*22);W.lantern(pp.x,y+6+r()*10,pp.z,0,[0xffd9a0,0xff9fbf,0xfff0a8,0xaee0ff][k%4],{noObs:true,glow:1.2});}
    // كعكة
    var ck=c.at(0.97,9);W.cyl(ck.x,y,ck.z,1.6,0.9,0xf2dfc8);W.cyl(ck.x,y+0.9,ck.z,1.25,0.6,0xffb3cf);W.cyl(ck.x,y+1.5,ck.z,0.8,0.45,0xfff2e0);
    for(var cn=0;cn<5;cn++){var ca=cn/5*PI*2;W.cyl(ck.x+Math.cos(ca)*0.45,y+1.95,ck.z+Math.sin(ca)*0.45,0.04,0.3,0xffffff);W.glow(ck.x+Math.cos(ca)*0.45,y+2.35,ck.z+Math.sin(ca)*0.45,0xffc060,2);}
    L.addObstacle(ck.x,y,ck.z,1.7,2.4);
    W.label('🎂',ck.x,y+3.8,ck.z,1.1,{});
    W.scatter(c.d,{trees:9,kinds:['cherry','round'],bushes:4,flowers:10,grass:240,rocks:2,tMin:0.6});
  }},
  // ---------- 8 معرض الصور ----------
  {name:'معرض الصور',theme:7,R:36,dx:3,ex:-3,w1:-6,w2:6,bl:58,bdy:3,bdx:-5,bend:3,build:function(c){
    var y=c.y,set=G.SETS.gallery,ar=c.at(0.55,-2);
    var wc={x:c.cx+8,z:c.cz-6};
    // جدار قوسي
    var cnt=6,Rw=14;
    for(var i=0;i<cnt;i++){
      var ang=-PI*0.5+(i-(cnt-1)/2)*0.34+PI,px=wc.x+Math.cos(ang)*0,pz=0;
      var a=PI*0.5+(i-(cnt-1)/2)*0.36; // قوس نحو الشمال
      px=wc.x+Math.sin(a-PI*0.5)*Rw*0+Math.cos(a)*Rw*-1;pz=wc.z-Math.sin(a)*Rw*0.55-4;
    }
    var panels=[];
    for(var j=0;j<cnt;j++){
      var u=(j-(cnt-1)/2)*0.4,px2=wc.x+Math.sin(u)*14,pz2=wc.z-6+(1-Math.cos(u))*8*-1+(-4),yaw=face(px2,pz2,wc.x,wc.z+10);
      pz2=wc.z-10+(1-Math.cos(u))*10;yaw=face(px2,pz2,wc.x,wc.z+8);
      var w=5.2;W.cube(px2,y,pz2,w,4.6,0.5,0x3b3470,yaw);var hh=(j%2?2.0:2.6),idx=j;
      var fr=rot(0,0.45,yaw);W.frame(set[idx],px2+fr[0],y+2.4,pz2+fr[1],yaw,hh,{frame:0xe6c283});
      var q=rot(0,2.6,yaw);W.memory({id:set[idx],kind:'set',set:'gallery',index:idx,x:px2+q[0],y:y,z:pz2+q[1],r:3.0,color:0xe8d8ff,lift:1.5,size:6});
      L.addWall(px2-Math.cos(yaw)*2.4,y,pz2+Math.sin(yaw)*2.4,px2+Math.cos(yaw)*2.4,pz2-Math.sin(yaw)*2.4,4.5,0.5);
    }
    W.cyl(wc.x,y,wc.z,0.1,0.1,0x000000);
    // أعمدة صور على طول الطريق
    for(var k=0;k<4;k++){
      var side=k%2?-1:1,t=0.18+k*0.2,p=c.at(t,side*6.2),m=c.at(t,0),yw=face(p.x,p.z,m.x,m.z),idx2=6+k;
      W.cyl(p.x,y,p.z,0.12,2.2,0x6a5a8a);L.addObstacle(p.x,y,p.z,0.4,3);
      W.frame(set[idx2],p.x,y+3.6,p.z,yw,2.3,{frame:0xe6c283});
      var q2=c.at(t,side*3.2);W.memory({id:set[idx2],kind:'set',set:'gallery',index:idx2,x:q2.x,y:y,z:q2.z,r:3.0,color:0xe8d8ff,lift:1.6,size:6});
    }
    // شجرة الصور المعلقة
    var tp=c.at(0.5,-11);W.tree(tp.x,y,tp.z,1.7,'round');
    for(var h=0;h<4;h++){
      var ha=h/4*PI*2+0.5,hx=tp.x+Math.cos(ha)*3.6,hz=tp.z+Math.sin(ha)*3.6,hy=y+2.4+(h%2)*1.4,hyaw=face(hx,hz,tp.x+Math.cos(ha)*10,tp.z+Math.sin(ha)*10),idx3=10+h;
      W.frame(set[idx3],hx,hy,hz,hyaw,1.7,{sway:true,double:true,frame:0xfff3dc});
      W.addInst('post',hx,hy+0.9,hz,0.25,2.0,0.25,0,0xcfc8dc);
      W.memory({id:set[idx3],kind:'set',set:'gallery',index:idx3,x:tp.x+Math.cos(ha)*5.4,y:y,z:tp.z+Math.sin(ha)*5.4,r:3.0,color:0xe8d8ff,lift:1.6,size:6});
    }
    pathLanterns(c,6,0.08,0.95,3.1,0xe8d8ff);
    W.scatter(c.d,{trees:8,kinds:['pine','round'],bushes:4,flowers:10,grass:220,rocks:3,keep:[[wc.x,wc.z-2,16],[tp.x,tp.z,7]]});
  }},
  // ---------- 9 شارع النكد والمواقف المضحكة ----------
  {name:'شارع النكد والمواقف المضحكة',theme:8,R:30,dx:-2,ex:2,w1:5,w2:-5,bl:56,bdy:3,bdx:2,bend:-3,build:function(c){
    var y=c.y;
    var em=[['😂',0.12,-8,5.5],['😝',0.28,9,6.2],['🙄',0.46,-9,5.8],['💚',0.62,8,6.4],['😤',0.78,-8,5.6],['🤣',0.92,9,6.0]];
    em.forEach(function(e,i){var p=c.at(e[1],e[2]);W.label(e[0],p.x,y+e[3],p.z,2.1,{glow:'rgba(255,230,120,1)'});W.cyl(p.x,y,p.z,0.1,e[3]-1.3,0x6a4a5a);});
    // نكد: غيمة رمادية فوق مقعد
    var n=c.at(0.3,-6.5);bench(n.x,y,n.z,face(n.x,n.z,c.at(.3,0).x,c.at(.3,0).z));
    var cl=new T.Sprite(new T.SpriteMaterial({map:W.cloudTex,transparent:true,depthWrite:false,color:0x6e6a86,opacity:0.9,fog:false}));cl.position.set(n.x,y+4.6,n.z);cl.scale.set(6.5,3.6,1);W.scene.add(cl);G.Regions.nakdCloud=cl;
    for(var d=0;d<6;d++)W.glow(n.x+(d-2.5)*0.5,y+2+(d%2),n.z+0.2,0xff9fbf,1.2);
    var np=c.at(0.3,-3.6);W.memory({id:'nakd',kind:'mem',key:'nakd',x:np.x,y:y,z:np.z,r:3.3,color:0xffd36a});
    // أرجوحة مقلوبة = الزعل المتعمد: ميزان
    var sc=c.at(0.58,7.5);W.cube(sc.x,y,sc.z,0.5,0.6,0.5,0xe0527f);W.cube(sc.x,y+0.6,sc.z,5.0,0.22,0.9,0xffb36b,0.0);
    W.cube(sc.x-2.3,y+0.6,sc.z,0.8,0.5,0.8,0xe0527f);
    var sp=c.at(0.58,4.2);W.memory({id:'zaal',kind:'mem',key:'zaal',x:sp.x,y:y,z:sp.z,r:3.3,color:0xff9fbf});
    // أرجوحة
    var sw=c.at(0.82,-7.5);W.cube(sw.x-2,y,sw.z,0.25,4.2,0.25,0x3a7be0);W.cube(sw.x+2,y,sw.z,0.25,4.2,0.25,0x3a7be0);W.cube(sw.x,y+4.2,sw.z,4.5,0.25,0.3,0x3a7be0);W.cube(sw.x,y+1.1,sw.z,1.0,0.12,0.5,0xffe45c);
    W.addInst('post',sw.x-0.45,y+1.1,sw.z,0.25,3.1,0.25,0,0xdddddd);W.addInst('post',sw.x+0.45,y+1.1,sw.z,0.25,3.1,0.25,0,0xdddddd);L.addObstacle(sw.x,y,sw.z,2.5,4.5);
    var swp=c.at(0.82,-4.4);W.memory({id:'funny',kind:'mem',key:'funny',x:swp.x,y:y,z:swp.z,r:3.3,color:0x7ae0ff});
    // أكياس مريحة
    [[0.15,7,0xff9ad0],[0.45,-9,0x7ae0ff],[0.7,-8.5,0xffe45c]].forEach(function(b){var p=c.at(b[0],b[1]);W.addInst('ball',p.x,y+0.55,p.z,1.2,0.75,1.2,0,b[2]);L.addObstacle(p.x,y,p.z,1.2,1);});
    pathLanterns(c,6,0.1,0.95,3,0xffd36a);
    W.scatter(c.d,{trees:7,kinds:['round','cherry'],bushes:6,flowers:18,grass:260,rocks:2,fpal:[0xff9ad0,0xffe45c,0x7ae0ff]});
  }},
  // ---------- 10 ركن الأفتارات ----------
  {name:'ركن الأفتارات',theme:9,R:27,dx:2,ex:-2,w1:-5,w2:5,bl:56,bdy:3,bdx:-3,bend:3,build:function(c){
    var y=c.y,p=c.at(0.55,7.5),m=c.at(0.55,0),yaw=face(p.x,p.z,m.x,m.z);
    W.cube(p.x,y,p.z,7.4,0.5,2.4,0xcfc8e8,yaw);
    var fr=W.frame('photos_13',p.x,y+3.6,p.z,yaw,3.2,{frame:0xe6c283,sway:true});
    [-1,1].forEach(function(s){var q=rot(s*4.4,0,yaw);W.cyl(p.x+q[0],y,p.z+q[1],0.35,5.2,s>0?0xff9ad0:0x9ab8ff);W.glow(p.x+q[0],y+5.4,p.z+q[1],s>0?0xff9ad0:0x9ab8ff,8);L.addObstacle(p.x+q[0],y,p.z+q[1],0.5,5);});
    W.label('♡',p.x,y+6.6,p.z,1.6,{color:'#ffd0e6'});
    var q3=rot(0,3.2,yaw);W.memory({id:'avatars',kind:'mem',key:'avatars',x:p.x+q3[0],y:y,z:p.z+q3[1],r:4.2,color:0xffc2e0,lift:1.7});
    var b=c.at(0.2,-6.5);bench(b.x,y,b.z,face(b.x,b.z,c.at(.2,0).x,c.at(.2,0).z));
    pathLanterns(c,6,0.1,0.95,2.9,0xffc2e0);
    W.scatter(c.d,{trees:8,kinds:['cherry','round'],bushes:5,flowers:16,grass:240,rocks:2,keep:[[p.x,p.z,8]],fpal:[0xff9ad0,0x9ab8ff,0xffffff]});
  }},
  // ---------- 11 سينما فارس عاشور ----------
  {name:'سينما فارس عاشور',theme:10,R:30,dx:0,ex:0,w1:6,w2:-6,bl:56,bdy:3,bdx:0,bend:0,build:function(c){
    var y=c.y,sx=c.cx-4,sz=c.cz-11;
    // شاشة
    var cv=document.createElement('canvas');cv.width=1024;cv.height=576;var x=cv.getContext('2d');
    var gr=x.createLinearGradient(0,0,1024,576);gr.addColorStop(0,'#2b1f6b');gr.addColorStop(1,'#7a3a8f');x.fillStyle=gr;x.fillRect(0,0,1024,576);
    x.fillStyle='rgba(255,255,255,0.08)';for(var i=0;i<30;i++){x.beginPath();x.arc(Math.random()*1024,Math.random()*576,Math.random()*3+1,0,6.28);x.fill();}
    x.fillStyle='#fff';x.font='700 84px Amiri, Tajawal, serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='rgba(255,180,220,1)';x.shadowBlur=30;x.fillText('سينما فارس عاشور',512,288);
    var st=new T.CanvasTexture(cv);st.encoding=T.sRGBEncoding;
    var scr=new T.Mesh(new T.PlaneGeometry(10,5.625),new T.MeshBasicMaterial({map:st}));scr.position.set(sx,y+4.6,sz);scr.rotation.y=0;W.scene.add(scr);
    W.cube(sx,y+1.4,sz-0.2,10.6,6.2,0.3,0x1c1738);W.cyl(sx-5,y,sz-0.4,0.18,2,0x3a3358);W.cyl(sx+5,y,sz-0.4,0.18,2,0x3a3358);L.addWall(sx-5.4,y,sz,sx+5.4,sz,5,0.6);
    W.glow(sx,y+4.6,sz+0.5,0xc9a6ff,18);
    // سجادة وكنبة
    W.cyl(sx,y,sz+7,6,0.06,0x6a4a8a);
    W.cube(sx,y,sz+8.6,4.8,0.7,1.7,0xc65a6e);W.cube(sx,y+0.7,sz+9.3,4.8,1.1,0.5,0xc65a6e);W.cube(sx-2.6,y,sz+8.6,0.5,1.2,1.7,0xb04a5e);W.cube(sx+2.6,y,sz+8.6,0.5,1.2,1.7,0xb04a5e);
    W.addInst('ball',sx-1.2,y+1.0,sz+8.6,0.45,0.35,0.35,0,0xffd9a0);W.addInst('ball',sx+1.2,y+1.0,sz+8.6,0.45,0.35,0.35,0,0x9ad6ff);
    L.addObstacle(sx-2.4,y,sz+8.9,0.9,1.4);L.addObstacle(sx+2.4,y,sz+8.9,0.9,1.4);
    var seat={yaw:PI,y:y+0.72,bana:{x:sx-0.6,z:sz+8.5},me:{x:sx+0.6,z:sz+8.5}};
    W.memory({id:'cinema',kind:'sit',key:'cinema',label:'جلوس',seat:seat,x:sx,y:y,z:sz+6.4,r:3.4,color:0xc9a6ff,lift:1.8});
    W.lamp(sx+6.5,y,sz+8,3.4,0xffd49a,-1);W.lamp(sx-6.5,y,sz+8,3.4,0xffd49a,1);
    pathLanterns(c,6,0.08,0.95,3.0,0xc9a6ff);
    W.scatter(c.d,{trees:9,kinds:['pine','round'],bushes:4,flowers:8,grass:220,rocks:3,keep:[[sx,sz+4,12]]});
  }},
  // ---------- 12 محطة التفاهم ----------
  {name:'محطة التفاهم',theme:11,R:30,dx:-2,ex:2,w1:6,w2:-4,bl:56,bdy:3,bdx:3,bend:-3,build:function(c){
    var y=c.y,p1=c.at(0.28,0),p2=c.at(0.72,0),mid=c.at(0.5,0);
    // بركة في الوسط وطريق يتفرع ثم يعود
    var pc=c.at(0.5,-1);W.pond(pc.x,y,pc.z,4.6,{a:0x2f6fb8,b:0x9fd8ff});
    var a1=c.at(0.3,-12),a2=c.at(0.5,-14.5),a3=c.at(0.7,-12);
    var side=[[p1.x,y,p1.z],[a1.x,y,a1.z],[a2.x,y,a2.z],[a3.x,y,a3.z],[p2.x,y,p2.z]];
    for(var i=0;i<side.length-1;i++){L.addSeg(side[i][0],y,side[i][2],side[i+1][0],y,side[i+1][2],4.0);}
    W.walk2=W.walk2;(function(){ // مرئي فقط (بلا مسار رئيسي إضافي)
      var save=L.spinePush;L.spinePush=function(){};W.walk(side,4.0,'path');L.spinePush=save;})();
    var bp=a2;W.cube(bp.x,y,bp.z-1.4,6.4,0.3,2.4,0xcfc8e8);bench(bp.x,y+0.3,bp.z-1.4,face(bp.x,bp.z-1.4,pc.x,pc.z));
    W.label('محطة التفاهم',bp.x,y+4.6,bp.z-1.4,1.3,{});
    W.lantern(bp.x-3.0,y,bp.z-1.4,3.4,0xaee0ff);W.lantern(bp.x+3.0,y,bp.z-1.4,3.4,0xaee0ff);
    W.memory({id:'understand',kind:'mem',key:'understand',x:bp.x,y:y,z:bp.z+0.6,r:4.0,color:0xaee0ff,lift:1.8});
    pathLanterns(c,5,0.1,0.95,3.0,0xaee0ff);
    W.scatter(c.d,{trees:9,kinds:['round','pine'],bushes:5,flowers:12,grass:240,rocks:3,keep:[[pc.x,pc.z,7],[a2.x,a2.z-1,9]],fpal:[0xb8e8ff,0xffffff]});
  }},
  // ---------- 13 ركن اللهجة ----------
  {name:'ركن اللهجة',theme:12,R:28,dx:2,ex:-2,w1:-5,w2:5,bl:50,bdy:3,bdx:-3,bend:3,build:function(c){
    var y=c.y,p=c.at(0.55,7.6),m=c.at(0.55,0),yaw=face(p.x,p.z,m.x,m.z);
    W.cube(p.x,y,p.z,5.0,1.2,1.7,0xf2c4de,yaw,{solid:true});
    [-2.2,2.2].forEach(function(s,i){var q=rot(s,-0.8,yaw);W.cyl(p.x+q[0],y,p.z+q[1],0.13,3.6,0xcfa0c0);});
    var aw=rot(0,0.3,yaw);W.cube(p.x+aw[0],y+3.6,p.z+aw[1],5.6,0.2,2.6,0xff8fb8,yaw);W.cube(p.x+aw[0],y+3.7,p.z+aw[1],5.6,0.15,0.9,0xfff2f8,yaw);
    var words=['بانتييي','يب','حتنىى!','أحبششش'];
    words.forEach(function(w,i){var a=i/4*PI*2,q=rot(Math.cos(a)*3.4,Math.sin(a)*1.0,yaw);W.label(w,p.x+q[0],y+4.6+0.5*(i%2)+Math.sin(a)*0.4,p.z+q[1],1.3,{color:'#fff',glow:'rgba(255,150,210,1)'});});
    var q2=rot(0,2.6,yaw);W.memory({id:'dialect',kind:'mem',key:'dialect',x:p.x+q2[0],y:y,z:p.z+q2[1],r:4.0,color:0xffb0d8,lift:1.8});
    W.stringLights([p.x-5,y+5.0,p.z],[p.x+5,y+5.0,p.z],12,1.0,0xffd9a0,[0xffd9a0,0xff9fbf,0xc7a6ff]);
    var b=c.at(0.2,-6.5);bench(b.x,y,b.z,face(b.x,b.z,c.at(.2,0).x,c.at(.2,0).z));
    pathLanterns(c,6,0.1,0.95,2.9,0xffb0d8);
    W.scatter(c.d,{trees:8,kinds:['cherry','round'],bushes:5,flowers:16,grass:240,rocks:2,keep:[[p.x,p.z,8]],fpal:[0xffb0d8,0xffe08a,0xc8b0ff]});
  }}
  ];

  // ===== طريق السماء والهدوء =====
  function skyRoad(O){
    W.setTheme(13);L.markRegion('طريق السماء والهدوء');
    var y=O.y,x=O.x,z=O.z,steps=7,len=30,rise=5.5,pts=[[x,y,z]];
    var cx=x,cy=y,cz=z;
    for(var i=0;i<steps;i++){
      // جزيرة صغيرة
      var d=W.disc(cx+ (i%2?-1:1)*2,cy,cz-7,8.5-i*0.3,{seed:i*2.1});d.r=8;
      W.tree(cx+(i%2?-1:1)*6,cy,cz-6,0.9,i%2?'cherry':'pine');
      W.flowers(cx-3,cy,cz-7,2.5,10,[0xd0e0ff,0xffffff,0xffe9b0]);
      var a={x:cx,y:cy,z:cz},b={x:cx+(i%2?-3:3)*0.7,y:cy+rise,z:cz-len};
      var pa=[[a.x,a.y,a.z],[a.x+(b.x-a.x)*0.5,a.y+(b.y-a.y)*0.5,a.z-len*0.5],[b.x,b.y,b.z]];
      // مسار يمرّ عبر الجزيرة ثم جسر
      var ia=[[cx,cy,cz],[cx+(i%2?-2:2),cy,cz-7],[cx+(i%2?-2:2),cy,cz-14]];
      W.walk(ia,4.2,'path');
      W.walk([[cx+(i%2?-2:2),cy,cz-14],[b.x,b.y,b.z]],4.0,'bridge');
      // فوانيس نجمية
      for(var k=0;k<3;k++){var lx=cx+(i%2?-1:1)*(3+k*0.4)*(k%2?-1:1),lz=cz-6-k*4;W.lantern(lx,cy,lz,2.8+k*0.4,k%2?0xd0e0ff:0xffe9b0,{noObs:false});}
      W.glow(cx-6,cy+4+i*0.5,cz-10,0xcfe0ff,5);W.glow(cx+6,cy+6+i*0.5,cz-20,0xffe9b0,5);
      SKY.push({i:i,ix:ia[1][0],iy:ia[1][1],iz:ia[1][2],ir:d.r,ex:ia[2][0],ez:ia[2][2],bx:b.x,by:b.y,bz:b.z,sx:ia[0][0],sz:ia[0][2],sy:ia[0][1]});
      cx=b.x;cy=b.y;cz=b.z;
      // أقواس ضوء
      if(i%2===0){var ang=0;for(var s=0;s<=14;s++){var aa=s/14*PI;W.glow(cx+Math.cos(aa)*3.4,cy+0.5+Math.sin(aa)*4,cz+8,0xcfe0ff,2.2);}}
    }
    // نجوم قريبة تتزايد
    var r=G.rng(8);for(var n=0;n<80;n++){var q=L.pointAt(L.total*r());W.glow(q.x+(r()-0.5)*70,q.y+6+r()*34,q.z+(r()-0.5)*50,[0xffffff,0xcfe0ff,0xffe9b0][n%3],1.6+r()*1.4);}
    return {x:cx,y:cy,z:cz};
  }
  // ===== النهاية =====
  function ending(O){
    W.setTheme(14);L.markRegion('النهاية');
    var R=40,cx=O.x,cz=O.z-R*0.78,y=O.y,d=W.disc(cx,y,cz,R,{});d.r=R;
    var tp={x:cx,z:cz-9};
    var pts=[[O.x,y,O.z],[cx+3,y,cz+12],[cx-1,y,cz-1],[cx-3,y,tp.z+8]];
    W.walk(pts,4.8,'path');
    // الشجرة الكبرى
    W.tree(tp.x,y,tp.z,3.4,'cherry',{noObs:true});L.addObstacle(tp.x,y,tp.z,1.6,12);
    W.addInst('round',tp.x,y+13,tp.z,4.6,3.2,4.6,1,0xaed0ff);W.addInst('round',tp.x-4,y+10,tp.z+1,3,2.2,3,2,0xffc4e0);W.addInst('round',tp.x+4,y+10.5,tp.z-1,3,2.2,3,3,0xd8c8ff);
    var r=G.rng(14);for(var i=0;i<26;i++){var a=r()*PI*2,rad=2.5+r()*7,hy=y+5+r()*6;var hx=tp.x+Math.cos(a)*rad,hz=tp.z+Math.sin(a)*rad;
      W.addInst('post',hx,hy,hz,0.12,hy*0+r()*2.4+1.4,0.12,0,0xcfc8e8);W.lantern(hx,hy-0.2,hz,0,[0xffd9a0,0xffc4e0,0xcfe0ff][i%3],{small:true,noObs:true,glow:1.4});}
    W.label('٣٦٥',tp.x,y+19,tp.z,2.2,{color:'#fff3d6',glow:'rgba(255,200,140,1)'});
    // مقعد يطلّ على النجوم
    var bx=cx+8,bz=cz-11;W.cube(bx,y,bz,5.4,0.25,2.2,0xcfc8e8);bench(bx,y+0.25,bz,PI);bench(bx-2.2,y+0.25,bz+0.0,PI);
    W.memory({id:'sit_end',kind:'sit',key:null,label:'جلوس',seat:seatInfo(bx-1.1,y+0.25,bz,PI),x:bx-1.1,y:y,z:bz+2.2,r:3.2,color:0xcfe0ff,lift:1.7});
    // الرسالة
    var pp={x:cx-6,z:cz-9};pedestal(pp.x,y,pp.z,0xffe3a8);W.label('✉',pp.x,y+3.2,pp.z,1.4,{});
    W.memory({id:'finale',kind:'mem',key:'finale',x:pp.x,y:y,z:pp.z,r:4.8,color:0xffe3a8,lift:2.0,size:12});
    W.pond(cx+12,y,cz+6,5,{a:0x1d3f8a,b:0x8fb8ff});
    for(var k=0;k<8;k++){var a2=k/8*PI*2,rp=14;W.lantern(tp.x+Math.cos(a2)*rp,y,tp.z+Math.sin(a2)*rp+4,2.4,0xffd9a0);}
    W.scatter(d,{trees:10,kinds:['pine','cherry'],bushes:6,flowers:60,grass:700,rocks:4,tMin:0.7,keep:[[tp.x,tp.z,13],[bx,bz,6],[pp.x,pp.z,4],[cx+12,cz+6,7]],fpal:[0xd8e4ff,0xffe9b0,0xffffff]});
  }

  G.Regions={ctxs:CTX,sky:SKY,build:function(){
    var O={x:0,y:0,z:0};
    for(var i=0;i<SPECS.length;i++){ O=region(SPECS[i],{x:O.x,y:O.y,z:O.z});O.y=O.y; }
    O=skyRoad(O);
    ending(O);
  }};
})();
