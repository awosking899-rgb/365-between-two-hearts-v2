// الأنشطة التفاعلية (المرحلة الأولى): شارع الألعاب، شارع الزعل والمواقف، محطة التفاهم، طريق السماء.
// اللاعبة (بانا) وحدها تتحكم؛ المرافق (أوس) شخصية NPC تتفاعل تلقائيًا. لا قفز ولا لاعب ثانٍ.
// لا تعدّل هذه الملفات أي تفاعل قديم: كل ما هنا مضاف فوق العالم القائم.
(function(){
  var L=G.Layout,W=G.World3D,T=THREE,S=G.Save,UI=G.UI,PI=Math.PI;
  G.ACT_INFO={
    granny_lights:{t:'جراني تلتفت',d:'عبرتِ الشارع دون أن تراكِ جراني.'},
    bomb_pass:{t:'مرّري القنبلة',d:'مرّرتِ القنبلة ٨ مرات متتالية مع أوس.'},
    coin_race:{t:'سباق العملات',d:'فزتِ على أوس في سباق العملات.'},
    swing_push:{t:'أرجوحة أوس',d:'دفعتِ الأرجوحة حتى أعلى ارتفاع وتلاشت الغيمة.'},
    seesaw_balance:{t:'ميزان التوازن',d:'حافظتِ على توازن الميزان حتى النهاية.'},
    bridge_meet:{t:'جسر التفاهم',d:'التقيتما في منتصف الجسر المضيء.'},
    stars:{t:'نجوم الأمنيات',d:'جمعتِ النجوم الأربع عشرة وأضاء قلب النجوم في السماء.'}
  };
  var X=G.Act={cur:null,comp:null,place:null,defs:{},startPos:null};
  var api=null,timers=[],ended=false;
  X.bind=function(a){api=a;};

  // ---------- أدوات ----------
  function actData(){ if(!S.data.act)S.data.act={}; return S.data.act; }
  function rec(id){ var a=actData(); return a[id]||(a[id]={}); }
  function isDone(id){ var a=S.data.act; return !!(a&&a[id]&&a[id].done); }
  function later(fn,ms){ var t=setTimeout(fn,ms); timers.push(t); return t; }
  function clearLater(){ timers.forEach(clearTimeout); timers=[]; }
  function std(c,o){ o=o||{}; o.color=c; if(o.roughness===undefined)o.roughness=0.65; return new T.MeshStandardMaterial(o); }
  function bas(c,op){ return new T.MeshBasicMaterial({color:c,transparent:op!==undefined&&op<1,opacity:op===undefined?1:op,depthWrite:false}); }
  function add(g,m,x,y,z){ m.position.set(x,y,z); g.add(m); return m; }
  function halo(c,s,op){ var sp=new T.Sprite(new T.SpriteMaterial({map:W.glowTex(),color:c,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,opacity:op===undefined?0.9:op})); sp.scale.set(s,s,1); return sp; }
  function ar(n){ return G.ar(n); }
  function wrap(a){ while(a>PI)a-=2*PI; while(a<-PI)a+=2*PI; return a; }
  function ground(x,z,y){ return L.groundAt(x,z,y,0.4); }
  function isFree(x,z,y,r){
    if(ground(x,z,y)===null) return false;
    for(var i=0;i<L.obstacles.length;i++){ var o=L.obstacles[i]; if(o.noBlock)continue; if(Math.abs(o.y-y)>2.5)continue; var dx=x-o.x,dz=z-o.z,rr=o.r+r; if(dx*dx+dz*dz<rr*rr) return false; }
    return true;
  }
  function findFree(x,z,y,r){
    if(isFree(x,z,y,r)) return {x:x,z:z};
    for(var k=1;k<40;k++){ var rad=k*0.45; for(var a=0;a<8;a++){ var ang=a/8*PI*2+k*0.7,px=x+Math.cos(ang)*rad,pz=z+Math.sin(ang)*rad; if(isFree(px,pz,y,r)) return {x:px,z:pz}; } }
    return {x:x,z:z};
  }
  function emo(who,name,ms){
    var h=who==='p'?api.bana:api.me; h.setEmote(name);
    if(ms) later(function(){ h.setEmote(null); },ms);
  }
  function clearEmotes(){ if(api){ api.me.setEmote(null); api.bana.setEmote(null); api.bana.state.lean=0; } }
  X.say=function(txt,ms){ UI.actSay(txt); if(ms) later(function(){ UI.actSay(''); },ms); };
  function pad(id,x,y,z,color,label){ W.memory({id:id,kind:'act',x:x,y:y,z:z,r:3.0,color:color,lift:1.7,label:label||'العبي',size:7.5}); }

  // ---------- إطار عام ----------
  X.locked=function(){ return !!(X.cur&&X.cur.lock); };
  X.faceYaw=function(){ return (X.cur&&X.cur.face!==undefined)?X.cur.face:null; };
  X.banaSit=function(){ return false; };
  X.safePos=function(){ return X.cur?X.startPos:null; };
  X.btn=function(){ return X.cur&&X.cur.btn?X.cur.btn():null; };
  X.press=function(){ if(X.cur&&!X.cur.ending&&X.cur.press) X.cur.press(); };
  X.start=function(id){
    var d=X.defs[id]; if(!d||X.cur||!api) return;
    if(window.G.Audio&&G.Audio.init) G.Audio.init();
    if(d.instant){ d.start(); return; }
    var P=api.P; X.startPos={x:P.x,y:P.y,z:P.z}; ended=false;
    X.cur=d; d.t=0; d.ending=false; d.lock=false; d.face=undefined; d.begin();
    G.Audio.chime(false);
  };
  function release(restore){
    var d=X.cur; if(!d) return;
    if(d.cleanup) d.cleanup();
    X.cur=null; X.comp=null; X.focus=null; clearLater(); clearEmotes(); UI.actHud(null); UI.actSay('');
    if(X.place){ X.place=null; }
    if(restore&&X.startPos&&api){ api.placeP(X.startPos.x,X.startPos.y,X.startPos.z,api.P.yaw); }
  }
  X.cancel=function(silent){ if(!X.cur) return; release(true); if(!silent) UI.toast('تم إنهاء النشاط'); };
  // فوز: احتفال قصير ثم بطاقة النتيجة
  X.win=function(d,title,html,cheerP){
    if(d.ending) return; d.ending=true; d.lock=true; d.face=undefined;
    var first=!isDone(d.id); var r=rec(d.id); r.done=1; r.n=(r.n||0)+1; S.markSeen(d.id); W.setSeen(d.id); S.save();
    if(d.onWin) d.onWin();
    emo('c','cheer'); if(cheerP!==false) emo('p','cheer');
    G.Audio.chime(true); later(function(){ G.Audio.chime(false); },260); later(function(){ G.Audio.chime(true); },520);
    later(function(){ release(true); UI.openCustom(title,html,'glow'); },2200);
  };
  X.update=function(dt){
    if(!api) return;
    animateStatic(dt);
    if(X.cur){
      var d=X.cur; d.t+=dt; X.focus=d.focus?d.focus():null;
      if(!d.ending) d.update(dt);
      var h=d.hud?d.hud():null; if(X.cur) UI.actHud(h);
    } else stars.passive(dt);
  };
  X.refresh=function(){ applyState(); };
  X.coinsList=function(){ return coinsGame.items; };
  X.starsList=function(){ return stars.items; };
  X.heartVisible=function(){ return stars.heart.length&&stars.heart[0].visible; };
  X.bridgeInfo=function(){ return G12; };
  function animateStatic(dt){
    // نجوم وعملات وغيمة تتلاشى
    var t=G.timeUniform.value;
    stars.items.forEach(function(s){ if(!s.g.visible)return; s.g.rotation.y+=dt*1.6; s.g.position.y=s.y+Math.sin(t*2+s.ph)*0.18; });
    coinsGame.items.forEach(function(c){ if(!c.g.visible)return; c.g.rotation.y+=dt*3; c.g.position.y=c.y+Math.sin(t*3+c.ph)*0.12; });
    if(fadeCloud){ var cl=G.Regions.nakdCloud; if(cl){ fadeCloud-=dt; cl.material.opacity=Math.max(0,0.9*fadeCloud/2.6); if(fadeCloud<=0){cl.visible=false;fadeCloud=0;} } }
  }
  var fadeCloud=0;

  // =====================================================================
  // 1) شارع الألعاب
  // =====================================================================
  var G6={};
  function mkGranny(){
    var g=new T.Group(),m;
    add(g,new T.Mesh(new T.ConeGeometry(0.58,1.5,14),std(0x8a4a8f)),0,0.75,0);
    add(g,new T.Mesh(new T.SphereGeometry(0.3,14,10),std(0xf1cfb2)),0,1.78,0);
    m=add(g,new T.Mesh(new T.SphereGeometry(0.31,12,8),std(0xf0f0f4)),0,1.95,-0.08); m.scale.set(1,0.8,1);
    add(g,new T.Mesh(new T.SphereGeometry(0.14,10,8),std(0xf0f0f4)),0,2.2,-0.12);
    [-1,1].forEach(function(s){ add(g,new T.Mesh(new T.SphereGeometry(0.045,8,6),std(0x222230)),s*0.1,1.82,0.27); add(g,new T.Mesh(new T.TorusGeometry(0.075,0.014,6,12),std(0x6a5a3a)),s*0.1,1.82,0.28); });
    add(g,new T.Mesh(new T.TorusGeometry(0.3,0.07,8,14),std(0xd9425f)),0,1.4,0).rotation.x=PI/2;
    [-1,1].forEach(function(s){ var a=add(g,new T.Mesh(new T.BoxGeometry(0.13,0.7,0.13),std(0x8a4a8f)),s*0.5,1.1,0.1); a.rotation.z=s*0.25; });
    return g;
  }
  X.defs.granny={id:'granny_lights',
    begin:function(){
      var c=G6.ctx,a=G6.a,b=G6.b; this.g=G6.granny; this.g.visible=true; this.fwd=Math.atan2(c.at(0.2,0).hx,c.at(0.2,0).hz);
      this.mode='green'; this.mt=1.8+Math.random()*1.5; this.tries=0; this.cy=this.fwd; this.half=false; this.grace=0;
      X.comp={x:G6.aws.x,z:G6.aws.z,yaw:this.fwd+PI,speed:3.2};
      this.total=Math.hypot(b.x-a.x,b.z-a.z); this.g.position.set(G6.gp.x,G6.y,G6.gp.z);
      X.say('جراني تُغنّي… تقدّمي عندما تدير ظهرها، وقفي عندما تلتفت',4200);
    },
    update:function(dt){
      var P=api.P,I=api.I,self=this,ax=I.axes(),mv=Math.hypot(ax[0],ax[1]);
      this.mt-=dt; this.grace-=dt;
      if(this.mode==='green'&&this.mt<=0){ this.mode='warn'; this.mt=0.55; G.Audio.chime(false); }
      else if(this.mode==='warn'&&this.mt<=0){ this.mode='red'; this.mt=1.2+Math.random()*1.0; this.redT=0; }
      else if(this.mode==='red'){ this.redT+=dt; if(this.mt<=0){ this.mode='green'; this.mt=1.8+Math.random()*1.8; } }
      var target=this.mode==='red'?this.fwd+PI:(this.mode==='warn'?this.fwd+PI*0.5:this.fwd);
      this.cy=G.dampAngle(this.cy,target,this.mode==='warn'?14:10,dt); this.g.rotation.y=this.cy;
      G6.alert.visible=this.mode!=='green'; G6.alert.material.color.set(this.mode==='red'?0xff4f6d:0xffd36a);
      // القبض
      if(this.mode==='red'&&this.redT>0.32&&mv>0.22&&this.grace<=0){
        this.tries++; this.grace=1.6; api.placeP(G6.a.x,G6.a.y,G6.a.z,this.fwd); api.P.speed=0;
        X.say('جراني رأتك! عودي إلى البداية',1800); emo('c','laugh',1400); G.Audio.chime(false);
        this.mode='green'; this.mt=2.2;
      }
      // التقدم
      var prog=G.clamp(((P.x-G6.a.x)*(G6.b.x-G6.a.x)+(P.z-G6.a.z)*(G6.b.z-G6.a.z))/(this.total*this.total),0,1); this.prog=prog;
      if(prog>0.5&&!this.half){ this.half=true; emo('c','wave',1600); }
      if(Math.hypot(P.x-G6.b.x,P.z-G6.b.z)<2.0&&prog>0.7){
        var tr=this.tries;
        X.win(this,'جراني تلتفت','<h3>عبرتِ دون أن تراكِ جراني</h3><div>'+(tr?('بعد '+(tr===1?'محاولة واحدة':(tr===2?'محاولتين':ar(tr)+' محاولات'))+' وصلتِ إلى الخط.'):'من المحاولة الأولى!')+'</div><div class="sub">أوس صفّق لكِ عند الخط.</div>');
        emo('c','clap'); emo('p','cheer');
      }
    },
    hud:function(){ var m=this.mode; return {title:'جراني تلتفت',info:m==='red'?'قفي! جراني تنظر إليكِ':(m==='warn'?'تمهّلي…':'الضوء أخضر — تقدّمي نحو الخط'),bar:this.prog||0,danger:m==='red'}; },
    btn:function(){ return null; },
    cleanup:function(){ this.g.visible=false; G6.alert.visible=false; }
  };

  // --- مرّري القنبلة ---
  var bombObj=null;
  X.defs.bomb={id:'bomb_pass',
    begin:function(){
      var P=api.P,h=G6.bh; this.dir={x:h.hx,z:h.hz}; this.yawF=Math.atan2(h.hx,h.hz);
      api.placeP(G6.bp.x,G6.bp.y,G6.bp.z,this.yawF); this.lock=true; this.face=this.yawF;
      this.ax=G6.bp.x+h.hx*5.2; this.az=G6.bp.z+h.hz*5.2;
      X.comp={x:this.ax,z:this.az,yaw:this.yawF+PI,speed:3.4};
      this.state='setup'; this.streak=0; this.best=0; this.fl=0; this.setupT=0; this.bombT=0;
      bombObj.g.visible=true; this.bombPos(); this.pops=[];
    },
    hold:function(who){ var o=who==='p'?api.P:api.C,dx=who==='p'?this.dir.x:-this.dir.x,dz=who==='p'?this.dir.z:-this.dir.z; return {x:o.x+dx*0.5,y:o.y+1.15,z:o.z+dz*0.5}; },
    bombPos:function(){ var p=this.state==='atBana'?this.hold('p'):this.hold('a'); bombObj.g.position.set(p.x,p.y,p.z); },
    win:function(){ return Math.max(0.75,1.75-this.streak*0.11); },
    update:function(dt){
      var s=this.state,P=api.P;
      var spk=0.5+0.25*Math.sin(this.t*30); bombObj.spark.scale.set(spk,spk,1);
      this.pops=this.pops.filter(function(p){ p.t+=dt; var k=p.t/0.9; p.s.position.set(p.x+p.vx*p.t,p.y+p.vy*p.t-3*p.t*p.t,p.z+p.vz*p.t); p.s.material.opacity=Math.max(0,1-k); if(k>=1){ W.scene.remove(p.s); return false; } return true; });
      if(s==='setup'){ this.setupT+=dt; if((X.comp.arrived&&this.setupT>0.8)||this.setupT>6){ this.state='atAws'; this.tm=1.0; emo('c','catch'); X.say('أوس يحمل القنبلة — استعدّي لاستلامها ثم مرّريها بسرعة!',3200); } this.bombPos(); }
      else if(s==='atAws'){ this.tm-=dt; this.bombPos(); if(this.tm<=0){ this.state='toBana'; this.ft=0; emo('c','push',350); } }
      else if(s==='toBana'||s==='toAws'){
        this.ft+=dt; var k=Math.min(1,this.ft/0.6),a=s==='toBana'?this.hold('a'):this.hold('p'),b=s==='toBana'?this.hold('p'):this.hold('a');
        bombObj.g.position.set(G.lerp(a.x,b.x,k),G.lerp(a.y,b.y,k)+Math.sin(k*PI)*1.1,G.lerp(a.z,b.z,k));
        if(k>=1){
          if(s==='toBana'){ this.state='atBana'; this.rem=this.win(); this.wmax=this.rem; emo('p','catch'); G.Audio.chime(true); }
          else { this.state='atAws'; this.tm=0.45+Math.random()*0.6; emo('c','catch'); emo('p',null);
            if(this.streak>=8){ var st=this.best; X.win(this,'مرّري القنبلة','<h3>٨ تمريرات متتالية!</h3><div>القنبلة لم تنفجر، وأوس يضحك ويصفّق.</div>'); emo('c','cheer'); bombObj.g.visible=false; } }
        }
      }
      else if(s==='atBana'){
        this.rem-=dt; this.bombPos(); var bs=1+0.12*(1-this.rem/this.wmax); bombObj.g.scale.set(bs,bs,bs);
        if(this.rem<=0){
          // انفجار مرح (فقاعات ألوان) وإعادة العدّاد
          this.pop(P.x,P.y+1.4,P.z); bombObj.g.visible=false; bombObj.g.scale.set(1,1,1);
          this.state='boom'; this.tm=1.6; this.streak=0; emo('c','laugh',1500); emo('p','sad',900); G.Audio.chime(false); X.say('بوووم! لا بأس — ابدئي من جديد',1500);
        }
      }
      else if(s==='boom'){ this.tm-=dt; if(this.tm<=0){ bombObj.g.visible=true; this.state='atAws'; this.tm=1.0; emo('c','catch'); } }
    },
    pop:function(x,y,z){ for(var i=0;i<14;i++){ var sp=halo([0xff9fbf,0xffd36a,0x9ad6ff,0xc7a6ff][i%4],0.7,1); sp.position.set(x,y,z); W.scene.add(sp); var a=i/14*PI*2; this.pops.push({s:sp,x:x,y:y,z:z,vx:Math.cos(a)*2.2,vy:2+Math.random()*1.5,vz:Math.sin(a)*2.2,t:0}); } },
    press:function(){
      if(this.state==='atBana'){ this.state='toAws'; this.ft=0; this.streak++; this.best=Math.max(this.best,this.streak); emo('p','push',320); G.Audio.click(); bombObj.g.scale.set(1,1,1); }
    },
    focus:function(){ var P=api.P,C=api.C; return {x:(P.x+C.x)/2,z:(P.z+C.z)/2,y:P.y+1.6,dist:9.8,elev:0.34}; },
    btn:function(){ return this.state==='atBana'?'مرّري!':(this.state==='setup'?null:'استعدّي'); },
    hud:function(){ var s=this.state; return {title:'مرّري القنبلة',info:'التمريرات المتتالية: '+ar(this.streak)+' / '+ar(8),bar:s==='atBana'?this.rem/this.wmax:0,danger:s==='atBana'&&this.rem<0.4}; },
    cleanup:function(){ bombObj.g.visible=false; bombObj.g.scale.set(1,1,1); (this.pops||[]).forEach(function(p){W.scene.remove(p.s);}); this.pops=[]; }
  };

  // --- سباق العملات ---
  var coinsGame={items:[]};
  X.defs.coins={id:'coin_race',
    begin:function(){
      this.lock=true; this.cd=3.2; this.time=45; this.nb=0; this.nc=0; this.live=false; this.cdShown=3;
      coinsGame.items.forEach(function(c){ c.got=false; c.g.visible=true; });
      api.placeP(G6.cp.x,G6.cp.y,G6.cp.z,api.P.yaw); X.comp={x:G6.cp.x+2.0,z:G6.cp.z+0.5,speed:3.4};
      X.say('سباق مع أوس: اجمعي أكبر عدد من العملات خلال ٤٥ ثانية',3000);
    },
    update:function(dt){
      var P=api.P,C=api.C,list=coinsGame.items;
      if(!this.live){ this.cd-=dt; var sh=Math.ceil(this.cd); if(sh!==this.cdShown&&sh>0){ this.cdShown=sh; X.say(ar(sh),700); G.Audio.chime(sh===1); }
        if(this.cd<=0){ this.live=true; this.lock=false; X.say('انطلقي!',900); } return; }
      this.time-=dt;
      var best=null,bd=1e9;
      list.forEach(function(c){ if(c.got)return; var d=Math.hypot(c.x-C.x,c.z-C.z); if(d<bd){bd=d;best=c;} });
      if(best) X.comp={x:best.x,z:best.z,speed:3.5};
      var self=this,left=0;
      list.forEach(function(c){
        if(c.got)return;
        if(Math.hypot(c.x-P.x,c.z-P.z)<1.25){ c.got=true; c.g.visible=false; self.nb++; G.Audio.chime(true); if(self.nb%5===0) emo('c','clap',1200); }
        else if(Math.hypot(c.x-C.x,c.z-C.z)<1.0){ c.got=true; c.g.visible=false; self.nc++; }
        else left++;
      });
      if(left===0||this.time<=0){
        var nb=this.nb,nc=this.nc;
        if(nb>nc) X.win(this,'سباق العملات','<h3>فزتِ على أوس!</h3><div>جمعتِ '+ar(nb)+' عملة مقابل '+ar(nc)+' عملة لأوس.</div>');
        else { this.ending=true; this.lock=true; emo('c','cheer',2000); X.say('فاز أوس هذه المرة ('+ar(nc)+' مقابل '+ar(nb)+') — جرّبي مرة أخرى!',2400); later(function(){ release(true); },2500); }
      }
    },
    hud:function(){ return {title:'سباق العملات',info:this.live?('أنتِ '+ar(this.nb)+'  ·  أوس '+ar(this.nc)+'  ·  '+ar(Math.max(0,Math.ceil(this.time)))+' ث'):'استعدّي…',bar:this.live?this.time/45:1}; },
    btn:function(){ return null; },
    cleanup:function(){ coinsGame.items.forEach(function(c){ c.g.visible=false; }); }
  };

  // =====================================================================
  // 2) شارع الزعل والمواقف
  // =====================================================================
  var G9={};
  X.defs.swing={id:'swing_push',
    begin:function(){
      var s=G9.sw; this.lock=true; this.A=0.28; this.ph=0; this.good=0; this.lastCycle=-1; this.cool=0; this.flash=0;
      var by=Math.atan2(-1.1,-2.3);
      api.placeP(s.px+1.1,s.y,s.z+2.3,by); this.face=by; api.camYaw(by); X.place={x:s.px,y:s.y+1.2,z:s.z,yaw:0,sit:true,gy:s.y}; G9.seat.visible=true;
      X.say('اضغطي «ادفعي» لحظة يمرّ المقعد من أسفل نقطة وهو يتقدّم',4200); emo('c','hold');
    },
    update:function(dt){
      var s=G9.sw; this.ph+=2.2*dt; this.cool-=dt; this.flash-=dt;
      var th=this.A*0.95*Math.sin(this.ph); this.th=th;
      G9.rope.rotation.x=th;
      var sx=s.px,sy=s.y+4.2-3.1*Math.cos(th),sz=s.z-3.1*Math.sin(th);
      X.place.x=sx; X.place.y=sy+0.1; X.place.z=sz;
      if(this.A<0.995) this.A=Math.max(0.2,this.A-0.012*dt);
      var d=Math.abs(wrap(this.ph-PI));
      this.inWin=d<0.55; G9.ring.material.color.set(this.inWin?0x8fffb0:0xffd36a);
      if(this.A>=1) X.win(this,'أرجوحة أوس','<h3>أعلى ما يمكن!</h3><div>دفعتِ الأرجوحة بتوقيت جيد '+ar(this.good)+' مرات حتى طارت عاليًا، وتلاشت الغيمة الرمادية فوق المقعد المجاور.</div>');
    },
    onWin:function(){ fadeCloud=2.6; },
    press:function(){
      if(this.cool>0) return; this.cool=0.45; emo('p','push',380);
      var cyc=Math.floor(this.ph/(2*PI));
      if(this.inWin&&cyc!==this.lastCycle){ this.lastCycle=cyc; this.A=Math.min(1,this.A+0.125); this.good++; G.Audio.chime(true); emo('c','laugh',700); }
      else { this.A=Math.max(0.2,this.A-0.05); emo('c','wobble',600); G.Audio.click(); }
    },
    focus:function(){ var P=api.P,pl=X.place; return {x:(P.x+pl.x)/2,z:(P.z+pl.z)/2,y:P.y+1.9,dist:7.2,elev:0.38}; },
    btn:function(){ return 'ادفعي'; },
    hud:function(){ return {title:'أرجوحة أوس',info:this.inWin?'الآن!':'انتظري مرور المقعد من الأسفل',bar:this.A,danger:false}; },
    cleanup:function(){ G9.seat.visible=false; }
  };

  X.defs.seesaw={id:'seesaw_balance',
    begin:function(){
      var s=G9.ss; this.lock=true; this.b=0; this.v=0; this.prog=0; this.falls=0; this.fallT=0;
      api.placeP(s.x,s.y,s.z+3.4,PI); this.face=PI; api.camYaw(PI); G9.plank.visible=true;
      X.place={x:s.x+2.1,y:s.y+0.9+0.2,z:s.z,yaw:0,sit:true,gy:s.y};
      X.say('أوس يتأرجح — أبقي المؤشر في المنطقة الخضراء بالعصا/الأسهم يمينًا ويسارًا',4600); emo('c','hold');
    },
    update:function(dt){
      var s=G9.ss,u=G.clamp(api.I.axes()[0],-1,1),t=this.t,D=0.5+0.55*this.prog;
      if(this.fallT>0){ this.fallT-=dt; this.b*=0.9; }
      else {
        var dist=D*(Math.sin(1.7*t)*0.6+Math.sin(2.9*t+1.3)*0.4);
        this.b+=(0.35*this.b+dist+2.3*u)*dt; this.b=G.clamp(this.b,-1.2,1.2);
        if(Math.abs(this.b)>1.0){ this.falls++; this.prog=Math.max(0,this.prog-0.22); this.fallT=1.1; emo('c','laugh',1100); G.Audio.chime(false); X.say('أوس يهتزّ! لا بأس',1100); }
      }
      var safe=Math.abs(this.b)<0.5;
      this.prog=G.clamp(this.prog+(safe?dt/20:-dt/45),0,1);
      var th=-this.b*0.3; G9.plank.rotation.z=th;
      X.place.x=s.x+2.1*Math.cos(th)-0.2*Math.sin(th); X.place.y=s.y+0.9+2.1*Math.sin(th)+0.2*Math.cos(th)+0.02;
      var wob=Math.abs(this.b)>0.55; if(this.fallT<=0) api.me.setEmote(wob?'wobble':'hold');
      api.bana.setEmote('balance'); api.bana.state.lean=this.b;
      if(this.prog>=1) X.win(this,'ميزان التوازن','<h3>حافظتِ على التوازن!</h3><div>ثبّتِّ أوس على الميزان حتى النهاية'+(this.falls?(' رغم '+ar(this.falls)+' اهتزازات'):' دون أي سقوط')+'.</div>');
    },
    focus:function(){ var P=api.P,s=G9.ss; return {x:(P.x+s.x+0.8)/2,z:(P.z+s.z)/2,y:P.y+1.7,dist:8.6,elev:0.4}; },
    btn:function(){ return null; },
    hud:function(){ return {title:'ميزان التوازن',info:Math.abs(this.b)<0.5?'ممتاز — حافظي على الوسط':'أعيدي المؤشر نحو الوسط',bar:this.prog,tilt:this.b,danger:Math.abs(this.b)>=0.5}; },
    cleanup:function(){ G9.plank.visible=false; G9.plank.rotation.z=0; }
  };

  // =====================================================================
  // 3) محطة التفاهم
  // =====================================================================
  var G12={};
  X.defs.bridge={id:'bridge_meet',
    begin:function(){
      var g=G12; this.phase=1; this.route=[{x:g.r1.x,z:g.r1.z},{x:g.B.x,z:g.B.z}]; this.ri=0; this.sk=0; this.stT=0; this.meet=0;
      api.placeP(g.A.x,g.y,g.A.z,Math.atan2(g.c.x-g.A.x,g.c.z-g.A.z));
      g.stones.forEach(function(s){ s.m.visible=false; s.hl.visible=false; s.k=0; }); g.core.visible=false;
      X.comp={x:g.r1.x,z:g.r1.z,speed:2.7}; this.arr=false;
      X.say('ابقي واقفة في الدائرة المضيئة بينما يذهب أوس إلى نقطته على الجهة الأخرى',4600);
    },
    update:function(dt){
      var g=G12,P=api.P,C=api.C;
      if(this.phase===1){
        var inZone=Math.hypot(P.x-g.A.x,P.z-g.A.z)<2.4; this.zone=inZone;
        if(!inZone){ X.comp={x:C.x,z:C.z,speed:0.1}; return; }
        var wp=this.route[this.ri]; X.comp={x:wp.x,z:wp.z,speed:2.7};
        if(Math.hypot(C.x-wp.x,C.z-wp.z)<0.5){ this.ri++; if(this.ri>=this.route.length){ this.phase=2; this.stT=0; if(g.pondOb)g.pondOb.noBlock=true; G.Audio.chime(true); emo('c','wave',1500); X.say('ظهر الطريق المضيء — اعبري الحجارة نحو المنتصف',4000); X.comp={x:g.B.x,z:g.B.z,yaw:Math.atan2(g.c.x-g.B.x,g.c.z-g.B.z),speed:2.0}; g.core.visible=true; } }
      }
      else if(this.phase===2){
        this.stT+=dt; var n=g.stones.length;
        g.stones.forEach(function(s,i){ var k=G.clamp((this.stT-i*0.18)/0.4,0,1); s.k=k; s.m.visible=k>0; s.hl.visible=k>0; s.m.scale.set(k,k,k); }.bind(this));
        var dP=Math.hypot(P.x-g.c.x,P.z-g.c.z),dA=Math.hypot(g.A.x-g.c.x,g.A.z-g.c.z);
        this.prog=G.clamp(1-dP/dA,0,1);
        if(this.stT>n*0.18+0.6&&dP<dA*0.8){ X.comp={x:g.mB.x,z:g.mB.z,speed:1.6}; }
        var dC=Math.hypot(C.x-g.mB.x,C.z-g.mB.z);
        if(dP<1.7&&dC<0.8){ this.phase=3; this.lock=true; this.face=Math.atan2(C.x-P.x,C.z-P.z); X.comp={x:g.mB.x,z:g.mB.z,yaw:Math.atan2(P.x-C.x,P.z-C.z),speed:1};
          X.win(this,'جسر التفاهم','<h3>التقيتما في المنتصف</h3><div>وقفتِ في مكانك حتى وصل أوس إلى نقطته، ثم عبرتما معًا الحجارة المضيئة والتقيتما فوق الماء.</div><div class="sub">الجسر يبقى مضيئًا في المحطة.</div>'); }
      }
    },
    onWin:function(){ stonesLit(true); },
    focus:function(){ if(this.phase<2)return null; var P=api.P,C=api.C,dd=Math.hypot(P.x-C.x,P.z-C.z); return {x:(P.x+C.x)/2,z:(P.z+C.z)/2,y:P.y+1.5,dist:Math.max(7.5,dd*0.8+5),elev:0.45}; },
    btn:function(){ return null; },
    hud:function(){ return {title:'جسر التفاهم',info:this.phase===1?(this.zone?'أوس يتّجه إلى نقطته…':'عودي إلى الدائرة المضيئة'):(this.phase===2?'اعبري الحجارة نحو المنتصف':'التقيتما!'),bar:this.phase===1?0:this.prog,danger:this.phase===1&&!this.zone}; },
    cleanup:function(){ if(G12.pondOb)G12.pondOb.noBlock=isDone('bridge_meet'); if(!isDone('bridge_meet')){ G12.stones.forEach(function(s){ s.m.visible=false; s.hl.visible=false; }); G12.core.visible=false; } else stonesLit(true); }
  };
  function stonesLit(on){ if(!G12.stones)return; if(G12.pondOb)G12.pondOb.noBlock=!!on; G12.stones.forEach(function(s){ s.m.visible=on; s.hl.visible=on; s.m.scale.set(1,1,1); }); G12.core.visible=on; }

  // =====================================================================
  // 4) طريق السماء: نجوم الأمنيات
  // =====================================================================
  var stars={items:[],heart:[],pad:null};
  var NSTAR=14;
  function starsData(){ var r=rec('stars'); if(!r.got)r.got=[]; return r; }
  X.defs.stars={id:'stars',instant:true,
    start:function(){
      var r=starsData();
      if(r.done){ UI.openCustom('نجوم الأمنيات','<h3>اكتملت السماء</h3><div>جمعتِ النجوم الأربع عشرة، وقلب النجوم يضيء فوق آخر جزيرة.</div>','glow'); return; }
      if(!r.on){ r.on=1; S.save(); applyState(); G.Audio.chime(true); UI.openCustom('نجوم الأمنيات','<h3>١٤ نجمة على الجزر السبع</h3><div>على كل جزيرة نجمة قريبة من الطريق، وأخرى على الجسر الذي بعدها. اقتربي من النجمة لتلتقطيها.</div><div class="sub">النجوم المخفية تلمع بين الأشجار والأزهار.</div>','glow'); }
      else UI.openCustom('نجوم الأمنيات','<h3>'+ar(r.got.length)+' / '+ar(NSTAR)+'</h3><div>تابعي البحث على الجزر والجسور.</div>','glow');
    }
  };
  stars.passive=function(dt){
    var r0=S.data.act&&S.data.act.stars; if(!r0||!r0.on||r0.done){ UI.actHud(null); return; }
    var r=starsData(); var P=api.P,self=this;
    stars.items.forEach(function(s,i){
      if(r.got.indexOf(i)>=0) return;
      if(Math.hypot(P.x-s.x,P.z-s.z)<1.5&&Math.abs(P.y+1-s.y)<3.2){
        r.got.push(i); s.g.visible=false; S.save(); G.Audio.chime(true);
        var n=r.got.length; UI.actSay('★ '+ar(n)+' / '+ar(NSTAR)); setTimeout(function(){ UI.actSay(''); },1400);
        if(n%4===0) emo('c','wave',1400); else if(n%3===0) emo('c','clap',1200);
        if(n>=NSTAR){ r.done=1; S.markSeen('stars'); W.setSeen('stars'); S.save(); applyState(); emo('c','cheer',2600); emo('p','cheer',2600);
          setTimeout(function(){ UI.openCustom('نجوم الأمنيات','<h3>اكتملت السماء</h3><div>جمعتِ ١٤ نجمة من الجزر السبع، فاجتمعت في السماء على شكل قلب فوق آخر جزيرة.</div>','glow'); },2400); }
      }
    });
    // عدّاد أثناء وجودك في المنطقة
    if(api.region()===13&&!r.done) UI.actHud({title:'نجوم الأمنيات',info:'★ '+ar(r.got.length)+' / '+ar(NSTAR),bar:r.got.length/NSTAR,noExit:true});
    else UI.actHud(null);
  };

  // ---------- تطبيق الحالة المحفوظة على المشهد ----------
  function applyState(){
    var d=S.data.act||{};
    var cl=G.Regions.nakdCloud; if(cl){ var done=d.swing_push&&d.swing_push.done; cl.visible=!done; cl.material.opacity=0.9; fadeCloud=0; }
    if(G12.stones) stonesLit(!!(d.bridge_meet&&d.bridge_meet.done));
    var r=d.stars||{}; var on=!!r.on;
    stars.items.forEach(function(s,i){ s.g.visible=on&&!r.done&&(r.got||[]).indexOf(i)<0; });
    stars.heart.forEach(function(h){ h.visible=!!r.done; });
    if(coinsGame.items) coinsGame.items.forEach(function(c){ c.g.visible=false; });
    if(G6.granny) G6.granny.visible=false; if(G6.alert) G6.alert.visible=false;
    if(bombObj) bombObj.g.visible=false; if(G9.seat) G9.seat.visible=false; if(G9.plank) G9.plank.visible=false;
  }

  // =====================================================================
  // البناء (بعد بناء المناطق وقبل تفريغ المجسمات)
  // =====================================================================
  Object.keys(X.defs).forEach(function(k){ X.defs[X.defs[k].id]=X.defs[k]; });
  X.build=function(){
    var R=G.Regions,cx;
    // ---- شارع الألعاب (المنطقة ٦ — فهرس ٥) ----
    cx=R.ctxs[5]; var y=cx.y;
    var pa=cx.at(0.10,0),pb=cx.at(0.40,0),pg=cx.at(0.45,0),ph=cx.at(0.52,0),pc=cx.at(0.94,0);
    G6.ctx=cx;G6.y=y;G6.a={x:pa.x,y:y,z:pa.z};G6.b={x:pb.x,y:y,z:pb.z};G6.gp={x:pg.x,z:pg.z};
    G6.aws={x:cx.at(0.40,3.2).x,z:cx.at(0.40,3.2).z};
    G6.granny=mkGranny(); G6.granny.visible=false; W.scene.add(G6.granny);
    G6.alert=halo(0xffd36a,2.4,0.95); G6.alert.position.set(pg.x,y+2.9,pg.z); G6.alert.visible=false; W.scene.add(G6.alert);
    // خط النهاية
    var flg=new T.Group(); flg.rotation.y=Math.atan2(pb.hx,pb.hz); flg.position.set(pb.x,y+0.2,pb.z); var fl=new T.Mesh(new T.PlaneGeometry(5,0.5),bas(0xffffff,0.8)); fl.rotation.x=-PI/2; flg.add(fl); W.scene.add(flg);
    pad('granny_lights',pa.x,y,pa.z,0xff9fbf,'العبي');
    G6.bp={x:ph.x,y:y,z:ph.z}; G6.bh=ph; pad('bomb_pass',ph.x,y,ph.z,0xffd36a,'العبي');
    bombObj={g:new T.Group()}; add(bombObj.g,new T.Mesh(new T.SphereGeometry(0.3,14,10),std(0x15151c,{roughness:0.4})),0,0,0);
    add(bombObj.g,new T.Mesh(new T.CylinderGeometry(0.04,0.05,0.18,6),std(0x8a6a4a)),0,0.34,0); bombObj.spark=add(bombObj.g,halo(0xffb36b,0.5,1),0,0.5,0);
    bombObj.g.visible=false; W.scene.add(bombObj.g);
    var cpp=findFree(pc.x,pc.z,y,1.2); G6.cp={x:cpp.x,y:y,z:cpp.z}; pad('coin_race',cpp.x,y,cpp.z,0xffe97a,'العبي');
    var rg=G.rng(61),n=0,tries=0;
    while(coinsGame.items.length<14&&tries++<400){
      var t=0.06+rg()*0.9,lat=(rg()<0.5?-1:1)*(1.8+rg()*8.5),p=cx.at(t,lat);
      if(!isFree(p.x,p.z,y,1.3)) continue;
      var ok=true; for(var k=0;k<coinsGame.items.length;k++){ if(Math.hypot(coinsGame.items[k].x-p.x,coinsGame.items[k].z-p.z)<3.2){ok=false;break;} }
      if(Math.hypot(p.x-cpp.x,p.z-cpp.z)<4||Math.hypot(p.x-pa.x,p.z-pa.z)<3||Math.hypot(p.x-ph.x,p.z-ph.z)<3) ok=false;
      if(!ok) continue;
      var g=new T.Group(),cm=add(g,new T.Mesh(new T.CylinderGeometry(0.42,0.42,0.1,18),new T.MeshStandardMaterial({color:0xffd24a,emissive:0x6a4a00,roughness:0.35})),0,0,0); cm.rotation.x=PI/2;
      add(g,halo(0xffd36a,2.0,0.55),0,0,0); g.position.set(p.x,y+1.1,p.z); g.visible=false; W.scene.add(g);
      coinsGame.items.push({g:g,x:p.x,z:p.z,y:y+1.1,ph:rg()*6,got:false});
    }

    // ---- شارع الزعل والمواقف (المنطقة ٩ — فهرس ٨) ----
    cx=R.ctxs[8]; y=cx.y;
    var sw=cx.at(0.82,-7.5),px=sw.x+1.35,sz=sw.z;
    G9.sw={px:px,z:sz,y:y};
    G9.rope=new T.Group(); G9.rope.position.set(px,y+4.2,sz);
    [-0.32,0.32].forEach(function(o){ add(G9.rope,new T.Mesh(new T.BoxGeometry(0.05,3.1,0.05),std(0xdddddd)),o,-1.55,0); });
    add(G9.rope,new T.Mesh(new T.BoxGeometry(0.85,0.1,0.5),std(0xff9ad0)),0,-3.1,0);
    G9.seat=G9.rope; G9.seat.visible=false; W.scene.add(G9.rope);
    G9.ring=new T.Mesh(new T.RingGeometry(0.55,0.75,24),bas(0xffd36a,0.7)); G9.ring.rotation.x=-PI/2; G9.ring.position.set(px,y+0.16,sz); G9.ring.visible=true; W.scene.add(G9.ring);
    G9.ring.visible=false;
    pad('swing_push',px+1.1,y,sz+2.3,0xff9ad0,'العبي');
    var sp=cx.at(0.40,8),ss={x:sp.x,y:y,z:sp.z}; G9.ss=ss;
    var base=new T.Mesh(new T.ConeGeometry(0.7,0.9,4),std(0xe0527f)); base.position.set(ss.x,y+0.45,ss.z); W.scene.add(base);
    G9.plank=new T.Group(); G9.plank.position.set(ss.x,y+0.9,ss.z);
    add(G9.plank,new T.Mesh(new T.BoxGeometry(5.2,0.18,0.8),std(0xffb36b)),0,0,0);
    [-1,1].forEach(function(s){ add(G9.plank,new T.Mesh(new T.BoxGeometry(0.1,0.35,0.7),std(0xe0527f)),s*2.55,0.15,0); });
    G9.plank.visible=false; W.scene.add(G9.plank);
    L.addObstacle(ss.x,y,ss.z,0.8,1);
    pad('seesaw_balance',ss.x,y,ss.z+3.4,0xffb36b,'العبي');
        // حلقة توقيت الأرجوحة تظهر أثناء النشاط فقط
    var oldBegin=X.defs.swing.begin,oldClean=X.defs.swing.cleanup;
    X.defs.swing.begin=function(){ oldBegin.call(this); G9.ring.visible=true; }; X.defs.swing.cleanup=function(){ oldClean.call(this); G9.ring.visible=false; };
    G9.ring.position.set(px,y+0.16,sz);

    // ---- محطة التفاهم (المنطقة ١٢ — فهرس ١١) ----
    cx=R.ctxs[11]; y=cx.y; G12.y=y;
    var pcn=cx.at(0.5,-1),A0=cx.at(0.5,8.5),B0=cx.at(0.5,-9.5),h=cx.at(0.5,0);
    var Af=findFree(A0.x,A0.z,y,1.3),Bf=findFree(B0.x,B0.z,y,1.3);
    G12.A=Af;G12.B=Bf;G12.c={x:pcn.x,z:pcn.z};
    G12.pondOb=null; L.obstacles.forEach(function(o){ if(Math.abs(o.x-pcn.x)<0.6&&Math.abs(o.z-pcn.z)<0.6&&o.r>4&&o.h<1) G12.pondOb=o; });
    var dB=Math.hypot(Bf.x-pcn.x,Bf.z-pcn.z),uB={x:(Bf.x-pcn.x)/dB,z:(Bf.z-pcn.z)/dB};
    G12.mB={x:pcn.x+uB.x*1.0,z:pcn.z+uB.z*1.0};
    G12.r1={x:pcn.x-h.hx*7.8,z:pcn.z-h.hz*7.8}; var r1f=findFree(G12.r1.x,G12.r1.z,y,0.8); G12.r1=r1f;
    pad('bridge_meet',Af.x,y,Af.z,0xaee0ff,'ابدئي');
    var ringB=new T.Mesh(new T.RingGeometry(0.85,1.05,28),bas(0xaee0ff,0.55)); ringB.rotation.x=-PI/2; ringB.position.set(Bf.x,y+0.14,Bf.z); W.scene.add(ringB);
    G12.stones=[];
    var N1=6,stone=function(px2,pz2){ var m=new T.Mesh(new T.CylinderGeometry(0.62,0.62,0.16,16),new T.MeshStandardMaterial({color:0xcfe8ff,emissive:0x5aa0d8,roughness:0.4})); m.position.set(px2,y+0.2,pz2); m.visible=false; W.scene.add(m); var hl=halo(0xaee0ff,2.2,0.5); hl.position.set(px2,y+0.5,pz2); hl.visible=false; W.scene.add(hl); G12.stones.push({m:m,hl:hl,k:0}); };
    for(var i=0;i<N1;i++){ var tt=(i+0.5)/N1; stone(G.lerp(Af.x,pcn.x,tt*0.88),G.lerp(Af.z,pcn.z,tt*0.88)); }
    for(var j=0;j<N1;j++){ var t2=(j+0.5)/N1; stone(G.lerp(Bf.x,pcn.x,t2*0.88),G.lerp(Bf.z,pcn.z,t2*0.88)); }
    G12.core=new T.Mesh(new T.CylinderGeometry(1.5,1.5,0.14,24),new T.MeshStandardMaterial({color:0xfff2d0,emissive:0xb98a3a,roughness:0.4})); G12.core.position.set(pcn.x,y+0.2,pcn.z); G12.core.visible=false; W.scene.add(G12.core);
    // نجوم الحجارة: ترتيب ظهور من جهة A ثم B بالتناوب
    var ord=[]; for(var q=0;q<N1;q++){ ord.push(G12.stones[q]); ord.push(G12.stones[N1+q]); } G12.stones=ord;
    // المنتصف يظهر عند اكتمال الظهور (يُدار في النشاط)

    // ---- طريق السماء (الجزر السبع) ----
    var sky=R.sky;
    var idx=0;
    sky.forEach(function(s,i){
      var side=(i%2?1:-1);
      var c1=findFree(s.ix+side*4.2,s.iz-1.5-((i*1.7)%3),s.iy,1.1);
      var mid={x:(s.ex+s.bx)/2,z:(s.ez+s.bz)/2,y:(s.iy+s.by)/2};
      [{x:c1.x,z:c1.z,y:s.iy+1.5},{x:mid.x,z:mid.z,y:mid.y+1.5}].forEach(function(p){
        var g=new T.Group(); add(g,new T.Mesh(new T.IcosahedronGeometry(0.4,0),new T.MeshStandardMaterial({color:0xffe08a,emissive:0xd9a21b,roughness:0.3})),0,0,0);
        add(g,halo(0xffe9b0,2.6,0.8),0,0,0); g.position.set(p.x,p.y,p.z); g.visible=false; W.scene.add(g);
        stars.items.push({g:g,x:p.x,z:p.z,y:p.y,ph:idx++*0.9});
      });
    });
    var s0=sky[0],pp0=findFree(s0.ix,s0.iz+3,s0.iy,1.2); pad('stars',pp0.x,s0.iy,pp0.z,0xffe9b0,'نجوم');
    // قلب النجوم (يظهر عند الاكتمال)
    var last=sky[sky.length-1];
    for(var hI=0;hI<NSTAR;hI++){
      var tt2=hI/NSTAR*PI*2,hx=16*Math.pow(Math.sin(tt2),3),hy=13*Math.cos(tt2)-5*Math.cos(2*tt2)-2*Math.cos(3*tt2)-Math.cos(4*tt2);
      var hg=new T.Group(); add(hg,new T.Mesh(new T.SphereGeometry(0.28,8,6),bas(0xfff3c4)),0,0,0); add(hg,halo(0xffd9a0,3.2,0.85),0,0,0);
      hg.position.set(last.bx+hx*0.55,last.by+24+hy*0.55,last.bz-14); hg.visible=false; W.scene.add(hg); stars.heart.push(hg);
    }
    stars.items.forEach(function(s,i){ s.g.position.y=s.y; });
    applyState();
  };
})();
